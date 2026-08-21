import csv
import io

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.import_batch import ImportBatch
from app.models.user import User
from app.services.customer import generate_customer_code

REQUIRED_COLUMNS = ["company_name"]
MAX_ROWS = 5000
MAX_ERROR_REPORT_LINES = 200

CUSTOMER_TEXT_FIELDS = [
    "tax_no",
    "tax_office",
    "email",
    "phone",
    "mobile",
    "address",
    "city",
    "district",
    "country",
    "notes",
]


def _clean(value: str | None) -> str | None:
    return value.strip() if value else None


def parse_csv(content: bytes) -> tuple[list[str], list[dict]]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dosya UTF-8 kodlu değil. Dosyayı UTF-8 olarak kaydedin.",
        )
    reader = csv.DictReader(io.StringIO(text))
    columns = reader.fieldnames or []
    rows: list[dict] = []
    for idx, row in enumerate(reader, start=2):
        rows.append({"row": idx, "data": {k: _clean(v) for k, v in row.items()}})
        if len(rows) >= MAX_ROWS:
            break
    return columns, rows


def build_preview(content: bytes, filename: str) -> dict:
    columns, rows = parse_csv(content)
    missing = [column for column in REQUIRED_COLUMNS if column not in columns]
    return {
        "filename": filename,
        "columns": columns,
        "total_rows": len(rows),
        "sample": rows[:20],
        "header_valid": not missing,
        "missing_required": missing,
    }


def run_import(db: Session, content: bytes, filename: str, user: User) -> ImportBatch:
    columns, rows = parse_csv(content)
    missing = [column for column in REQUIRED_COLUMNS if column not in columns]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Eksik zorunlu sütunlar: {', '.join(missing)}",
        )

    batch = ImportBatch(
        source="csv",
        filename=filename,
        status="running",
        total_rows=len(rows),
        created_by=user.id,
    )
    db.add(batch)
    db.commit()

    errors: list[str] = []
    success = 0
    failed = 0

    def _record_failure(row_number: int, reason: str) -> None:
        nonlocal failed
        failed += 1
        errors.append(f"Satır {row_number}: {reason}")

    try:
        for item in rows:
            data = item["data"]
            company_name = data.get("company_name")
            if not company_name:
                _record_failure(item["row"], "firma adı boş")
                continue

            tax_no = data.get("tax_no")
            if tax_no:
                existing = db.scalar(
                    select(Customer).where(
                        Customer.tax_no == tax_no, Customer.is_active == True
                    )
                )
                if existing is not None:
                    _record_failure(
                        item["row"],
                        f"vergi no zaten mevcut ({existing.customer_code})",
                    )
                    continue

            customer = Customer(
                customer_code=generate_customer_code(db),
                company_name=company_name,
                customer_type=data.get("customer_type") or "company",
                **{field: data.get(field) for field in CUSTOMER_TEXT_FIELDS},
            )
            db.add(customer)
            success += 1
            db.flush()

        batch.success_rows = success
        batch.failed_rows = failed
        batch.status = "completed"
        batch.error_report = "\n".join(errors[:MAX_ERROR_REPORT_LINES]) or None
        db.commit()
    except Exception:
        db.rollback()
        batch.status = "failed"
        db.commit()
        raise

    return batch

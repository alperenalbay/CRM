from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permissions
from app.models.import_batch import ImportBatch
from app.models.user import User
from app.schemas.import_data import ImportBatchOut, ImportPreviewOut
from app.services import import_data as import_service

router = APIRouter(prefix="/imports", tags=["imports"])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.get("", response_model=list[ImportBatchOut])
def list_imports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("imports.view")),
) -> list[ImportBatch]:
    stmt = select(ImportBatch).order_by(ImportBatch.id.desc()).limit(50)
    return list(db.scalars(stmt))


@router.post("/preview", response_model=ImportPreviewOut)
async def preview_import(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("imports.preview")),
) -> ImportPreviewOut:
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Dosya 5 MB'dan büyük.",
        )
    return import_service.build_preview(content, file.filename or "upload.csv")


@router.post("", response_model=ImportBatchOut, status_code=status.HTTP_201_CREATED)
async def run_import(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("imports.run")),
) -> ImportBatch:
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Dosya 5 MB'dan büyük.",
        )
    return import_service.run_import(db, content, file.filename or "upload.csv", current_user)


@router.get("/{batch_id}", response_model=ImportBatchOut)
def get_import(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("imports.view")),
) -> ImportBatch:
    batch = db.get(ImportBatch, batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Import kaydı bulunamadı."
        )
    return batch

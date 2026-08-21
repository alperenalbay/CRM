from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImportPreviewRow(BaseModel):
    row: int
    data: dict[str, str | None]


class ImportPreviewOut(BaseModel):
    filename: str
    columns: list[str]
    total_rows: int
    sample: list[ImportPreviewRow]
    header_valid: bool
    missing_required: list[str]


class ImportBatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    filename: str
    status: str
    total_rows: int
    success_rows: int
    failed_rows: int
    error_report: str | None = None
    created_at: datetime

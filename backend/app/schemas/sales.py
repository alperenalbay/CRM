from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    code: str
    name: str
    unit_price: float
    vat_rate: float = 20
    unit: str | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    unit_price: float | None = None
    vat_rate: float | None = None
    unit: str | None = None
    is_active: bool | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool = True


class SalesOrderItemIn(BaseModel):
    product_id: int
    quantity: float = 1
    unit_price: float | None = None


class SalesOrderItemOut(BaseModel):
    id: int
    product_id: int
    product_code: str | None = None
    product_name: str | None = None
    quantity: float
    unit_price: float
    line_total: float


class SalesOrderCreate(BaseModel):
    customer_id: int
    order_date: date | None = None
    status: str = "draft"
    items: list[SalesOrderItemIn] = []


class SalesOrderUpdate(BaseModel):
    status: str | None = None


class SalesOrderOut(BaseModel):
    id: int
    order_no: str
    customer_id: int
    customer_name: str | None = None
    order_date: date
    total_amount: float
    status: str
    created_by_name: str | None = None
    created_at: datetime


class SalesOrderDetailOut(SalesOrderOut):
    items: list[SalesOrderItemOut] = []

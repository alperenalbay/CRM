from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class CustomerContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    is_primary: bool = False


class CustomerBase(BaseModel):
    company_name: str
    customer_type: str = "company"
    tax_no: str | None = None
    tax_office: str | None = None
    email: str | None = None
    phone: str | None = None
    mobile: str | None = None
    address: str | None = None
    city: str | None = None
    district: str | None = None
    country: str | None = "Türkiye"
    notes: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: str | None = None
    customer_type: str | None = None
    tax_no: str | None = None
    tax_office: str | None = None
    email: str | None = None
    phone: str | None = None
    mobile: str | None = None
    address: str | None = None
    city: str | None = None
    district: str | None = None
    country: str | None = None
    notes: str | None = None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_code: str
    created_at: datetime
    updated_at: datetime
    contacts: list[CustomerContactOut] = []


class TicketHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_no: str
    subject: str
    priority: str
    status_name: str | None = None
    created_at: datetime


class OrderHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    order_date: date
    total_amount: float
    status: str


class CustomerHistoryOut(BaseModel):
    customer: CustomerOut
    tickets: list[TicketHistoryOut] = []
    orders: list[OrderHistoryOut] = []

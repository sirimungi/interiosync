from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# Auth
class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str


class UserOut(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Projects
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    designer_id: int
    client_id: int


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectOut(ProjectBase):
    id: int
    designer_id: int
    client_id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectOutWithRelations(ProjectOut):
    designer: UserOut
    client: UserOut

    class Config:
        from_attributes = True


# Tasks
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None


class TaskCreate(TaskBase):
    project_id: int
    status: Optional[str] = "todo"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TaskOut(TaskBase):
    id: int
    project_id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Files
class FileBase(BaseModel):
    filename: str


class FileCreate(FileBase):
    project_id: int
    url: str


class FileOut(FileBase):
    id: int
    project_id: int
    url: str
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Messages
class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    project_id: int


class MessageOut(MessageBase):
    id: int
    project_id: int
    sender_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageOutWithSender(MessageOut):
    sender: UserOut

    class Config:
        from_attributes = True


# Quote Line Items
class QuoteLineItemBase(BaseModel):
    description: str
    category: str = "material"
    quantity: float = 1
    unit: str = "pcs"
    unit_price: float = 0
    dimensions: Optional[str] = None


class QuoteLineItemCreate(QuoteLineItemBase):
    pass


class QuoteLineItemUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    dimensions: Optional[str] = None


class QuoteLineItemOut(QuoteLineItemBase):
    id: int
    quote_id: int
    line_total: float

    class Config:
        from_attributes = True


# Quotes
class QuoteBase(BaseModel):
    title: str
    notes: Optional[str] = None
    gst_rate: float = 18
    valid_until: Optional[datetime] = None


class QuoteCreate(QuoteBase):
    project_id: int


class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    gst_rate: Optional[float] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = None


class QuoteRespond(BaseModel):
    action: str  # "accept" or "reject"
    client_response: Optional[str] = None


class QuoteOut(QuoteBase):
    id: int
    project_id: int
    status: str
    currency: str
    subtotal: float
    gst_amount: float
    total_amount: float
    created_by: int
    client_response: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[QuoteLineItemOut] = []

    class Config:
        from_attributes = True


class QuoteOutWithRelations(QuoteOut):
    creator: UserOut
    project: ProjectOut

    class Config:
        from_attributes = True


# Appointments
class AppointmentBase(BaseModel):
    type: str = "quotation_meeting"
    scheduled_at: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    project_id: Optional[int] = None
    assigned_to: int


class AppointmentUpdate(BaseModel):
    type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(AppointmentBase):
    id: int
    project_id: Optional[int] = None
    status: str
    assigned_to: int
    created_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AppointmentOutWithRelations(AppointmentOut):
    assignee: UserOut
    creator: UserOut
    project: Optional[ProjectOut] = None

    class Config:
        from_attributes = True


# Leads
class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    style_pref: Optional[str] = None
    budget_range: Optional[str] = None
    source: Optional[str] = "public_form"


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    style_pref: Optional[str] = None
    budget_range: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    style_pref: Optional[str] = None
    budget_range: Optional[str] = None
    source: str
    status: str
    notes: Optional[str] = None
    converted_user_id: Optional[int] = None
    converted_project_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadConvertRequest(BaseModel):
    project_name: Optional[str] = None  # override auto-generated project name


class LeadConvertResponse(BaseModel):
    lead: LeadOut
    user_id: int
    project_id: int
    email_sent: bool
    temp_password: Optional[str] = None  # only set when email could not be sent

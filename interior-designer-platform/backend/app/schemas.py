from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Auth
class UserBase(BaseModel):
    name: str
    email: str


class UserCreate(UserBase):
    password: str
    role: str


class UserOut(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
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

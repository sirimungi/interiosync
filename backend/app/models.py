from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # designer, client, employee
    created_at = Column(DateTime, default=datetime.utcnow)
    projects_designed = relationship("Project", back_populates="designer", foreign_keys="Project.designer_id")
    projects_as_client = relationship("Project", back_populates="client", foreign_keys="Project.client_id")
    messages_sent = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    designer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    quotes = relationship("Quote", back_populates="project", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="project", cascade="all, delete-orphan")
    designer = relationship("User", back_populates="projects_designed", foreign_keys=[designer_id])
    client = relationship("User", back_populates="projects_as_client", foreign_keys=[client_id])


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="todo")  # todo, in_progress, done
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="tasks")


class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    url = Column(String(512), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="files")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent", foreign_keys=[sender_id])


class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="draft")  # draft, sent, accepted, rejected
    currency = Column(String(10), default="INR")
    subtotal = Column(Numeric(12, 2), default=0)
    gst_rate = Column(Numeric(5, 2), default=18)
    gst_amount = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), default=0)
    valid_until = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    client_response = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="quotes")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("QuoteLineItem", back_populates="quote", cascade="all, delete-orphan")


class QuoteLineItem(Base):
    __tablename__ = "quote_line_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False)
    description = Column(String(500), nullable=False)
    category = Column(String(100), default="material")  # labour, material, furniture, other
    quantity = Column(Numeric(10, 2), default=1)
    unit = Column(String(50), default="pcs")
    unit_price = Column(Numeric(12, 2), default=0)
    line_total = Column(Numeric(12, 2), default=0)
    dimensions = Column(Text, nullable=True)
    quote = relationship("Quote", back_populates="items")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    type = Column(String(100), default="quotation_meeting")  # quotation_meeting, site_visit, follow_up, other
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="appointments")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    message = Column(Text, nullable=True)
    style_pref = Column(String(100), nullable=True)   # modern/traditional/contemporary/minimalist/other
    budget_range = Column(String(100), nullable=True)  # e.g. "5L - 10L"
    source = Column(String(50), default="public_form")  # public_form | manual
    status = Column(String(50), default="new")  # new/contacted/converted/closed
    notes = Column(Text, nullable=True)
    converted_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    converted_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

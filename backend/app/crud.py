import random
import string
from sqlalchemy.orm import Session
from . import models, schemas
from .utils import hash_password
from datetime import datetime


# Users
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed = hash_password(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed,
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session, role: str = None, skip: int = 0, limit: int = 100):
    q = db.query(models.User)
    if role:
        q = q.filter(models.User.role == role)
    return q.offset(skip).limit(limit).all()


# Projects
def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_projects(
    db: Session,
    user_id: int = None,
    role: str = None,
    skip: int = 0,
    limit: int = 100,
):
    q = db.query(models.Project)
    if user_id and role:
        if role == "designer":
            q = q.filter(models.Project.designer_id == user_id)
        elif role == "client":
            q = q.filter(models.Project.client_id == user_id)
        elif role == "employee":
            q = q.filter(
                (models.Project.designer_id == user_id) | (models.Project.client_id == user_id)
            )
    return q.offset(skip).limit(limit).all()


def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, project_id: int, data: schemas.ProjectUpdate):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_project, k, v)
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False


# Tasks
def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def get_tasks_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, data: schemas.TaskUpdate):
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_task, k, v)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False


# Files
def get_file(db: Session, file_id: int):
    return db.query(models.File).filter(models.File.id == file_id).first()


def get_files_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.File)
        .filter(models.File.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_file(db: Session, file: schemas.FileCreate):
    db_file = models.File(**file.model_dump())
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def delete_file(db: Session, file_id: int):
    db_file = get_file(db, file_id)
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False


# Messages
def get_message(db: Session, message_id: int):
    return db.query(models.Message).filter(models.Message.id == message_id).first()


def get_messages_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Message)
        .filter(models.Message.project_id == project_id)
        .order_by(models.Message.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_message(db: Session, message: schemas.MessageCreate, sender_id: int):
    db_message = models.Message(**message.model_dump(), sender_id=sender_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


# ── Quotes ────────────────────────────────────────────────────────────────────

def _recalculate_quote(db: Session, quote: models.Quote) -> models.Quote:
    subtotal = sum(float(item.line_total) for item in quote.items)
    gst_amount = round(subtotal * float(quote.gst_rate) / 100, 2)
    quote.subtotal = subtotal
    quote.gst_amount = gst_amount
    quote.total_amount = round(subtotal + gst_amount, 2)
    db.commit()
    db.refresh(quote)
    return quote


def get_quote(db: Session, quote_id: int):
    return db.query(models.Quote).filter(models.Quote.id == quote_id).first()


def get_quotes(
    db: Session,
    project_id: int = None,
    user_id: int = None,
    role: str = None,
    skip: int = 0,
    limit: int = 100,
):
    q = db.query(models.Quote)
    if project_id:
        q = q.filter(models.Quote.project_id == project_id)
        # Clients never see draft quotes even per-project
        if role == "client":
            q = q.filter(models.Quote.status != "draft")
    elif user_id and role:
        if role == "designer":
            q = q.join(models.Project).filter(models.Project.designer_id == user_id)
        elif role == "client":
            # Clients only see quotes that have been sent/accepted/rejected
            q = q.join(models.Project).filter(
                models.Project.client_id == user_id,
                models.Quote.status != "draft",
            )
    return q.order_by(models.Quote.created_at.desc()).offset(skip).limit(limit).all()


def create_quote(db: Session, quote: schemas.QuoteCreate, created_by: int):
    db_quote = models.Quote(
        project_id=quote.project_id,
        title=quote.title,
        notes=quote.notes,
        gst_rate=quote.gst_rate,
        valid_until=quote.valid_until,
        created_by=created_by,
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote


def update_quote(db: Session, quote_id: int, data: schemas.QuoteUpdate):
    db_quote = get_quote(db, quote_id)
    if not db_quote:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_quote, k, v)
    db.commit()
    db.refresh(db_quote)
    if "gst_rate" in update_data:
        _recalculate_quote(db, db_quote)
    return db_quote


def respond_quote(db: Session, quote_id: int, data: schemas.QuoteRespond):
    db_quote = get_quote(db, quote_id)
    if not db_quote:
        return None
    if data.action == "accept":
        db_quote.status = "accepted"
    elif data.action == "reject":
        db_quote.status = "rejected"
    if data.client_response:
        db_quote.client_response = data.client_response
    db.commit()
    db.refresh(db_quote)
    return db_quote


def delete_quote(db: Session, quote_id: int):
    db_quote = get_quote(db, quote_id)
    if db_quote:
        db.delete(db_quote)
        db.commit()
        return True
    return False


# Quote line items
def get_quote_item(db: Session, item_id: int):
    return db.query(models.QuoteLineItem).filter(models.QuoteLineItem.id == item_id).first()


def create_quote_item(db: Session, quote_id: int, item: schemas.QuoteLineItemCreate):
    line_total = round(item.quantity * item.unit_price, 2)
    db_item = models.QuoteLineItem(
        quote_id=quote_id,
        description=item.description,
        category=item.category,
        quantity=item.quantity,
        unit=item.unit,
        unit_price=item.unit_price,
        line_total=line_total,
        dimensions=item.dimensions,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    quote = get_quote(db, quote_id)
    _recalculate_quote(db, quote)
    return db_item


def update_quote_item(db: Session, item_id: int, data: schemas.QuoteLineItemUpdate):
    db_item = get_quote_item(db, item_id)
    if not db_item:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_item, k, v)
    db_item.line_total = round(float(db_item.quantity) * float(db_item.unit_price), 2)
    db.commit()
    db.refresh(db_item)
    quote = get_quote(db, db_item.quote_id)
    _recalculate_quote(db, quote)
    return db_item


def delete_quote_item(db: Session, item_id: int):
    db_item = get_quote_item(db, item_id)
    if db_item:
        quote_id = db_item.quote_id
        db.delete(db_item)
        db.commit()
        quote = get_quote(db, quote_id)
        if quote:
            _recalculate_quote(db, quote)
        return True
    return False


# ── Appointments ──────────────────────────────────────────────────────────────

def get_appointment(db: Session, appointment_id: int):
    return db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()


def get_appointments(
    db: Session,
    project_id: int = None,
    user_id: int = None,
    role: str = None,
    skip: int = 0,
    limit: int = 100,
):
    q = db.query(models.Appointment)
    if project_id:
        q = q.filter(models.Appointment.project_id == project_id)
    elif user_id and role:
        if role == "designer":
            q = q.filter(
                (models.Appointment.created_by == user_id) |
                (models.Appointment.assigned_to == user_id)
            )
        elif role == "client":
            q = q.join(models.Project, models.Appointment.project_id == models.Project.id, isouter=True).filter(
                (models.Project.client_id == user_id) |
                (models.Appointment.assigned_to == user_id)
            )
        elif role == "employee":
            q = q.filter(models.Appointment.assigned_to == user_id)
    return q.order_by(models.Appointment.scheduled_at).offset(skip).limit(limit).all()


def create_appointment(db: Session, appt: schemas.AppointmentCreate, created_by: int):
    db_appt = models.Appointment(
        project_id=appt.project_id,
        type=appt.type,
        scheduled_at=appt.scheduled_at,
        duration_minutes=appt.duration_minutes,
        notes=appt.notes,
        assigned_to=appt.assigned_to,
        created_by=created_by,
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt


def update_appointment(db: Session, appointment_id: int, data: schemas.AppointmentUpdate):
    db_appt = get_appointment(db, appointment_id)
    if not db_appt:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_appt, k, v)
    db.commit()
    db.refresh(db_appt)
    return db_appt


def delete_appointment(db: Session, appointment_id: int):
    db_appt = get_appointment(db, appointment_id)
    if db_appt:
        db.delete(db_appt)
        db.commit()
        return True
    return False


# ── Leads ─────────────────────────────────────────────────────────────────────

def get_lead(db: Session, lead_id: int):
    return db.query(models.Lead).filter(models.Lead.id == lead_id).first()


def get_leads(
    db: Session,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
):
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    return q.order_by(models.Lead.created_at.desc()).offset(skip).limit(limit).all()


def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def update_lead(db: Session, lead_id: int, data: schemas.LeadUpdate):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_lead, k, v)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def convert_lead_to_client(
    db: Session,
    lead_id: int,
    designer_id: int,
    project_name: str = None,
) -> dict:
    """
    Creates a client User account and a Project from a Lead.
    Returns a dict with the new user, project, temp_password, and lead.
    """
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    if db_lead.status == "converted":
        return None

    # Check if a user already exists for this email
    existing_user = get_user_by_email(db, db_lead.email)
    if existing_user:
        new_user = existing_user
        temp_password = None
    else:
        # Generate a random temporary password
        temp_password = "".join(
            random.choices(string.ascii_letters + string.digits, k=10)
        )
        new_user = models.User(
            name=db_lead.name,
            email=db_lead.email,
            password_hash=hash_password(temp_password),
            role="client",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    # Build a project name
    if not project_name:
        project_name = f"{db_lead.name}'s Project"

    new_project = models.Project(
        name=project_name,
        description=db_lead.message or "",
        designer_id=designer_id,
        client_id=new_user.id,
        status="active",
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Update the lead
    db_lead.status = "converted"
    db_lead.converted_user_id = new_user.id
    db_lead.converted_project_id = new_project.id
    db.commit()
    db.refresh(db_lead)

    return {
        "lead": db_lead,
        "user": new_user,
        "project": new_project,
        "temp_password": temp_password,
    }

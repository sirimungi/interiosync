from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..database import get_db
from ..utils import get_current_user

router = APIRouter()


def _get_appt_or_404(db: Session, appointment_id: int):
    appt = crud.get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


def _can_access(appt: models.Appointment, user: models.User) -> bool:
    if user.role == "designer":
        return appt.created_by == user.id or appt.assigned_to == user.id
    if user.role == "client":
        if appt.project and appt.project.client_id == user.id:
            return True
        return appt.assigned_to == user.id
    if user.role == "employee":
        return appt.assigned_to == user.id
    return False


@router.get("", response_model=list[schemas.AppointmentOutWithRelations])
def list_appointments(
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_appointments(
        db,
        project_id=project_id,
        user_id=current_user.id,
        role=current_user.role,
    )


@router.post("", response_model=schemas.AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    data: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ("designer",):
        raise HTTPException(status_code=403, detail="Only designers can schedule appointments")
    if data.project_id:
        project = crud.get_project(db, data.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
    return crud.create_appointment(db, data, created_by=current_user.id)


@router.get("/{appointment_id}", response_model=schemas.AppointmentOutWithRelations)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _get_appt_or_404(db, appointment_id)
    if not _can_access(appt, current_user):
        raise HTTPException(status_code=403, detail="Not allowed")
    return appt


@router.patch("/{appointment_id}", response_model=schemas.AppointmentOut)
def update_appointment(
    appointment_id: int,
    data: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _get_appt_or_404(db, appointment_id)
    if current_user.role != "designer" or appt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can update this appointment")
    updated = crud.update_appointment(db, appointment_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _get_appt_or_404(db, appointment_id)
    if current_user.role != "designer" or appt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this appointment")
    crud.delete_appointment(db, appointment_id)

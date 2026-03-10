from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import crud, schemas
from ..utils import get_current_user
from .. import models
from ..email_service import send_client_credentials

router = APIRouter()


# ── Public inquiry form (no auth required) ────────────────────────────────────

@router.post("", response_model=schemas.LeadOut, status_code=status.HTTP_201_CREATED)
def submit_inquiry(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    """Public endpoint — any visitor can submit an inquiry form."""
    lead.source = "public_form"
    return crud.create_lead(db, lead)


# ── Designer-only endpoints ───────────────────────────────────────────────────

def _require_designer(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "designer":
        raise HTTPException(status_code=403, detail="Designer access required")
    return current_user


@router.post("/manual", response_model=schemas.LeadOut, status_code=status.HTTP_201_CREATED)
def add_manual_lead(
    lead: schemas.LeadCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_require_designer),
):
    """Designer manually adds a lead from the dashboard."""
    lead.source = "manual"
    return crud.create_lead(db, lead)


@router.get("", response_model=List[schemas.LeadOut])
def list_leads(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_require_designer),
):
    return crud.get_leads(db, status=status, skip=skip, limit=limit)


@router.get("/{lead_id}", response_model=schemas.LeadOut)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_require_designer),
):
    lead = crud.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=schemas.LeadOut)
def update_lead(
    lead_id: int,
    data: schemas.LeadUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_require_designer),
):
    lead = crud.update_lead(db, lead_id, data)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/convert", response_model=schemas.LeadConvertResponse)
def convert_lead(
    lead_id: int,
    req: schemas.LeadConvertRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(_require_designer),
):
    """
    Converts a lead into a client account + project.
    If SMTP is configured an email with credentials is sent automatically.
    Otherwise the temp_password is returned in the response for manual sharing.
    """
    existing = crud.get_lead(db, lead_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    if existing.status == "converted":
        raise HTTPException(status_code=400, detail="Lead already converted")

    result = crud.convert_lead_to_client(
        db,
        lead_id=lead_id,
        designer_id=current_user.id,
        project_name=req.project_name,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Conversion failed")

    email_sent = False
    temp_password_for_response: Optional[str] = None

    if result["temp_password"]:
        email_sent = send_client_credentials(
            to_email=result["user"].email,
            to_name=result["user"].name,
            temp_password=result["temp_password"],
            designer_name=current_user.name,
            project_name=result["project"].name,
        )
        if not email_sent:
            # Surface the password so the designer can share it manually
            temp_password_for_response = result["temp_password"]

    return schemas.LeadConvertResponse(
        lead=schemas.LeadOut.model_validate(result["lead"]),
        user_id=result["user"].id,
        project_id=result["project"].id,
        email_sent=email_sent,
        temp_password=temp_password_for_response,
    )

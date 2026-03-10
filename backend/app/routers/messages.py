from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..database import get_db
from ..utils import get_current_user

router = APIRouter()


def _can_access_project(db: Session, project_id: int, user: models.User) -> bool:
    project = crud.get_project(db, project_id)
    if not project:
        return False
    if user.role == "designer" and project.designer_id == user.id:
        return True
    if user.role == "client" and project.client_id == user.id:
        return True
    if user.role == "employee":
        return project.designer_id == user.id or project.client_id == user.id
    return False


class MessageCreateWithProject(schemas.MessageBase):
    project_id: int


@router.get("", response_model=list[schemas.MessageOutWithSender])
def list_messages(
    project_id: int = Query(..., description="Filter by project"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this project")
    return crud.get_messages_by_project(db, project_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.MessageOutWithSender, status_code=201)
def create_message(
    body: MessageCreateWithProject,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _can_access_project(db, body.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to send messages in this project")
    msg = crud.create_message(db, schemas.MessageCreate(project_id=body.project_id, content=body.content), sender_id=current_user.id)
    return msg


@router.get("/{message_id}", response_model=schemas.MessageOutWithSender)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    msg = crud.get_message(db, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if not _can_access_project(db, msg.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this message")
    return msg

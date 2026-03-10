import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..config import UPLOAD_DIR
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


@router.get("", response_model=list[schemas.FileOut])
def list_files(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this project")
    return crud.get_files_by_project(db, project_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.FileOut, status_code=201)
async def upload_file(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to upload to this project")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1] or ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, unique_name)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    url = f"/uploads/{unique_name}"
    db_file = crud.create_file(db, schemas.FileCreate(project_id=project_id, filename=file.filename or unique_name, url=url))
    return db_file


@router.get("/{file_id}", response_model=schemas.FileOut)
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    f = crud.get_file(db, file_id)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    if not _can_access_project(db, f.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this file")
    return f


@router.delete("/{file_id}", status_code=204)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    f = crud.get_file(db, file_id)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    if not _can_access_project(db, f.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to delete this file")
    crud.delete_file(db, file_id)

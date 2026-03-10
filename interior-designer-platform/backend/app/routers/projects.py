from fastapi import APIRouter, Depends, HTTPException, status
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


@router.get("", response_model=list[schemas.ProjectOutWithRelations])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
):
    projects = crud.get_projects(db, user_id=current_user.id, role=current_user.role, skip=skip, limit=limit)
    return projects


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "designer":
        raise HTTPException(status_code=403, detail="Only designers can create projects")
    if project.designer_id != current_user.id:
        raise HTTPException(status_code=403, detail="designer_id must match current user")
    return crud.create_project(db, project)


@router.get("/{project_id}", response_model=schemas.ProjectOutWithRelations)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this project")
    return project


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    data: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to update this project")
    project = crud.update_project(db, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to delete this project")
    if not crud.delete_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")

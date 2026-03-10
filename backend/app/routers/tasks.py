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


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(
    project_id: int = Query(..., description="Filter by project"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    if not _can_access_project(db, project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this project")
    return crud.get_tasks_by_project(db, project_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _can_access_project(db, task.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to add tasks to this project")
    return crud.create_task(db, task)


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _can_access_project(db, task.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to access this task")
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _can_access_project(db, task.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to update this task")
    return crud.update_task(db, task_id, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _can_access_project(db, task.project_id, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to delete this task")
    crud.delete_task(db, task_id)

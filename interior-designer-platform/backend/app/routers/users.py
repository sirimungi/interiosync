from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..database import get_db
from ..utils import get_current_user

router = APIRouter()


@router.get("", response_model=list[schemas.UserOut])
def list_users(
    role: str = Query(None, description="Filter by role: designer, client, employee"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    return crud.get_users(db, role=role, skip=skip, limit=limit)

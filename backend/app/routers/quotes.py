from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..database import get_db
from ..utils import get_current_user

router = APIRouter()


def _get_quote_or_404(db: Session, quote_id: int):
    quote = crud.get_quote(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


def _assert_can_access_quote(quote: models.Quote, user: models.User):
    project = quote.project
    if user.role == "designer" and project.designer_id == user.id:
        return
    if user.role == "client" and project.client_id == user.id:
        return
    if user.role == "employee":
        return
    raise HTTPException(status_code=403, detail="Not allowed to access this quote")


def _assert_designer_owns(quote: models.Quote, user: models.User):
    if user.role != "designer" or quote.project.designer_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project designer can do this")


@router.get("", response_model=list[schemas.QuoteOutWithRelations])
def list_quotes(
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_quotes(
        db,
        project_id=project_id,
        user_id=current_user.id,
        role=current_user.role,
    )


@router.post("", response_model=schemas.QuoteOut, status_code=status.HTTP_201_CREATED)
def create_quote(
    data: schemas.QuoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "designer":
        raise HTTPException(status_code=403, detail="Only designers can create quotes")
    project = crud.get_project(db, data.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.designer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    return crud.create_quote(db, data, created_by=current_user.id)


@router.get("/{quote_id}", response_model=schemas.QuoteOutWithRelations)
def get_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_can_access_quote(quote, current_user)
    return quote


@router.patch("/{quote_id}", response_model=schemas.QuoteOut)
def update_quote(
    quote_id: int,
    data: schemas.QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Cannot edit an accepted or rejected quote")
    return crud.update_quote(db, quote_id, data)


@router.post("/{quote_id}/send", response_model=schemas.QuoteOut)
def send_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status != "draft":
        raise HTTPException(status_code=400, detail="Quote is already sent or finalised")
    return crud.update_quote(db, quote_id, schemas.QuoteUpdate(status="sent"))


@router.post("/{quote_id}/respond", response_model=schemas.QuoteOut)
def respond_quote(
    quote_id: int,
    data: schemas.QuoteRespond,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    if current_user.role != "client" or quote.project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project client can respond to a quote")
    if quote.status != "sent":
        raise HTTPException(status_code=400, detail="Quote must be in 'sent' status to respond")
    if data.action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'reject'")
    return crud.respond_quote(db, quote_id, data)


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft quotes can be deleted")
    crud.delete_quote(db, quote_id)


# ── Line items ────────────────────────────────────────────────────────────────

@router.post("/{quote_id}/items", response_model=schemas.QuoteLineItemOut, status_code=status.HTTP_201_CREATED)
def add_item(
    quote_id: int,
    data: schemas.QuoteLineItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Cannot edit a finalised quote")
    return crud.create_quote_item(db, quote_id, data)


@router.patch("/{quote_id}/items/{item_id}", response_model=schemas.QuoteLineItemOut)
def update_item(
    quote_id: int,
    item_id: int,
    data: schemas.QuoteLineItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Cannot edit a finalised quote")
    item = crud.update_quote_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{quote_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    quote_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = _get_quote_or_404(db, quote_id)
    _assert_designer_owns(quote, current_user)
    if quote.status in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Cannot edit a finalised quote")
    if not crud.delete_quote_item(db, item_id):
        raise HTTPException(status_code=404, detail="Item not found")

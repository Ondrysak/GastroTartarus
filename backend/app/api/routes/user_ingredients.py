import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    UserIngredient,
    UserIngredientCreate,
    UserIngredientPublic,
    UserIngredientsPublic,
    UserIngredientUpdate,
)

router = APIRouter(prefix="/user-ingredients", tags=["user-ingredients"])


@router.get("/", response_model=UserIngredientsPublic)
def read_user_ingredients(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    expiring_soon: bool = Query(default=False),
    days_ahead: int = Query(default=7, ge=1, le=30),
) -> Any:
    """
    Retrieve user ingredients.
    """
    count_statement = select(func.count()).select_from(UserIngredient).where(
        UserIngredient.user_id == current_user.id
    )

    if expiring_soon:
        from datetime import datetime, timedelta
        future_date = datetime.now().date() + timedelta(days=days_ahead)
        count_statement = count_statement.where(
            UserIngredient.expiration_date.is_not(None) &  # type: ignore
            (UserIngredient.expiration_date <= future_date)  # type: ignore
        )

    count = session.exec(count_statement).one()

    user_ingredients = crud.get_user_ingredients(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        expiring_soon=expiring_soon,
        days_ahead=days_ahead
    )
    return UserIngredientsPublic(data=user_ingredients, count=count)


@router.get("/{id}", response_model=UserIngredientPublic)
def read_user_ingredient(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get user ingredient by ID.
    """
    user_ingredient = crud.get_user_ingredient(session=session, user_ingredient_id=id)
    if not user_ingredient:
        raise HTTPException(status_code=404, detail="User ingredient not found")
    if not current_user.is_superuser and (user_ingredient.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return user_ingredient


@router.post("/", response_model=UserIngredientPublic)
def create_user_ingredient(
    *, session: SessionDep, current_user: CurrentUser, user_ingredient_in: UserIngredientCreate
) -> Any:
    """
    Create new user ingredient.
    """
    user_ingredient = crud.create_user_ingredient(
        session=session, user_ingredient_in=user_ingredient_in, user_id=current_user.id
    )
    return user_ingredient


@router.put("/{id}", response_model=UserIngredientPublic)
def update_user_ingredient(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    user_ingredient_in: UserIngredientUpdate,
) -> Any:
    """
    Update a user ingredient.
    """
    user_ingredient = crud.get_user_ingredient(session=session, user_ingredient_id=id)
    if not user_ingredient:
        raise HTTPException(status_code=404, detail="User ingredient not found")
    if not current_user.is_superuser and (user_ingredient.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    user_ingredient = crud.update_user_ingredient(
        session=session, db_user_ingredient=user_ingredient, user_ingredient_in=user_ingredient_in
    )
    return user_ingredient


@router.delete("/{id}")
def delete_user_ingredient(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a user ingredient.
    """
    user_ingredient = crud.get_user_ingredient(session=session, user_ingredient_id=id)
    if not user_ingredient:
        raise HTTPException(status_code=404, detail="User ingredient not found")
    if not current_user.is_superuser and (user_ingredient.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    success = crud.delete_user_ingredient(session=session, user_ingredient_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="User ingredient not found")
    return Message(message="User ingredient deleted successfully")

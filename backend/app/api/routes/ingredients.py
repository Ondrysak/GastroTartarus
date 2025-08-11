import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Ingredient,
    IngredientCreate,
    IngredientPublic,
    IngredientsPublic,
    IngredientUpdate,
    Message,
)

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("/", response_model=IngredientsPublic)
def read_ingredients(
    session: SessionDep,
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    search: str | None = None,
) -> Any:
    """
    Retrieve ingredients.
    """
    count_statement = select(func.count()).select_from(Ingredient)
    if search:
        count_statement = count_statement.where(
            Ingredient.name.icontains(search) | Ingredient.category.icontains(search)  # type: ignore
        )
    count = session.exec(count_statement).one()

    ingredients = crud.get_ingredients(
        session=session, skip=skip, limit=limit, search=search
    )
    return IngredientsPublic(data=ingredients, count=count)


@router.get("/{id}", response_model=IngredientPublic)
def read_ingredient(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get ingredient by ID.
    """
    ingredient = crud.get_ingredient(session=session, ingredient_id=id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.post("/", response_model=IngredientPublic)
def create_ingredient(
    *, session: SessionDep, _current_user: CurrentUser, ingredient_in: IngredientCreate
) -> Any:
    """
    Create new ingredient.
    """
    ingredient = crud.create_ingredient(session=session, ingredient_in=ingredient_in)
    return ingredient


@router.put("/{id}", response_model=IngredientPublic)
def update_ingredient(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    id: uuid.UUID,
    ingredient_in: IngredientUpdate,
) -> Any:
    """
    Update an ingredient.
    """
    ingredient = crud.get_ingredient(session=session, ingredient_id=id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    ingredient = crud.update_ingredient(
        session=session, db_ingredient=ingredient, ingredient_in=ingredient_in
    )
    return ingredient


@router.delete("/{id}")
def delete_ingredient(
    session: SessionDep, _current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an ingredient.
    """
    success = crud.delete_ingredient(session=session, ingredient_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return Message(message="Ingredient deleted successfully")

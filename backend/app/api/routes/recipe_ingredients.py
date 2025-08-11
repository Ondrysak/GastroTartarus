import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    RecipeIngredient,
    RecipeIngredientCreate,
    RecipeIngredientPublic,
    RecipeIngredientsPublic,
    RecipeIngredientUpdate,
)

router = APIRouter(prefix="/recipe-ingredients", tags=["recipe-ingredients"])


@router.get("/", response_model=RecipeIngredientsPublic)
def read_recipe_ingredients(
    session: SessionDep,
    current_user: CurrentUser,
    recipe_id: uuid.UUID = Query(..., description="Recipe ID to get ingredients for"),
    skip: int = 0,
    limit: int = Query(default=100, le=100),
) -> Any:
    """
    Retrieve recipe ingredients for a specific recipe.
    """
    # Check if user owns the recipe or is superuser
    recipe = crud.get_recipe(session=session, recipe_id=recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    count_statement = select(func.count()).select_from(RecipeIngredient).where(
        RecipeIngredient.recipe_id == recipe_id
    )
    count = session.exec(count_statement).one()

    recipe_ingredients = crud.get_recipe_ingredients(
        session=session, recipe_id=recipe_id, skip=skip, limit=limit
    )
    return RecipeIngredientsPublic(data=recipe_ingredients, count=count)


@router.get("/{id}", response_model=RecipeIngredientPublic)
def read_recipe_ingredient(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get recipe ingredient by ID.
    """
    recipe_ingredient = crud.get_recipe_ingredient(session=session, recipe_ingredient_id=id)
    if not recipe_ingredient:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")

    # Check if user owns the recipe
    recipe = crud.get_recipe(session=session, recipe_id=recipe_ingredient.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    return recipe_ingredient


@router.post("/", response_model=RecipeIngredientPublic)
def create_recipe_ingredient(
    *, session: SessionDep, current_user: CurrentUser, recipe_ingredient_in: RecipeIngredientCreate
) -> Any:
    """
    Create new recipe ingredient.
    """
    # Check if user owns the recipe
    recipe = crud.get_recipe(session=session, recipe_id=recipe_ingredient_in.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    recipe_ingredient = crud.create_recipe_ingredient(
        session=session, recipe_ingredient_in=recipe_ingredient_in
    )
    return recipe_ingredient


@router.put("/{id}", response_model=RecipeIngredientPublic)
def update_recipe_ingredient(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    recipe_ingredient_in: RecipeIngredientUpdate,
) -> Any:
    """
    Update a recipe ingredient.
    """
    recipe_ingredient = crud.get_recipe_ingredient(session=session, recipe_ingredient_id=id)
    if not recipe_ingredient:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")

    # Check if user owns the recipe
    recipe = crud.get_recipe(session=session, recipe_id=recipe_ingredient.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    recipe_ingredient = crud.update_recipe_ingredient(
        session=session, db_recipe_ingredient=recipe_ingredient, recipe_ingredient_in=recipe_ingredient_in
    )
    return recipe_ingredient


@router.delete("/{id}")
def delete_recipe_ingredient(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a recipe ingredient.
    """
    recipe_ingredient = crud.get_recipe_ingredient(session=session, recipe_ingredient_id=id)
    if not recipe_ingredient:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")

    # Check if user owns the recipe
    recipe = crud.get_recipe(session=session, recipe_id=recipe_ingredient.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    success = crud.delete_recipe_ingredient(session=session, recipe_ingredient_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe ingredient not found")
    return Message(message="Recipe ingredient deleted successfully")

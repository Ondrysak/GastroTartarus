import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Recipe,
    RecipeCreate,
    RecipePublic,
    RecipesPublic,
    RecipeSuggestionsPublic,
    RecipeUpdate,
)

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("/", response_model=RecipesPublic)
def read_recipes(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    search: str | None = None,
) -> Any:
    """
    Retrieve recipes for the current user.
    """
    count_statement = select(func.count()).select_from(Recipe).where(Recipe.owner_id == current_user.id)
    if search:
        count_statement = count_statement.where(
            Recipe.name.icontains(search) |  # type: ignore
            Recipe.description.icontains(search) |  # type: ignore
            Recipe.cuisine.icontains(search)  # type: ignore
        )
    count = session.exec(count_statement).one()

    recipes = crud.get_recipes(
        session=session, owner_id=current_user.id, skip=skip, limit=limit, search=search
    )
    return RecipesPublic(data=recipes, count=count)


@router.get("/suggestions", response_model=RecipeSuggestionsPublic)
def get_recipe_suggestions(
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = Query(default=10, le=50),
    min_match_score: float = Query(default=0.3, ge=0.0, le=1.0),
) -> Any:
    """
    Get recipe suggestions based on available ingredients.
    """
    suggestions = crud.get_recipe_suggestions(
        session=session,
        user_id=current_user.id,
        limit=limit,
        min_match_score=min_match_score
    )
    return RecipeSuggestionsPublic(data=suggestions, count=len(suggestions))


@router.get("/{id}", response_model=RecipePublic)
def read_recipe(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get recipe by ID.
    """
    recipe = crud.get_recipe(session=session, recipe_id=id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return recipe


@router.post("/", response_model=RecipePublic)
def create_recipe(
    *, session: SessionDep, current_user: CurrentUser, recipe_in: RecipeCreate
) -> Any:
    """
    Create new recipe.
    """
    recipe = crud.create_recipe(
        session=session, recipe_in=recipe_in, owner_id=current_user.id
    )
    return recipe


@router.put("/{id}", response_model=RecipePublic)
def update_recipe(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    recipe_in: RecipeUpdate,
) -> Any:
    """
    Update a recipe.
    """
    recipe = crud.get_recipe(session=session, recipe_id=id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    recipe = crud.update_recipe(
        session=session, db_recipe=recipe, recipe_in=recipe_in
    )
    return recipe


@router.delete("/{id}")
def delete_recipe(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a recipe.
    """
    recipe = crud.get_recipe(session=session, recipe_id=id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    success = crud.delete_recipe(session=session, recipe_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return Message(message="Recipe deleted successfully")

import uuid
from datetime import date
from typing import Any

from sqlmodel import Session, and_, or_, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Ingredient,
    IngredientCreate,
    IngredientUpdate,
    Item,
    ItemCreate,
    Recipe,
    RecipeCreate,
    RecipeIngredient,
    RecipeIngredientCreate,
    RecipeIngredientUpdate,
    RecipeSuggestion,
    RecipeUpdate,
    RecipeWithIngredients,
    User,
    UserCreate,
    UserIngredient,
    UserIngredientCreate,
    UserIngredientUpdate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# Ingredient CRUD operations
def create_ingredient(*, session: Session, ingredient_in: IngredientCreate) -> Ingredient:
    db_ingredient = Ingredient.model_validate(ingredient_in)
    session.add(db_ingredient)
    session.commit()
    session.refresh(db_ingredient)
    return db_ingredient


def get_ingredient(*, session: Session, ingredient_id: uuid.UUID) -> Ingredient | None:
    return session.get(Ingredient, ingredient_id)


def get_ingredients(
    *, session: Session, skip: int = 0, limit: int = 100, search: str | None = None
) -> list[Ingredient]:
    statement = select(Ingredient)
    if search:
        statement = statement.where(
            or_(
                Ingredient.name.icontains(search),  # type: ignore
                Ingredient.category.icontains(search) if Ingredient.category is not None else False  # type: ignore
            )
        )
    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_ingredient(
    *, session: Session, db_ingredient: Ingredient, ingredient_in: IngredientUpdate
) -> Ingredient:
    ingredient_data = ingredient_in.model_dump(exclude_unset=True)
    db_ingredient.sqlmodel_update(ingredient_data)
    session.add(db_ingredient)
    session.commit()
    session.refresh(db_ingredient)
    return db_ingredient


def delete_ingredient(*, session: Session, ingredient_id: uuid.UUID) -> bool:
    ingredient = session.get(Ingredient, ingredient_id)
    if ingredient:
        session.delete(ingredient)
        session.commit()
        return True
    return False


# Recipe CRUD operations
def create_recipe(*, session: Session, recipe_in: RecipeCreate, owner_id: uuid.UUID) -> Recipe:
    db_recipe = Recipe.model_validate(recipe_in, update={"owner_id": owner_id})
    session.add(db_recipe)
    session.commit()
    session.refresh(db_recipe)
    return db_recipe


def get_recipe(*, session: Session, recipe_id: uuid.UUID) -> Recipe | None:
    return session.get(Recipe, recipe_id)


def get_recipes(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100, search: str | None = None
) -> list[Recipe]:
    statement = select(Recipe).where(Recipe.owner_id == owner_id)
    if search:
        conditions = [Recipe.name.icontains(search)]  # type: ignore
        if Recipe.description is not None:
            conditions.append(Recipe.description.icontains(search))  # type: ignore
        if Recipe.cuisine is not None:
            conditions.append(Recipe.cuisine.icontains(search))  # type: ignore
        statement = statement.where(or_(*conditions))
    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_recipe(
    *, session: Session, db_recipe: Recipe, recipe_in: RecipeUpdate
) -> Recipe:
    recipe_data = recipe_in.model_dump(exclude_unset=True)
    db_recipe.sqlmodel_update(recipe_data)
    session.add(db_recipe)
    session.commit()
    session.refresh(db_recipe)
    return db_recipe


def delete_recipe(*, session: Session, recipe_id: uuid.UUID) -> bool:
    recipe = session.get(Recipe, recipe_id)
    if recipe:
        session.delete(recipe)
        session.commit()
        return True
    return False


# User Ingredient CRUD operations
def create_user_ingredient(
    *, session: Session, user_ingredient_in: UserIngredientCreate, user_id: uuid.UUID
) -> UserIngredient:
    db_user_ingredient = UserIngredient.model_validate(
        user_ingredient_in, update={"user_id": user_id}
    )
    session.add(db_user_ingredient)
    session.commit()
    session.refresh(db_user_ingredient)
    return db_user_ingredient


def get_user_ingredient(*, session: Session, user_ingredient_id: uuid.UUID) -> UserIngredient | None:
    return session.get(UserIngredient, user_ingredient_id)


def get_user_ingredients(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100,
    expiring_soon: bool = False, days_ahead: int = 7
) -> list[UserIngredient]:
    statement = select(UserIngredient).where(UserIngredient.user_id == user_id)

    if expiring_soon:
        from datetime import datetime, timedelta
        future_date = datetime.now().date() + timedelta(days=days_ahead)
        statement = statement.where(
            and_(
                UserIngredient.expiration_date.is_not(None),  # type: ignore
                UserIngredient.expiration_date <= future_date  # type: ignore
            )
        )

    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_user_ingredient(
    *, session: Session, db_user_ingredient: UserIngredient, user_ingredient_in: UserIngredientUpdate
) -> UserIngredient:
    user_ingredient_data = user_ingredient_in.model_dump(exclude_unset=True)
    db_user_ingredient.sqlmodel_update(user_ingredient_data)
    session.add(db_user_ingredient)
    session.commit()
    session.refresh(db_user_ingredient)
    return db_user_ingredient


def delete_user_ingredient(*, session: Session, user_ingredient_id: uuid.UUID) -> bool:
    user_ingredient = session.get(UserIngredient, user_ingredient_id)
    if user_ingredient:
        session.delete(user_ingredient)
        session.commit()
        return True
    return False


# Recipe Ingredient CRUD operations
def create_recipe_ingredient(
    *, session: Session, recipe_ingredient_in: RecipeIngredientCreate
) -> RecipeIngredient:
    db_recipe_ingredient = RecipeIngredient.model_validate(recipe_ingredient_in)
    session.add(db_recipe_ingredient)
    session.commit()
    session.refresh(db_recipe_ingredient)
    return db_recipe_ingredient


def get_recipe_ingredient(*, session: Session, recipe_ingredient_id: uuid.UUID) -> RecipeIngredient | None:
    return session.get(RecipeIngredient, recipe_ingredient_id)


def get_recipe_ingredients(
    *, session: Session, recipe_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[RecipeIngredient]:
    statement = select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_recipe_ingredient(
    *, session: Session, db_recipe_ingredient: RecipeIngredient, recipe_ingredient_in: RecipeIngredientUpdate
) -> RecipeIngredient:
    recipe_ingredient_data = recipe_ingredient_in.model_dump(exclude_unset=True)
    db_recipe_ingredient.sqlmodel_update(recipe_ingredient_data)
    session.add(db_recipe_ingredient)
    session.commit()
    session.refresh(db_recipe_ingredient)
    return db_recipe_ingredient


def delete_recipe_ingredient(*, session: Session, recipe_ingredient_id: uuid.UUID) -> bool:
    recipe_ingredient = session.get(RecipeIngredient, recipe_ingredient_id)
    if recipe_ingredient:
        session.delete(recipe_ingredient)
        session.commit()
        return True
    return False


# Recipe matching algorithm
def get_recipe_suggestions(
    *, session: Session, user_id: uuid.UUID, limit: int = 10, min_match_score: float = 0.3
) -> list[RecipeSuggestion]:
    """
    Find recipe suggestions based on user's available ingredients.
    Uses SQLModel ORM to calculate match scores.
    """

    # Get user's available ingredients (not expired)
    user_ingredients_stmt = select(UserIngredient.ingredient_id).where(
        and_(
            UserIngredient.user_id == user_id,
            or_(
                UserIngredient.expiration_date.is_(None),  # type: ignore
                UserIngredient.expiration_date >= date.today()  # type: ignore
            )
        )
    ).distinct()
    user_ingredient_ids = set(session.exec(user_ingredients_stmt).all())

    # Get all recipes with their ingredients
    recipes_stmt = select(Recipe)
    recipes = session.exec(recipes_stmt).all()

    suggestions = []

    for recipe in recipes:
        # Get recipe ingredients
        recipe_ingredients = get_recipe_ingredients(session=session, recipe_id=recipe.id)

        if not recipe_ingredients:  # Skip recipes with no ingredients
            continue

        # Calculate match score
        total_ingredients = len(recipe_ingredients)
        available_ingredients = []
        missing_ingredients = []

        for recipe_ingredient in recipe_ingredients:
            if recipe_ingredient.ingredient_id in user_ingredient_ids:
                available_ingredients.append(recipe_ingredient)
            else:
                missing_ingredients.append(recipe_ingredient)

        available_count = len(available_ingredients)
        match_score = available_count / total_ingredients if total_ingredients > 0 else 0

        # Only include recipes that meet the minimum match score
        if match_score >= min_match_score:
            # Create recipe with ingredients
            recipe_with_ingredients = RecipeWithIngredients(
                id=recipe.id,
                name=recipe.name,
                description=recipe.description,
                instructions=recipe.instructions,
                prep_time_minutes=recipe.prep_time_minutes,
                cook_time_minutes=recipe.cook_time_minutes,
                servings=recipe.servings,
                difficulty=recipe.difficulty,
                cuisine=recipe.cuisine,
                owner_id=recipe.owner_id,
                recipe_ingredients=recipe_ingredients
            )

            suggestion = RecipeSuggestion(
                recipe=recipe_with_ingredients,
                match_score=match_score,
                available_ingredients=available_ingredients,
                missing_ingredients=missing_ingredients,
                total_ingredients=total_ingredients,
                available_count=available_count
            )
            suggestions.append(suggestion)

    # Sort by match score (descending) and available ingredients (descending)
    suggestions.sort(key=lambda x: (x.match_score, x.available_count), reverse=True)

    # Limit results
    return suggestions[:limit]

import uuid
from datetime import date
from decimal import Decimal

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    user_ingredients: list["UserIngredient"] = Relationship(back_populates="user", cascade_delete=True)
    recipes: list["Recipe"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Ingredient models
class IngredientBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, index=True)
    category: str | None = Field(default=None, max_length=100)
    unit: str = Field(default="grams", max_length=50)  # grams, ml, pieces, etc.


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(IngredientBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    unit: str | None = Field(default=None, max_length=50)  # type: ignore


class Ingredient(IngredientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_ingredients: list["UserIngredient"] = Relationship(back_populates="ingredient", cascade_delete=True)
    recipe_ingredients: list["RecipeIngredient"] = Relationship(back_populates="ingredient", cascade_delete=True)


class IngredientPublic(IngredientBase):
    id: uuid.UUID


class IngredientsPublic(SQLModel):
    data: list[IngredientPublic]
    count: int


# User Ingredient models (user's pantry)
class UserIngredientBase(SQLModel):
    amount: Decimal = Field(ge=0, decimal_places=2)  # amount in specified unit
    expiration_date: date | None = Field(default=None)
    notes: str | None = Field(default=None, max_length=500)


class UserIngredientCreate(UserIngredientBase):
    ingredient_id: uuid.UUID


class UserIngredientUpdate(UserIngredientBase):
    amount: Decimal | None = Field(default=None, ge=0, decimal_places=2)  # type: ignore
    ingredient_id: uuid.UUID | None = Field(default=None)


class UserIngredient(UserIngredientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    ingredient_id: uuid.UUID = Field(foreign_key="ingredient.id", nullable=False, ondelete="CASCADE")

    user: User | None = Relationship(back_populates="user_ingredients")
    ingredient: Ingredient | None = Relationship(back_populates="user_ingredients")


class UserIngredientPublic(UserIngredientBase):
    id: uuid.UUID
    user_id: uuid.UUID
    ingredient_id: uuid.UUID
    ingredient: IngredientPublic | None = None


class UserIngredientsPublic(SQLModel):
    data: list[UserIngredientPublic]
    count: int


# Recipe models
class RecipeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    instructions: str | None = Field(default=None, max_length=5000)
    prep_time_minutes: int | None = Field(default=None, ge=0)
    cook_time_minutes: int | None = Field(default=None, ge=0)
    servings: int | None = Field(default=None, ge=1)
    difficulty: str | None = Field(default=None, max_length=50)  # easy, medium, hard
    cuisine: str | None = Field(default=None, max_length=100)


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(RecipeBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


class Recipe(RecipeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")

    owner: User | None = Relationship(back_populates="recipes")
    recipe_ingredients: list["RecipeIngredient"] = Relationship(back_populates="recipe", cascade_delete=True)


class RecipePublic(RecipeBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class RecipesPublic(SQLModel):
    data: list[RecipePublic]
    count: int


# Recipe Ingredient models (ingredients needed for a recipe)
class RecipeIngredientBase(SQLModel):
    amount: Decimal = Field(ge=0, decimal_places=2)
    notes: str | None = Field(default=None, max_length=500)  # e.g., "chopped", "diced"


class RecipeIngredientCreate(RecipeIngredientBase):
    recipe_id: uuid.UUID
    ingredient_id: uuid.UUID


class RecipeIngredientUpdate(RecipeIngredientBase):
    amount: Decimal | None = Field(default=None, ge=0, decimal_places=2)  # type: ignore
    recipe_id: uuid.UUID | None = Field(default=None)
    ingredient_id: uuid.UUID | None = Field(default=None)


class RecipeIngredient(RecipeIngredientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    recipe_id: uuid.UUID = Field(foreign_key="recipe.id", nullable=False, ondelete="CASCADE")
    ingredient_id: uuid.UUID = Field(foreign_key="ingredient.id", nullable=False, ondelete="CASCADE")

    recipe: Recipe | None = Relationship(back_populates="recipe_ingredients")
    ingredient: Ingredient | None = Relationship(back_populates="recipe_ingredients")


class RecipeIngredientPublic(RecipeIngredientBase):
    id: uuid.UUID
    recipe_id: uuid.UUID
    ingredient_id: uuid.UUID
    ingredient: IngredientPublic | None = None


class RecipeIngredientsPublic(SQLModel):
    data: list[RecipeIngredientPublic]
    count: int


# Recipe with ingredients included
class RecipeWithIngredients(RecipePublic):
    recipe_ingredients: list[RecipeIngredientPublic] = []


# Recipe suggestion models
class RecipeSuggestion(SQLModel):
    recipe: RecipeWithIngredients
    match_score: float = Field(ge=0, le=1)  # 0-1 score based on available ingredients
    available_ingredients: list[RecipeIngredientPublic] = []
    missing_ingredients: list[RecipeIngredientPublic] = []
    total_ingredients: int
    available_count: int


class RecipeSuggestionsPublic(SQLModel):
    data: list[RecipeSuggestion]
    count: int

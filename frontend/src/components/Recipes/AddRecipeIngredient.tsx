import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import {
  IngredientsService,
  type RecipeIngredientCreate,
  RecipeIngredientsService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { createListCollection } from "@chakra-ui/react"
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "../ui/select"

interface FormData {
  ingredient_id: string
  amount: string
  notes: string
}

interface AddRecipeIngredientProps {
  recipeId: string
}

const AddRecipeIngredient = ({ recipeId }: AddRecipeIngredientProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Fetch ingredients for the dropdown
  const { data: ingredientsData } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => IngredientsService.readIngredients({ limit: 100 }),
  })

  const ingredients = ingredientsData?.data || []
  const ingredientCollection = createListCollection({
    items: ingredients,
    itemToString: (item) => `${item.name} (${item.unit})`,
    itemToValue: (item) => item.id,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ingredient_id: "",
      amount: "",
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RecipeIngredientCreate) =>
      RecipeIngredientsService.createRecipeIngredient({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Ingredient added to recipe successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["recipe-ingredients", recipeId],
      })
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const recipeIngredientData: RecipeIngredientCreate = {
      recipe_id: recipeId,
      ingredient_id: data.ingredient_id,
      amount: Number.parseFloat(data.amount),
      notes: data.notes || null,
    }
    mutation.mutate(recipeIngredientData)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-recipe-ingredient" size="sm" variant="outline">
          <FaPlus fontSize="12px" />
          Add Ingredient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Ingredient to Recipe</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Add an ingredient to this recipe with the required amount.
            </Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.ingredient_id}
                errorText={errors.ingredient_id?.message}
                label="Ingredient"
              >
                <SelectRoot
                  collection={ingredientCollection}
                  onValueChange={(e) => setValue("ingredient_id", e.value[0])}
                >
                  <SelectTrigger>
                    <SelectValueText placeholder="Select an ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} item={ingredient}>
                        {ingredient.name} ({ingredient.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
                <input
                  type="hidden"
                  {...register("ingredient_id", {
                    required: "Please select an ingredient.",
                  })}
                />
              </Field>

              <Field
                required
                invalid={!!errors.amount}
                errorText={errors.amount?.message}
                label="Amount"
              >
                <Input
                  id="amount"
                  {...register("amount", {
                    required: "Amount is required.",
                    pattern: {
                      value: /^\d+(\.\d+)?$/,
                      message: "Please enter a valid number.",
                    },
                  })}
                  placeholder="e.g., 500"
                  type="number"
                  step="0.01"
                />
              </Field>

              <Field
                invalid={!!errors.notes}
                errorText={errors.notes?.message}
                label="Notes (optional)"
              >
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="e.g., chopped, diced, minced..."
                  rows={2}
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogActionTrigger>
            <Button
              type="submit"
              colorPalette="blue"
              loading={isSubmitting}
              disabled={!isValid}
            >
              Add Ingredient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddRecipeIngredient

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import {
  IngredientsService,
  type UserIngredientCreate,
  UserIngredientsService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { createListCollection } from "@chakra-ui/react"
import {
  DialogBody,
  DialogCloseTrigger,
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
  expiration_date: string
  notes: string
}

const AddUserIngredient = () => {
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
      expiration_date: "",
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserIngredientCreate) =>
      UserIngredientsService.createUserIngredient({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Ingredient added to your pantry successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ingredients"] })
    },
  })

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const submitData: UserIngredientCreate = {
      ingredient_id: data.ingredient_id,
      amount: Number.parseFloat(data.amount),
      expiration_date: data.expiration_date || undefined,
      notes: data.notes || undefined,
    }
    mutation.mutate(submitData)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-user-ingredient" my={4}>
          <FaPlus fontSize="16px" />
          Add to Pantry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Ingredient to Pantry</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Add an ingredient to your pantry with amount and expiration date.
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
                label="Amount (in grams or units)"
                helperText="Specify how much of this ingredient you have"
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
                  placeholder="e.g., 500 (grams) or 2 (pieces)"
                  type="number"
                  step="0.01"
                />
              </Field>

              <Field
                invalid={!!errors.expiration_date}
                errorText={errors.expiration_date?.message}
                label="Expiration Date (Optional)"
              >
                <Input
                  id="expiration_date"
                  {...register("expiration_date")}
                  type="date"
                />
              </Field>

              <Field
                invalid={!!errors.notes}
                errorText={errors.notes?.message}
                label="Notes (Optional)"
              >
                <Input
                  id="notes"
                  {...register("notes")}
                  placeholder="e.g., opened, frozen"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Add to Pantry
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddUserIngredient

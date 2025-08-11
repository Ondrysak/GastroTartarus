import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { FaEdit } from "react-icons/fa"

import {
  type IngredientPublic,
  type IngredientUpdate,
  IngredientsService,
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
  name: string
  category: string
  unit: string
}

interface EditIngredientProps {
  ingredient: IngredientPublic
}

const unitOptions = createListCollection({
  items: [
    { label: "Grams", value: "grams" },
    { label: "Kilograms", value: "kilograms" },
    { label: "Liters", value: "liters" },
    { label: "Milliliters", value: "milliliters" },
    { label: "Pieces", value: "pieces" },
    { label: "Cups", value: "cups" },
    { label: "Tablespoons", value: "tablespoons" },
    { label: "Teaspoons", value: "teaspoons" },
  ],
})

const EditIngredient = ({ ingredient }: EditIngredientProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      category: "",
      unit: "grams",
    },
  })

  // Populate form with ingredient data when modal opens
  useEffect(() => {
    if (isOpen && ingredient) {
      setValue("name", ingredient.name || "")
      setValue("category", ingredient.category || "")
      setValue("unit", ingredient.unit || "grams")
    }
  }, [isOpen, ingredient, setValue])

  const mutation = useMutation({
    mutationFn: (data: IngredientUpdate) =>
      IngredientsService.updateIngredient({
        id: ingredient.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Ingredient updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] })
    },
  })

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const submitData: IngredientUpdate = {
      name: data.name,
      category: data.category || undefined,
      unit: data.unit,
    }
    mutation.mutate(submitData)
  }

  return (
    <DialogRoot
      size={{ base: "sm", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FaEdit fontSize="14px" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the ingredient details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Ingredient Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Ingredient name is required.",
                  })}
                  placeholder="Ingredient name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.category}
                errorText={errors.category?.message}
                label="Category"
              >
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="e.g., Vegetables, Meat, Dairy"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.unit}
                errorText={errors.unit?.message}
                label="Unit"
              >
                <SelectRoot
                  collection={unitOptions}
                  size="sm"
                  onValueChange={({ value }) =>
                    setValue("unit", value[0] || "grams")
                  }
                >
                  <SelectTrigger>
                    <SelectValueText placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.items.map((option) => (
                      <SelectItem item={option} key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogActionTrigger>
            <Button type="submit" loading={isSubmitting} disabled={!isValid}>
              Update Ingredient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditIngredient

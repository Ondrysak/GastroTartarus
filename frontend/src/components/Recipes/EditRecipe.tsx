import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Box,
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { Tabs } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { FaEdit } from "react-icons/fa"

import { type RecipePublic, type RecipeUpdate, RecipesService } from "@/client"
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
import RecipeIngredients from "./RecipeIngredients"

interface FormData {
  name: string
  description: string
  instructions: string
  prep_time_minutes: string
  cook_time_minutes: string
  servings: string
  difficulty: string
  cuisine: string
}

interface EditRecipeProps {
  recipe: RecipePublic
}

const difficultyOptions = createListCollection({
  items: [
    { label: "Easy", value: "Easy" },
    { label: "Medium", value: "Medium" },
    { label: "Hard", value: "Hard" },
  ],
})

const EditRecipe = ({ recipe }: EditRecipeProps) => {
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
      description: "",
      instructions: "",
      prep_time_minutes: "",
      cook_time_minutes: "",
      servings: "",
      difficulty: "",
      cuisine: "",
    },
  })

  // Populate form with recipe data when modal opens
  useEffect(() => {
    if (isOpen && recipe) {
      setValue("name", recipe.name || "")
      setValue("description", recipe.description || "")
      setValue("instructions", recipe.instructions || "")
      setValue("prep_time_minutes", recipe.prep_time_minutes?.toString() || "")
      setValue("cook_time_minutes", recipe.cook_time_minutes?.toString() || "")
      setValue("servings", recipe.servings?.toString() || "")
      setValue("difficulty", recipe.difficulty || "")
      setValue("cuisine", recipe.cuisine || "")
    }
  }, [isOpen, recipe, setValue])

  const mutation = useMutation({
    mutationFn: (data: RecipeUpdate) =>
      RecipesService.updateRecipe({ id: recipe.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Recipe updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] })
      queryClient.invalidateQueries({ queryKey: ["recipe", recipe.id] })
    },
  })

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const submitData: RecipeUpdate = {
      name: data.name,
      description: data.description || undefined,
      instructions: data.instructions || undefined,
      prep_time_minutes: data.prep_time_minutes
        ? Number.parseInt(data.prep_time_minutes)
        : undefined,
      cook_time_minutes: data.cook_time_minutes
        ? Number.parseInt(data.cook_time_minutes)
        : undefined,
      servings: data.servings ? Number.parseInt(data.servings) : undefined,
      difficulty: data.difficulty || undefined,
      cuisine: data.cuisine || undefined,
    }
    mutation.mutate(submitData)
  }

  return (
    <DialogRoot
      size={{ base: "md", md: "xl" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FaEdit fontSize="14px" />
          Edit Recipe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Tabs.Root defaultValue="details" variant="enclosed">
              <Tabs.List>
                <Tabs.Trigger value="details">Recipe Details</Tabs.Trigger>
                <Tabs.Trigger value="ingredients">Ingredients</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="details">
                <Text mb={4}>Update the recipe details.</Text>
                <VStack gap={4}>
                  <Field
                    required
                    invalid={!!errors.name}
                    errorText={errors.name?.message}
                    label="Recipe Name"
                  >
                    <Input
                      id="name"
                      {...register("name", {
                        required: "Recipe name is required.",
                      })}
                      placeholder="Recipe name"
                      type="text"
                    />
                  </Field>

                  <Field
                    invalid={!!errors.description}
                    errorText={errors.description?.message}
                    label="Description"
                  >
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Brief description of the recipe"
                      rows={3}
                    />
                  </Field>

                  <Field
                    invalid={!!errors.instructions}
                    errorText={errors.instructions?.message}
                    label="Instructions"
                  >
                    <Textarea
                      id="instructions"
                      {...register("instructions")}
                      placeholder="Step-by-step cooking instructions"
                      rows={5}
                    />
                  </Field>

                  <Flex gap={4} w="full">
                    <Field
                      invalid={!!errors.prep_time_minutes}
                      errorText={errors.prep_time_minutes?.message}
                      label="Prep Time (minutes)"
                      flex="1"
                    >
                      <Input
                        id="prep_time_minutes"
                        {...register("prep_time_minutes", {
                          pattern: {
                            value: /^\d+$/,
                            message: "Please enter a valid number.",
                          },
                        })}
                        placeholder="30"
                        type="number"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.cook_time_minutes}
                      errorText={errors.cook_time_minutes?.message}
                      label="Cook Time (minutes)"
                      flex="1"
                    >
                      <Input
                        id="cook_time_minutes"
                        {...register("cook_time_minutes", {
                          pattern: {
                            value: /^\d+$/,
                            message: "Please enter a valid number.",
                          },
                        })}
                        placeholder="45"
                        type="number"
                      />
                    </Field>
                  </Flex>

                  <Flex gap={4} w="full">
                    <Field
                      invalid={!!errors.servings}
                      errorText={errors.servings?.message}
                      label="Servings"
                      flex="1"
                    >
                      <Input
                        id="servings"
                        {...register("servings", {
                          pattern: {
                            value: /^\d+$/,
                            message: "Please enter a valid number.",
                          },
                        })}
                        placeholder="4"
                        type="number"
                      />
                    </Field>

                    <Field
                      invalid={!!errors.cuisine}
                      errorText={errors.cuisine?.message}
                      label="Cuisine"
                      flex="1"
                    >
                      <Input
                        id="cuisine"
                        {...register("cuisine")}
                        placeholder="Italian, Mexican, etc."
                        type="text"
                      />
                    </Field>
                  </Flex>

                  <Field
                    invalid={!!errors.difficulty}
                    errorText={errors.difficulty?.message}
                    label="Difficulty"
                  >
                    <SelectRoot
                      collection={difficultyOptions}
                      size="sm"
                      onValueChange={({ value }) =>
                        setValue("difficulty", value[0] || "")
                      }
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.items.map((option) => (
                          <SelectItem item={option} key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="ingredients">
                <Box mt={4}>
                  <RecipeIngredients recipeId={recipe.id} />
                </Box>
              </Tabs.Content>
            </Tabs.Root>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogActionTrigger>
            <Button type="submit" loading={isSubmitting} disabled={!isValid}>
              Update Recipe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditRecipe

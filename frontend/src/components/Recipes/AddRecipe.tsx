import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import { type RecipeCreate, RecipesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
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

const AddRecipe = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
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

  const mutation = useMutation({
    mutationFn: (data: RecipeCreate) =>
      RecipesService.createRecipe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Recipe created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] })
    },
  })

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const submitData: RecipeCreate = {
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
      size={{ base: "sm", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-recipe" my={4}>
          <FaPlus fontSize="16px" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Recipe</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new recipe.</Text>
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

              <Flex gap={4} width="100%">
                <Field
                  invalid={!!errors.prep_time_minutes}
                  errorText={errors.prep_time_minutes?.message}
                  label="Prep Time (minutes)"
                  flex={1}
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
                  flex={1}
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

              <Flex gap={4} width="100%">
                <Field
                  invalid={!!errors.servings}
                  errorText={errors.servings?.message}
                  label="Servings"
                  flex={1}
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
                  invalid={!!errors.difficulty}
                  errorText={errors.difficulty?.message}
                  label="Difficulty"
                  flex={1}
                >
                  <Input
                    id="difficulty"
                    {...register("difficulty")}
                    placeholder="Easy, Medium, Hard"
                    type="text"
                  />
                </Field>
              </Flex>

              <Field
                invalid={!!errors.cuisine}
                errorText={errors.cuisine?.message}
                label="Cuisine"
              >
                <Input
                  id="cuisine"
                  {...register("cuisine")}
                  placeholder="e.g., Italian, Mexican, Asian"
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
              Save Recipe
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddRecipe

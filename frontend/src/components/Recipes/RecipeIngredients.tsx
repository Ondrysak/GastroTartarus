import {
  Badge,
  Button,
  EmptyState,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiPackage, FiTrash2 } from "react-icons/fi"

import { RecipeIngredientsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import PendingItems from "@/components/Pending/PendingItems"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import AddRecipeIngredient from "./AddRecipeIngredient"

interface RecipeIngredientsProps {
  recipeId: string
}

const RecipeIngredients = ({ recipeId }: RecipeIngredientsProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data, isLoading } = useQuery({
    queryKey: ["recipe-ingredients", recipeId],
    queryFn: () =>
      RecipeIngredientsService.readRecipeIngredients({
        recipeId: recipeId,
        limit: 100,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (ingredientId: string) =>
      RecipeIngredientsService.deleteRecipeIngredient({ id: ingredientId }),
    onSuccess: () => {
      showSuccessToast("Ingredient removed from recipe successfully.")
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

  const handleDelete = (ingredientId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this ingredient from the recipe?",
      )
    ) {
      deleteMutation.mutate(ingredientId)
    }
  }

  const recipeIngredients = data?.data ?? []

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <VStack gap={4} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="md">Recipe Ingredients</Heading>
        <AddRecipeIngredient recipeId={recipeId} />
      </Flex>

      {recipeIngredients.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiPackage />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No ingredients added</EmptyState.Title>
              <EmptyState.Description>
                Add ingredients to this recipe to get started
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Table.Root size={{ base: "sm", md: "md" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="lg">Ingredient</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Amount</Table.ColumnHeader>
              <Table.ColumnHeader w="lg">Notes</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {recipeIngredients.map((recipeIngredient) => (
              <Table.Row key={recipeIngredient.id}>
                <Table.Cell>
                  <VStack align="start" gap={1}>
                    <Text fontWeight="medium">
                      {recipeIngredient.ingredient?.name ||
                        "Unknown Ingredient"}
                    </Text>
                    {recipeIngredient.ingredient?.category && (
                      <Badge size="sm" colorPalette="gray">
                        {recipeIngredient.ingredient.category}
                      </Badge>
                    )}
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  <Text>
                    {recipeIngredient.amount}{" "}
                    {recipeIngredient.ingredient?.unit || "units"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    color={!recipeIngredient.notes ? "gray.500" : "inherit"}
                    fontStyle={!recipeIngredient.notes ? "italic" : "normal"}
                  >
                    {recipeIngredient.notes || "No notes"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => handleDelete(recipeIngredient.id)}
                    loading={deleteMutation.isPending}
                  >
                    <FiTrash2 />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </VStack>
  )
}

export default RecipeIngredients

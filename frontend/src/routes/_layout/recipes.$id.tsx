import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiArrowLeft, FiBook, FiClock, FiUsers } from "react-icons/fi"

import { RecipesService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import EditRecipe from "@/components/Recipes/EditRecipe"
import RecipeIngredients from "@/components/Recipes/RecipeIngredients"

export const Route = createFileRoute("/_layout/recipes/$id")({
  component: RecipeDetail,
})

function RecipeDetail() {
  const navigate = useNavigate()
  const { id } = Route.useParams()

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => RecipesService.readRecipe({ id }),
  })

  const formatTime = (minutes: number | null | undefined) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getDifficultyColor = (difficulty: string | null | undefined) => {
    if (!difficulty) return "gray"
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "green"
      case "medium":
        return "orange"
      case "hard":
        return "red"
      default:
        return "gray"
    }
  }

  if (isLoading) {
    return <PendingItems />
  }

  if (!recipe) {
    return (
      <Container maxW="full">
        <VStack gap={4} align="center" py={12}>
          <Text fontSize="lg" color="gray.600">
            Recipe not found
          </Text>
          <Button onClick={() => navigate({ to: "/recipes" })}>
            <FiArrowLeft />
            Back to Recipes
          </Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" pt={6}>
          <Button variant="ghost" onClick={() => navigate({ to: "/recipes" })}>
            <FiArrowLeft />
            Back to Recipes
          </Button>
          <EditRecipe recipe={recipe} />
        </Flex>

        {/* Recipe Details */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <VStack gap={2} align="start">
                <Heading size="xl">{recipe.name}</Heading>
                {recipe.description && (
                  <Text color="gray.600" fontSize="lg">
                    {recipe.description}
                  </Text>
                )}
              </VStack>

              {/* Recipe Metadata */}
              <Flex gap={4} wrap="wrap" align="center">
                {recipe.cuisine && (
                  <Badge colorPalette="blue" size="md">
                    {recipe.cuisine}
                  </Badge>
                )}
                {recipe.difficulty && (
                  <Badge
                    colorPalette={getDifficultyColor(recipe.difficulty)}
                    size="md"
                  >
                    {recipe.difficulty}
                  </Badge>
                )}
                {recipe.prep_time_minutes && (
                  <Flex align="center" gap={2}>
                    <FiClock />
                    <Text fontSize="sm">
                      Prep: {formatTime(recipe.prep_time_minutes)}
                    </Text>
                  </Flex>
                )}
                {recipe.cook_time_minutes && (
                  <Flex align="center" gap={2}>
                    <FiClock />
                    <Text fontSize="sm">
                      Cook: {formatTime(recipe.cook_time_minutes)}
                    </Text>
                  </Flex>
                )}
                {recipe.servings && (
                  <Flex align="center" gap={2}>
                    <FiUsers />
                    <Text fontSize="sm">{recipe.servings} servings</Text>
                  </Flex>
                )}
              </Flex>

              {/* Instructions */}
              {recipe.instructions && (
                <VStack gap={2} align="start">
                  <Flex align="center" gap={2}>
                    <FiBook />
                    <Heading size="md">Instructions</Heading>
                  </Flex>
                  <Text whiteSpace="pre-wrap" lineHeight="tall">
                    {recipe.instructions}
                  </Text>
                </VStack>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        <Separator />

        {/* Recipe Ingredients */}
        <RecipeIngredients recipeId={id} />
      </VStack>
    </Container>
  )
}

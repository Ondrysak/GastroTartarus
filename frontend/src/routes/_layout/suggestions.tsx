import {
  Badge,
  Button,
  Container,
  EmptyState,
  Flex,
  Heading,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiClock, FiSearch, FiUsers } from "react-icons/fi"
import { z } from "zod"

import { RecipesService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"

const suggestionsSearchSchema = z.object({
  min_match_score: z.number().min(0).max(1).catch(0.3),
  limit: z.number().min(1).max(50).catch(10),
})

function getRecipeSuggestionsQueryOptions({
  min_match_score,
  limit,
}: {
  min_match_score: number
  limit: number
}) {
  return {
    queryFn: () =>
      RecipesService.getRecipeSuggestions({
        minMatchScore: min_match_score,
        limit: limit,
      }),
    queryKey: ["recipe-suggestions", { min_match_score, limit }],
  }
}

export const Route = createFileRoute("/_layout/suggestions")({
  component: Suggestions,
  validateSearch: (search) => suggestionsSearchSchema.parse(search),
})

function RecipeSuggestionCard({ suggestion }: { suggestion: any }) {
  const {
    recipe,
    match_score,
    available_ingredients,
    missing_ingredients,
    total_ingredients,
    available_count,
  } = suggestion

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

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return "green"
    if (score >= 0.6) return "orange"
    return "red"
  }

  return (
    <Card.Root>
      <Card.Body>
        <VStack align="start" gap={4}>
          <Flex justify="space-between" align="start" width="100%">
            <VStack align="start" gap={1}>
              <Heading size="md">{recipe.name}</Heading>
              {recipe.description && (
                <Text color="gray.600" fontSize="sm">
                  {recipe.description}
                </Text>
              )}
            </VStack>
            <Badge colorPalette={getMatchScoreColor(match_score)} size="lg">
              {Math.round(match_score * 100)}% match
            </Badge>
          </Flex>

          <Flex gap={4} wrap="wrap">
            {recipe.cuisine && (
              <Badge colorPalette="blue" size="sm">
                {recipe.cuisine}
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge
                colorPalette={getDifficultyColor(recipe.difficulty)}
                size="sm"
              >
                {recipe.difficulty}
              </Badge>
            )}
            {recipe.prep_time_minutes && (
              <Flex align="center" gap={1}>
                <FiClock size={12} />
                <Text fontSize="sm">
                  Prep: {formatTime(recipe.prep_time_minutes)}
                </Text>
              </Flex>
            )}
            {recipe.cook_time_minutes && (
              <Flex align="center" gap={1}>
                <FiClock size={12} />
                <Text fontSize="sm">
                  Cook: {formatTime(recipe.cook_time_minutes)}
                </Text>
              </Flex>
            )}
            {recipe.servings && (
              <Flex align="center" gap={1}>
                <FiUsers size={12} />
                <Text fontSize="sm">{recipe.servings} servings</Text>
              </Flex>
            )}
          </Flex>

          <VStack align="start" gap={2} width="100%">
            <Text fontWeight="medium">
              Ingredients ({available_count}/{total_ingredients} available)
            </Text>
            <Progress.Root
              value={(available_count / total_ingredients) * 100}
              colorPalette={getMatchScoreColor(match_score)}
              size="sm"
              width="100%"
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>

            {available_ingredients.length > 0 && (
              <VStack align="start" gap={1} width="100%">
                <Text fontSize="sm" fontWeight="medium" color="green.600">
                  Available:
                </Text>
                <Flex gap={1} wrap="wrap">
                  {available_ingredients.map((ing: any) => (
                    <Badge key={ing.id} colorPalette="green" size="sm">
                      {ing.ingredient?.name} ({ing.amount}{" "}
                      {ing.ingredient?.unit})
                    </Badge>
                  ))}
                </Flex>
              </VStack>
            )}

            {missing_ingredients.length > 0 && (
              <VStack align="start" gap={1} width="100%">
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  Missing:
                </Text>
                <Flex gap={1} wrap="wrap">
                  {missing_ingredients.map((ing: any) => (
                    <Badge key={ing.id} colorPalette="red" size="sm">
                      {ing.ingredient?.name} ({ing.amount}{" "}
                      {ing.ingredient?.unit})
                    </Badge>
                  ))}
                </Flex>
              </VStack>
            )}
          </VStack>

          {recipe.instructions && (
            <VStack align="start" gap={1} width="100%">
              <Text fontWeight="medium">Instructions:</Text>
              <Text fontSize="sm" color="gray.700">
                {recipe.instructions.length > 200
                  ? `${recipe.instructions.substring(0, 200)}...`
                  : recipe.instructions}
              </Text>
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

function SuggestionsContent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { min_match_score, limit } = Route.useSearch()
  const [minMatchScore, setMinMatchScore] = useState(min_match_score)
  const [maxResults, setMaxResults] = useState(limit)

  const { data, isLoading } = useQuery({
    ...getRecipeSuggestionsQueryOptions({ min_match_score, limit }),
    placeholderData: (prevData) => prevData,
  })

  const updateFilters = () => {
    navigate({
      search: () => ({
        min_match_score: minMatchScore,
        limit: maxResults,
      }),
    })
  }

  const suggestions = data?.data ?? []

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <VStack gap={6} align="stretch">
      <Card.Root>
        <Card.Body>
          <VStack gap={4}>
            <Field
              label={`Minimum Match Score: ${Math.round(minMatchScore * 100)}%`}
            >
              <Slider
                value={[minMatchScore]}
                onValueChange={(value) => setMinMatchScore(value.value[0])}
                min={0}
                max={1}
                step={0.1}
              />
            </Field>

            <Field label={`Maximum Results: ${maxResults}`}>
              <Slider
                value={[maxResults]}
                onValueChange={(value) => setMaxResults(value.value[0])}
                min={1}
                max={50}
                step={1}
              />
            </Field>

            <Button onClick={updateFilters} colorPalette="blue">
              Update Suggestions
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>

      {suggestions.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No recipe suggestions found</EmptyState.Title>
              <EmptyState.Description>
                Try lowering the minimum match score or add more ingredients to
                your pantry
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <VStack gap={4} align="stretch">
          {suggestions.map((suggestion: any) => (
            <RecipeSuggestionCard
              key={suggestion.recipe.id}
              suggestion={suggestion}
            />
          ))}
        </VStack>
      )}
    </VStack>
  )
}

function Suggestions() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Recipe Suggestions
      </Heading>
      <Text color="gray.600" mb={6}>
        Discover recipes you can make with ingredients from your pantry
      </Text>
      <SuggestionsContent />
    </Container>
  )
}

import {
  Badge,
  Container,
  EmptyState,
  Flex,
  Heading,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { RecipesService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import AddRecipe from "@/components/Recipes/AddRecipe"
import EditRecipe from "@/components/Recipes/EditRecipe"
import { Field } from "@/components/ui/field"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const recipesSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(""),
})

const PER_PAGE = 10

function getRecipesQueryOptions({
  page,
  search,
}: { page: number; search?: string }) {
  return {
    queryFn: () =>
      RecipesService.readRecipes({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        search: search || undefined,
      }),
    queryKey: ["recipes", { page, search }],
  }
}

export const Route = createFileRoute("/_layout/recipes")({
  component: Recipes,
  validateSearch: (search) => recipesSearchSchema.parse(search),
})

function RecipesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, search } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getRecipesQueryOptions({ page, search }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const handleSearch = (newSearch: string) => {
    navigate({
      search: (prev: { [key: string]: string }) => ({
        ...prev,
        search: newSearch,
        page: 1,
      }),
    })
  }

  const recipes = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  const formatTime = (minutes: number | null | undefined) => {
    if (!minutes) return "N/A"
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

  return (
    <VStack gap={4} align="stretch">
      <Field label="Search recipes">
        <Input
          placeholder="Search by name, description, or cuisine..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(searchInput)
            }
          }}
        />
      </Field>

      {recipes.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No recipes found</EmptyState.Title>
              <EmptyState.Description>
                {search
                  ? "Try adjusting your search terms"
                  : "Add your first recipe to get started"}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="lg">Name</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Cuisine</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Difficulty</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Prep Time</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Cook Time</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Servings</Table.ColumnHeader>
                <Table.ColumnHeader w="xs">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {recipes?.map((recipe) => (
                <Table.Row
                  key={recipe.id}
                  opacity={isPlaceholderData ? 0.5 : 1}
                >
                  <Table.Cell>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="medium" truncate maxW="200px">
                        {recipe.name}
                      </Text>
                      {recipe.description && (
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          truncate
                          maxW="200px"
                        >
                          {recipe.description}
                        </Text>
                      )}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell
                    color={!recipe.cuisine ? "gray" : "inherit"}
                    truncate
                    maxW="sm"
                  >
                    {recipe.cuisine || "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    {recipe.difficulty ? (
                      <Badge
                        colorPalette={getDifficultyColor(recipe.difficulty)}
                        size="sm"
                      >
                        {recipe.difficulty}
                      </Badge>
                    ) : (
                      <span style={{ color: "gray" }}>N/A</span>
                    )}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {formatTime(recipe.prep_time_minutes)}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {formatTime(recipe.cook_time_minutes)}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {recipe.servings || "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    <EditRecipe recipe={recipe} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
          <Flex justifyContent="flex-end" mt={4}>
            <PaginationRoot
              count={count}
              pageSize={PER_PAGE}
              onPageChange={({ page }) => setPage(page)}
            >
              <Flex>
                <PaginationPrevTrigger />
                <PaginationItems />
                <PaginationNextTrigger />
              </Flex>
            </PaginationRoot>
          </Flex>
        </>
      )}
    </VStack>
  )
}

function Recipes() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        My Recipes
      </Heading>
      <AddRecipe />
      <RecipesTable />
    </Container>
  )
}

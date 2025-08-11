import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Input,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { IngredientsService } from "@/client"
import AddIngredient from "@/components/Ingredients/AddIngredient"
import EditIngredient from "@/components/Ingredients/EditIngredient"
import PendingItems from "@/components/Pending/PendingItems"
import { Field } from "@/components/ui/field"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const ingredientsSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(""),
})

const PER_PAGE = 10

function getIngredientsQueryOptions({
  page,
  search,
}: { page: number; search?: string }) {
  return {
    queryFn: () =>
      IngredientsService.readIngredients({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        search: search || undefined,
      }),
    queryKey: ["ingredients", { page, search }],
  }
}

export const Route = createFileRoute("/_layout/ingredients")({
  component: Ingredients,
  validateSearch: (search) => ingredientsSearchSchema.parse(search),
})

function IngredientsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, search } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getIngredientsQueryOptions({ page, search }),
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

  const ingredients = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <VStack gap={4} align="stretch">
      <Field label="Search ingredients">
        <Input
          placeholder="Search by name or category..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(searchInput)
            }
          }}
        />
      </Field>

      {ingredients.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No ingredients found</EmptyState.Title>
              <EmptyState.Description>
                {search
                  ? "Try adjusting your search terms"
                  : "Add your first ingredient to get started"}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="sm">Name</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Category</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Unit</Table.ColumnHeader>
                <Table.ColumnHeader w="xs">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {ingredients?.map((ingredient) => (
                <Table.Row
                  key={ingredient.id}
                  opacity={isPlaceholderData ? 0.5 : 1}
                >
                  <Table.Cell truncate maxW="sm">
                    {ingredient.name}
                  </Table.Cell>
                  <Table.Cell
                    color={!ingredient.category ? "gray" : "inherit"}
                    truncate
                    maxW="sm"
                  >
                    {ingredient.category || "N/A"}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {ingredient.unit}
                  </Table.Cell>
                  <Table.Cell>
                    <EditIngredient ingredient={ingredient} />
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

function Ingredients() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Ingredients Management
      </Heading>
      <VStack align="start" gap={2} mb={4}>
        <p style={{ color: "gray", fontSize: "14px" }}>
          This section manages the master catalog of ingredients. To add
          ingredients with quantities to your personal inventory, go to "My
          Pantry".
        </p>
      </VStack>
      <AddIngredient />
      <IngredientsTable />
    </Container>
  )
}

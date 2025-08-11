import {
  Badge,
  Container,
  EmptyState,
  Flex,
  Heading,
  Switch,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { UserIngredientsService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import AddUserIngredient from "@/components/UserIngredients/AddUserIngredient"
import { Field } from "@/components/ui/field"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const pantrySearchSchema = z.object({
  page: z.number().catch(1),
  expiring_soon: z.boolean().catch(false),
})

const PER_PAGE = 10

function getUserIngredientsQueryOptions({
  page,
  expiring_soon,
}: {
  page: number
  expiring_soon: boolean
}) {
  return {
    queryFn: () =>
      UserIngredientsService.readUserIngredients({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        expiringSoon: expiring_soon,
        daysAhead: 7,
      }),
    queryKey: ["user-ingredients", { page, expiring_soon }],
  }
}

export const Route = createFileRoute("/_layout/pantry")({
  component: Pantry,
  validateSearch: (search) => pantrySearchSchema.parse(search),
})

function PantryTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, expiring_soon } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUserIngredientsQueryOptions({ page, expiring_soon }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const toggleExpiringSoon = (checked: boolean) => {
    navigate({
      search: (prev: { [key: string]: string }) => ({
        ...prev,
        expiring_soon: checked,
        page: 1,
      }),
    })
  }

  const userIngredients = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const today = new Date()
    return expDate < today
  }

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <VStack gap={4} align="stretch">
      <Field label="Show only expiring soon">
        <Switch.Root
          checked={expiring_soon}
          onCheckedChange={(e) => toggleExpiringSoon(e.checked)}
        >
          <Switch.Thumb />
        </Switch.Root>
      </Field>

      {userIngredients.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiSearch />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>Your pantry is empty</EmptyState.Title>
              <EmptyState.Description>
                {expiring_soon
                  ? "No ingredients are expiring soon"
                  : "Add ingredients to your pantry to get started"}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="sm">Ingredient</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Amount</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Expiration</Table.ColumnHeader>
                <Table.ColumnHeader w="sm">Notes</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {userIngredients?.map((userIngredient) => (
                <Table.Row
                  key={userIngredient.id}
                  opacity={isPlaceholderData ? 0.5 : 1}
                >
                  <Table.Cell truncate maxW="sm">
                    {userIngredient.ingredient?.name || "Unknown"}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {userIngredient.amount}{" "}
                    {userIngredient.ingredient?.unit || ""}
                  </Table.Cell>
                  <Table.Cell truncate maxW="sm">
                    {userIngredient.expiration_date ? (
                      <Flex align="center" gap={2}>
                        <span>{userIngredient.expiration_date}</span>
                        {isExpired(userIngredient.expiration_date) && (
                          <Badge colorPalette="red" size="sm">
                            Expired
                          </Badge>
                        )}
                        {!isExpired(userIngredient.expiration_date) &&
                          isExpiringSoon(userIngredient.expiration_date) && (
                            <Badge colorPalette="orange" size="sm">
                              Soon
                            </Badge>
                          )}
                      </Flex>
                    ) : (
                      <span style={{ color: "gray" }}>No expiration</span>
                    )}
                  </Table.Cell>
                  <Table.Cell
                    color={!userIngredient.notes ? "gray" : "inherit"}
                    truncate
                    maxW="sm"
                  >
                    {userIngredient.notes || "N/A"}
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

function Pantry() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        My Pantry
      </Heading>
      <VStack align="start" gap={2} mb={4}>
        <p style={{ color: "gray", fontSize: "14px" }}>
          Add ingredients from the master catalog to your personal pantry with
          specific amounts, expiration dates, and notes.
        </p>
      </VStack>
      <AddUserIngredient />
      <PantryTable />
    </Container>
  )
}

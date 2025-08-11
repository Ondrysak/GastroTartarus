import { Card as ChakraCard } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface CardRootProps extends ChakraCard.RootProps {}

export const CardRoot = forwardRef<HTMLDivElement, CardRootProps>(
  function CardRoot(props, ref) {
    return <ChakraCard.Root ref={ref} {...props} />
  },
)

export interface CardBodyProps extends ChakraCard.BodyProps {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody(props, ref) {
    return <ChakraCard.Body ref={ref} {...props} />
  },
)

export interface CardHeaderProps extends ChakraCard.HeaderProps {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader(props, ref) {
    return <ChakraCard.Header ref={ref} {...props} />
  },
)

export interface CardFooterProps extends ChakraCard.FooterProps {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter(props, ref) {
    return <ChakraCard.Footer ref={ref} {...props} />
  },
)

export const Card = {
  Root: CardRoot,
  Body: CardBody,
  Header: CardHeader,
  Footer: CardFooter,
}

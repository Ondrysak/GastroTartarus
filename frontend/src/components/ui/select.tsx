import { Select as ChakraSelect } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface SelectRootProps extends ChakraSelect.RootProps {}

export const SelectRoot = forwardRef<HTMLDivElement, SelectRootProps>(
  function SelectRoot(props, ref) {
    return <ChakraSelect.Root ref={ref} {...props} />
  },
)

export interface SelectTriggerProps extends ChakraSelect.TriggerProps {}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger(props, ref) {
    return <ChakraSelect.Trigger ref={ref} {...props} />
  },
)

export interface SelectContentProps extends ChakraSelect.ContentProps {}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  function SelectContent(props, ref) {
    return <ChakraSelect.Content ref={ref} {...props} />
  },
)

export interface SelectItemProps extends ChakraSelect.ItemProps {}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem(props, ref) {
    return <ChakraSelect.Item ref={ref} {...props} />
  },
)

export interface SelectValueTextProps extends ChakraSelect.ValueTextProps {}

export const SelectValueText = forwardRef<
  HTMLSpanElement,
  SelectValueTextProps
>(function SelectValueText(props, ref) {
  return <ChakraSelect.ValueText ref={ref} {...props} />
})

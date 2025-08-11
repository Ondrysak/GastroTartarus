import { Slider as ChakraSlider } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface SliderProps extends ChakraSlider.RootProps {}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  function Slider(props, ref) {
    return (
      <ChakraSlider.Root ref={ref} {...props}>
        <ChakraSlider.Track>
          <ChakraSlider.Range />
        </ChakraSlider.Track>
        <ChakraSlider.Thumb index={0} />
      </ChakraSlider.Root>
    )
  },
)

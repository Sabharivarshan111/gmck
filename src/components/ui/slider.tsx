
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme/ThemeProvider"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track 
        className={cn(
          "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary",
          theme === "blackpink" ? "!bg-[#330011] !border !border-[#FF5C8D]/30" : ""
        )}
      >
        <SliderPrimitive.Range 
          className={cn(
            "absolute h-full bg-primary", 
            theme === "blackpink" ? "!bg-[#FF5C8D]" : ""
          )} 
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          theme === "blackpink" ? "!border-[#FF5C8D] !bg-black !shadow-[0_0_5px_rgba(255,92,141,0.5)]" : ""
        )} 
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

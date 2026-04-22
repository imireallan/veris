import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

interface CarouselContextValue {
  index: number
  count: number
  setIndex: React.Dispatch<React.SetStateAction<number>>
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error("Carousel components must be used within Carousel")
  return context
}

function Carousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const count = React.Children.count(children)
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(count - 1, 0)))
  }, [count])

  return (
    <CarouselContext.Provider value={{ index, count, setIndex }}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { index } = useCarousel()
  const items = React.Children.toArray(children)

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((child, itemIndex) => (
          <div key={itemIndex} className="min-w-full">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

function CarouselItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-0.5", className)}>{children}</div>
}

function CarouselPrevious() {
  const { index, setIndex } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => setIndex((current) => Math.max(current - 1, 0))}
      disabled={index === 0}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  )
}

function CarouselNext() {
  const { index, count, setIndex } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => setIndex((current) => Math.min(current + 1, count - 1))}
      disabled={index >= count - 1}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  )
}

function CarouselIndicators() {
  const { index, count, setIndex } = useCarousel()
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, itemIndex) => (
        <button
          key={itemIndex}
          type="button"
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            itemIndex === index ? "bg-primary" : "bg-border"
          )}
          onClick={() => setIndex(itemIndex)}
        />
      ))}
    </div>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
}

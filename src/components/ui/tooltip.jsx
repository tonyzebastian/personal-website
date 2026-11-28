"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

// shadcn's tooltip on Base UI, in the site's dark green with white text.
// It opens after a short 100ms hover (long enough to skip a pointer just
// passing through), scales in from the trigger (--transform-origin) over
// 125ms and leaves at once; once one is open, moving to a neighbour inside the
// same TooltipProvider swaps it instantly (data-instant).

function TooltipProvider({ delay = 100, closeDelay = 0, ...props }) {
  return (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} closeDelay={closeDelay} {...props} />
  )
}

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({ className, side = "top", sideOffset = 6, align = "center", children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} className="z-50">
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "origin-(--transform-origin) rounded-md bg-green-900 px-2 py-1 text-xs font-medium text-white shadow-sm",
            "transition-[opacity,scale] duration-125 ease-snappy data-[ending-style]:duration-100",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[instant]:transition-none",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

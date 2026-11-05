import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { CaretRight, DotsThree } from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"

// shadcn/ui breadcrumb (Base UI version), with Phosphor icons. Compose a
// link with `render`, e.g. <BreadcrumbLink render={<Link href="/" />}>.

function Breadcrumb({ className, ...props }) {
  return <nav aria-label="Breadcrumb" data-slot="breadcrumb" className={className} {...props} />
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2", className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />
}

function BreadcrumbLink({ className, render, ...props }) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps(
      { className: cn("rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50", className) },
      props,
    ),
    state: { slot: "breadcrumb-link" },
  })
}

function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3", className)}
      {...props}
    >
      {children ?? <CaretRight weight="bold" />}
    </li>
  )
}

function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-5 items-center justify-center [&>svg]:size-4", className)}
      {...props}
    >
      <DotsThree weight="bold" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

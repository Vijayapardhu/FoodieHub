import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rendered inside the field, before the text. Pass an icon. */
  startAdornment?: React.ReactNode
  /** Rendered inside the field, after the text. Pass an icon or button. */
  endAdornment?: React.ReactNode
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, startAdornment, endAdornment, invalid, ...props },
    ref
  ) => {
    const field = (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-foreground",
          "placeholder:text-muted-foreground",
          "transition-[border-color,box-shadow] duration-150",
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          invalid
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "border-input",
          startAdornment && "pl-10",
          endAdornment && "pr-10",
          className
        )}
        {...props}
      />
    )

    if (!startAdornment && !endAdornment) return field

    return (
      <div className="relative w-full">
        {startAdornment ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {startAdornment}
          </span>
        ) : null}
        {field}
        {endAdornment ? (
          <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {endAdornment}
          </span>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

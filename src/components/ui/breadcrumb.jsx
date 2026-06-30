import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function Breadcrumb({ className, ...props }) {
  return <nav aria-label="breadcrumb" className={cn("flex", className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-1 text-sm text-brand-subtext", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }) {
  return <li className={cn("flex items-center gap-1", className)} {...props} />;
}

export function BreadcrumbLink({ className, onClick, children, ...props }) {
  return (
    <button
      onClick={onClick}
      className={cn("hover:text-brand-text transition-colors", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      aria-current="page"
      className={cn("font-medium text-brand-text", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ className, ...props }) {
  return (
    <li aria-hidden className={cn("text-brand-border", className)} {...props}>
      <ChevronRight size={14} />
    </li>
  );
}

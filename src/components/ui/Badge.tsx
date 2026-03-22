import { type ReactNode } from "react";

type BadgeVariant = "green" | "gray" | "red" | "yellow" | "blue";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-accent/20 text-accent",
  gray: "bg-[#2C2C2E] text-text-secondary",
  red: "bg-error/20 text-error",
  yellow: "bg-warning/20 text-warning",
  blue: "bg-chart-2/20 text-chart-2",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export default function Badge({ variant, children, size = "sm" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  );
}

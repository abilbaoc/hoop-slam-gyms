type SkeletonVariant = "rect" | "circle" | "text";

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

const variantStyles: Record<SkeletonVariant, string> = {
  rect: "rounded-2xl",
  circle: "rounded-full",
  text: "rounded-md h-4 w-3/4",
};

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={`
        bg-[#2C2C2E] animate-pulse
        ${variantStyles[variant]}
        ${className}
      `}
    />
  );
}

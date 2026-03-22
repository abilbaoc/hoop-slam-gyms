import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendSize = "sm" | "md";

interface TrendIndicatorProps {
  value: number;
  size?: TrendSize;
}

const sizeStyles: Record<TrendSize, { text: string; icon: string }> = {
  sm: { text: "text-xs", icon: "w-3 h-3" },
  md: { text: "text-sm", icon: "w-4 h-4" },
};

export default function TrendIndicator({ value, size = "sm" }: TrendIndicatorProps) {
  const { text, icon } = sizeStyles[size];

  if (value === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-text-secondary ${text}`}>
        <Minus className={icon} />
        <span>0%</span>
      </span>
    );
  }

  const isPositive = value > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 ${text} ${
        isPositive ? "text-accent" : "text-error"
      }`}
    >
      {isPositive ? (
        <TrendingUp className={icon} />
      ) : (
        <TrendingDown className={icon} />
      )}
      <span>
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    </span>
  );
}

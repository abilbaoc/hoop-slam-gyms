import { type ReactNode } from "react";
import Card from "../ui/Card";
import TrendIndicator from "../shared/TrendIndicator";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: ReactNode;
  format?: "number" | "percent";
}

export default function KPICard({ title, value, trend, icon, format }: KPICardProps) {
  const formattedValue =
    typeof value === "number"
      ? format === "percent"
        ? `${value.toLocaleString()}%`
        : value.toLocaleString()
      : value;

  return (
    <Card hover>
      <div className="flex flex-col gap-3">
        <div className="text-accent">{icon}</div>
        <p className="text-text-secondary text-sm">{title}</p>
        <div className="flex items-end justify-between">
          <span className="font-display text-white text-4xl leading-none">{formattedValue}</span>
          {trend !== undefined && <TrendIndicator value={trend} />}
        </div>
      </div>
    </Card>
  );
}

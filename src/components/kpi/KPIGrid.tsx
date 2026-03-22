import { type ReactNode } from "react";

interface KPIGridProps {
  children: ReactNode;
}

export default function KPIGrid({ children }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

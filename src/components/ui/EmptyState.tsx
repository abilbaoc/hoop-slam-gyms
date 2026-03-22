import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-accent mb-4">{icon}</div>
      <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm">{description}</p>
    </div>
  );
}

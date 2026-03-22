import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[#1C1C1E] rounded-2xl p-6
        ${hover ? "transition-all duration-200 hover:bg-[#2C2C2E] hover:shadow-[0_0_20px_rgba(123,255,0,0.15)] cursor-pointer" : ""}
        ${onClick && !hover ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

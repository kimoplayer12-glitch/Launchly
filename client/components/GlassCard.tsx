import { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "light" | "dark" | "default";
  glow?: boolean;
  hover?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  variant = "default",
  glow = false,
  hover = true,
  className,
  ...props
}: GlassCardProps) {
  const variantClass = {
    light: "glass-light",
    dark: "glass-dark",
    default: "glass-card",
  }[variant];

  return (
    <div
      className={cn(
        variantClass,
        glow && "glow",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
        "rounded-xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

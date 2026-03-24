import React, { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FloatingCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  delay = 0,
  className,
  ...props
}: FloatingCardProps) => {
  return (
    <div
      className={cn(className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default FloatingCard;

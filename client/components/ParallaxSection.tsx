import { ReactNode, useEffect, useRef, useState, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ParallaxSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export default function ParallaxSection({
  children,
  speed = 0.5,
  className,
  ...props
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (ref.current) {
          const element = ref.current;
          const elementTop = element.getBoundingClientRect().top;
          const windowHeight = window.innerHeight;

          if (elementTop < windowHeight) {
            const adjustedSpeed = speed * 0.15;
            setOffset((windowHeight - elementTop) * adjustedSpeed);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={cn("parallax", className)}
      style={{
        transform: `translateY(${offset}px)`,
        transition: "transform 0.5s ease-out",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

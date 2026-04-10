import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type VisualizationIslandProps<TState = never> = {
  title?: string | undefined;
  description?: string | undefined;
  state?: TState;
  className?: string | undefined;
  children: ReactNode;
};

export function VisualizationIsland<TState = never>({
  title,
  description,
  className,
  children,
}: VisualizationIslandProps<TState>) {
  return (
    <section
      className={cn(
        "bg-white/[0.02] p-4 border border-white/[0.06] rounded-2xl sm:p-6",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-5 space-y-2">
          {title && (
            <h3 className="text-xl font-display font-bold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

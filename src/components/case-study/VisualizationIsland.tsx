import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

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
        'border border-white/8 bg-white/[0.03] p-4 shadow-lg shadow-black/5 sm:p-6',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-5 space-y-2">
          {title && <h3 className="text-xl font-display font-bold text-foreground">{title}</h3>}
          {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

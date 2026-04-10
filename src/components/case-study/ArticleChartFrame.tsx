import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ArticleChartFrameProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  controls?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  helper?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export default function ArticleChartFrame({
  eyebrow,
  title,
  description,
  controls,
  footer,
  aside,
  helper,
  className,
  bodyClassName,
  children,
}: ArticleChartFrameProps) {
  return (
    <section
      className={cn(
        "article-visual-frame isolate my-12 overflow-visible rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_30px_120px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      <header className="border-b border-white/[0.07] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/75">
                {eyebrow}
              </p>
            )}
            <h3 className="mt-2 font-display text-[clamp(1.35rem,1rem+1vw,2rem)] font-semibold leading-tight text-foreground">
              {title}
            </h3>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            )}
            {helper && (
              <div className="mt-3 text-xs leading-6 text-muted-foreground/85">
                {helper}
              </div>
            )}
          </div>
          {controls && <div className="min-w-0 lg:pl-6">{controls}</div>}
        </div>
      </header>

      <div
        className={cn(
          "grid gap-6 px-4 py-4 sm:px-6 sm:py-5 lg:gap-8 lg:px-8 lg:py-6",
          aside && "xl:grid-cols-[minmax(0,1.78fr)_minmax(280px,0.52fr)]",
          bodyClassName,
        )}
      >
        <div className="min-w-0">{children}</div>
        {aside && (
          <aside className="min-w-0 border-t border-white/[0.07] pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
            {aside}
          </aside>
        )}
      </div>

      {footer && (
        <footer className="border-t border-white/[0.07] px-4 py-4 text-xs leading-6 text-muted-foreground/85 sm:px-6 lg:px-8 lg:py-5">
          {footer}
        </footer>
      )}
    </section>
  );
}

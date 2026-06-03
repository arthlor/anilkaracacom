import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ArticleChartFrameProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  takeaway?: ReactNode;
  primaryMetric?:
    | {
        label: string;
        value: string;
        detail?: string | undefined;
      }
    | undefined;
  interactionHint?: ReactNode;
  density?: "compact" | "explorer";
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
  takeaway,
  primaryMetric,
  interactionHint,
  density = "compact",
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
        "article-visual-frame isolate my-10 min-w-0 overflow-hidden rounded-lg border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.01))] shadow-[0_18px_70px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      <header className="border-b border-white/[0.055] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/75">
                {eyebrow}
              </p>
            )}
            <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-[1.7rem]">
              {title}
            </h3>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
            {(takeaway || primaryMetric || interactionHint || helper) && (
              <div
                className={cn(
                  "mt-3 flex flex-wrap items-center gap-x-4 gap-y-2",
                  density === "explorer" && "lg:max-w-4xl",
                )}
              >
                {(takeaway || interactionHint || helper) && (
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                    {takeaway && (
                      <p className="max-w-2xl text-sm font-medium leading-6 text-foreground">
                        {takeaway}
                      </p>
                    )}
                    {interactionHint && (
                      <p className="text-xs leading-5 text-muted-foreground/80">
                        {interactionHint}
                      </p>
                    )}
                    {helper && (
                      <div className="text-xs leading-5 text-muted-foreground/75">
                        {helper}
                      </div>
                    )}
                  </div>
                )}
                {primaryMetric && (
                  <div className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.045] px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                      {primaryMetric.label}
                    </span>
                    <strong className="font-display text-base leading-none text-foreground">
                      {primaryMetric.value}
                    </strong>
                    {primaryMetric.detail && (
                      <span className="truncate text-xs leading-5 text-muted-foreground/80">
                        {primaryMetric.detail}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {controls && (
            <div
              className={cn(
                "min-w-0",
                density === "compact" ? "lg:pl-4" : "lg:pl-6",
              )}
            >
              {controls}
            </div>
          )}
        </div>
      </header>

      <div
        className={cn(
          "grid gap-5 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
          aside && "lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start",
          bodyClassName,
        )}
      >
        <div className="min-w-0 overflow-hidden">{children}</div>
        {aside && (
          <div className="article-chart-readout min-w-0 border-t border-white/[0.06] pt-4 lg:sticky lg:top-[96px] lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {aside}
          </div>
        )}
      </div>

      {footer && (
        <footer className="border-t border-white/[0.06] px-4 py-4 text-xs leading-6 text-muted-foreground/82 sm:px-6 lg:px-8 lg:py-5">
          {footer}
        </footer>
      )}
    </section>
  );
}

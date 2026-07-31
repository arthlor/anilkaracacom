import { useState, type ReactNode } from "react";

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
  const [mobileReadoutOpen, setMobileReadoutOpen] = useState(false);

  return (
    <section
      className={cn(
        "article-visual-frame isolate my-10 box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card/80 shadow-[0_18px_70px_hsl(var(--foreground)/0.1)]",
        aside && "max-lg:pb-2",
        className,
      )}
    >
      <header className="border-b border-border px-4 py-4 sm:px-6 lg:px-8">
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
                  <div className="inline-flex min-h-8 max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-primary/15 bg-primary/[0.045] px-3 py-1.5 sm:rounded-full">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80 shrink-0">
                      {primaryMetric.label}
                    </span>
                    <strong className="font-display text-base leading-none text-foreground shrink-0">
                      {primaryMetric.value}
                    </strong>
                    {primaryMetric.detail && (
                      <span className="text-xs leading-5 text-muted-foreground/80 shrink-0">
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
          aside && "xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8 xl:items-start",
          bodyClassName,
        )}
      >
        <div className="min-w-0 overflow-hidden">{children}</div>
        {aside && (
          <div
            className="article-chart-readout hidden min-w-0 border-t border-border pt-4 xl:sticky xl:top-[96px] xl:block xl:self-start xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
            aria-live="polite"
          >
            {aside}
          </div>
        )}
      </div>

      {aside && (
        <div
          className="article-chart-mobile-readout sticky bottom-0 z-20 border-t border-border bg-background/95 shadow-[0_-16px_48px_hsl(var(--foreground)/0.12)] backdrop-blur-xl xl:hidden"
          aria-live="polite"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={mobileReadoutOpen}
            onClick={() => setMobileReadoutOpen((open) => !open)}
          >
            <div className="min-w-0">
              {primaryMetric ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                    {primaryMetric.label}
                  </p>
                  <p className="truncate font-display text-base font-semibold text-foreground">
                    {primaryMetric.value}
                  </p>
                  {primaryMetric.detail && (
                    <p className="truncate text-xs text-muted-foreground">
                      {primaryMetric.detail}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  Chart details
                </p>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-primary transition-transform duration-200",
                mobileReadoutOpen && "rotate-180",
              )}
              aria-hidden="true"
            >
              ▲
            </span>
          </button>
          {mobileReadoutOpen && (
            <div className="max-h-[42vh] overflow-y-auto border-t border-border px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {aside}
            </div>
          )}
        </div>
      )}

      {footer && (
        <footer className="border-t border-border px-4 py-4 text-xs leading-6 text-muted-foreground/82 sm:px-6 lg:px-8 lg:py-5">
          {footer}
        </footer>
      )}
    </section>
  );
}

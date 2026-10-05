import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type ImmersiveStoryView = {
  id: string;
  kicker: string;
  title: string;
  visual: ReactNode;
};

export default function ImmersiveStoryVisualFrame({
  views,
  ariaLabel,
}: {
  views: ImmersiveStoryView[];
  ariaLabel: string;
}) {
  const [activeStepId, setActiveStepId] = useState(views[0]?.id ?? "");
  const visualRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const viewIds = views.map((view) => view.id).join("|");

  useEffect(() => {
    const allowedStepIds = new Set(viewIds.split("|"));
    const persistedStepId = visualRef.current?.closest<HTMLElement>(
      "[data-scrolly-root]",
    )?.dataset.activeStepId;
    if (
      typeof persistedStepId === "string" &&
      allowedStepIds.has(persistedStepId)
    ) {
      setActiveStepId(persistedStepId);
    }

    const handleStepChange = (event: Event) => {
      const stepId = (event as CustomEvent<{ stepId: string }>).detail.stepId;
      if (allowedStepIds.has(stepId)) {
        setActiveStepId(stepId);
      }
    };

    window.addEventListener("scrolly:stepchange", handleStepChange);
    return () =>
      window.removeEventListener("scrolly:stepchange", handleStepChange);
  }, [viewIds]);

  const activeIndex = Math.max(
    views.findIndex((view) => view.id === activeStepId),
    0,
  );
  const activeView = views[activeIndex] ?? views[0];

  if (!activeView) {
    return null;
  }

  return (
    <section
      ref={visualRef}
      className="editorial-story-visual relative isolate w-full min-w-0 overflow-hidden rounded-[18px] border border-border bg-card"
      style={{
        height: "var(--immersive-canvas-height, 500px)",
      }}
      data-active-step={activeStepId}
      aria-label={ariaLabel}
    >
      <header className="absolute inset-x-3 top-2 z-40 flex min-h-9 items-center justify-between gap-3 border-b border-border/70 pb-2 sm:inset-x-4 sm:top-3">
        <div
          className="min-w-0 truncate text-[13px] font-semibold tracking-[-0.01em] text-foreground"
          aria-live="polite"
        >
          {activeView.title}
        </div>
      </header>

      <div className="absolute inset-x-2 bottom-2 top-[46px] min-h-0 sm:inset-x-3 sm:bottom-3 sm:top-[52px]">
        {views.map((view, index) => {
          const isActive = view.id === activeStepId;

          return (
            <motion.div
              key={view.id}
              className={`absolute inset-0 min-h-0 min-w-0 ${
                isActive ? "z-20" : "pointer-events-none z-10"
              }`}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : index < activeIndex ? -10 : 10,
                scale: isActive ? 1 : 0.992,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              {view.visual}
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .editorial-story-visual :where(button, select, [role="button"]):focus-visible {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }

        .editorial-story-visual [data-heatmap-cell]:focus-visible {
          outline-color: hsl(var(--foreground));
        }

        @media (prefers-reduced-motion: reduce) {
          .editorial-story-visual *,
          .editorial-story-visual *::before,
          .editorial-story-visual *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }

          .editorial-story-visual [style*="transform"] {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}

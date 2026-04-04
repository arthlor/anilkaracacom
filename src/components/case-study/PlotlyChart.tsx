import { useEffect, useRef, useState } from "react";

type TraceModule = "bar" | "scatter";

type PlotlyModule = {
  newPlot: (
    root: HTMLDivElement,
    data: Array<Record<string, unknown>>,
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<unknown>;
  react: (
    root: HTMLDivElement,
    data: Array<Record<string, unknown>>,
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<unknown>;
  purge: (root: HTMLDivElement) => void;
  Plots: {
    resize: (root: HTMLDivElement) => void;
  };
};

type PlotlyChartProps = {
  data: Array<Record<string, unknown>>;
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  traceModules: TraceModule[];
  minHeight?: number;
  loadingLabel?: string;
  className?: string;
};

let plotlyPromise: Promise<PlotlyModule> | null = null;
const PLOTLY_TIMEOUT = 12000;

async function loadPlotly() {
  if (!plotlyPromise) {
    plotlyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Plotly load timeout"));
      }, PLOTLY_TIMEOUT);

      // @ts-ignore - minified plotly.js doesn't have local types
      import("plotly.js/dist/plotly-basic.min.js")
        .then((module) => {
          clearTimeout(timeout);
          resolve((module.default ?? module) as PlotlyModule);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }

  return plotlyPromise;
}

export default function PlotlyChart({
  data,
  layout,
  config,
  traceModules,
  minHeight = 420,
  loadingLabel = "Loading chart…",
  className,
}: PlotlyChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<PlotlyModule | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = plotRef.current;
    if (!isVisible || !root) return;

    let isActive = true;

    void (async () => {
      try {
        const Plotly = await loadPlotly();
        if (!isActive || !plotRef.current) return;

        plotlyRef.current = Plotly;
        const mergedConfig = {
          displayModeBar: false,
          responsive: true,
          ...config,
        };

        if (isReady) {
          await Plotly.react(plotRef.current, data, layout, mergedConfig);
        } else {
          await Plotly.newPlot(plotRef.current, data, layout, mergedConfig);
          setIsReady(true);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load chart");
          console.error("PlotlyChart error:", err);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [config, data, isReady, isVisible, layout, traceModules]);

  useEffect(() => {
    const root = plotRef.current;
    const Plotly = plotlyRef.current;
    if (!root || !Plotly || !isReady) return;

    const observer = new ResizeObserver(() => {
      Plotly.Plots.resize(root);
    });

    observer.observe(root);

    return () => observer.disconnect();
  }, [isReady]);

  useEffect(() => {
    return () => {
      if (plotRef.current && plotlyRef.current) {
        plotlyRef.current.purge(plotRef.current);
      }
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative ${className ?? ""}`.trim()}>
      <div
        ref={plotRef}
        style={{ minHeight }}
        className={`w-full ${error ? "hidden" : ""}`}
      />
      {!isReady && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
          style={{ minHeight }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
            {loadingLabel}
          </div>
        </div>
      )}
      {error && (
        <div
          className="flex items-center justify-center rounded-xl bg-red-950/10 p-8 text-center text-sm text-red-400"
          style={{ minHeight }}
        >
          <div className="max-w-xs">
            <p className="font-semibold text-red-300">
              Analysis visual disrupted
            </p>
            <p className="mt-2 text-red-400/80">
              The interactive data layer failed to initialize. Please refresh or
              try again.
            </p>
            <p className="mt-4 text-xs font-mono text-red-500/50 uppercase tracking-widest">
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

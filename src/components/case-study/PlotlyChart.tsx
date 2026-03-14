import { useEffect, useRef, useState } from 'react';

type TraceModule = 'bar' | 'scatter';

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
  register: (modules: unknown[]) => void;
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

const moduleMap: Record<TraceModule, () => Promise<{ default?: unknown }>> = {
  bar: () => import('plotly.js/lib/bar'),
  scatter: () => import('plotly.js/lib/scatter'),
};

let plotlyPromise: Promise<PlotlyModule> | null = null;
const registeredModules = new Set<TraceModule>();

async function loadPlotly(traceModules: TraceModule[]) {
  if (!plotlyPromise) {
    plotlyPromise = import('plotly.js/lib/core').then(
      (module) => (module.default ?? module) as PlotlyModule,
    );
  }

  const Plotly = await plotlyPromise;
  const pendingModules = traceModules.filter((traceModule) => !registeredModules.has(traceModule));

  if (pendingModules.length > 0) {
    const modules = await Promise.all(
      pendingModules.map((traceModule) => moduleMap[traceModule]()),
    );

    Plotly.register(modules.map((module) => module.default ?? module));
    pendingModules.forEach((traceModule) => registeredModules.add(traceModule));
  }

  return Plotly;
}

export default function PlotlyChart({
  data,
  layout,
  config,
  traceModules,
  minHeight = 420,
  loadingLabel = 'Loading chart…',
  className,
}: PlotlyChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<PlotlyModule | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
      { rootMargin: '200px 0px' },
    );

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = plotRef.current;
    if (!isVisible || !root) return;

    let isActive = true;

    void (async () => {
      const Plotly = await loadPlotly(traceModules);
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
    <div ref={hostRef} className={`relative ${className ?? ''}`.trim()}>
      <div
        ref={plotRef}
        style={{ minHeight }}
        className="w-full"
      />
      {!isReady && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
          style={{ minHeight }}
        >
          {loadingLabel}
        </div>
      )}
    </div>
  );
}

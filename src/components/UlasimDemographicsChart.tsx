import { useEffect, useRef, useState } from "react";

import PlotlyChart from "./case-study/PlotlyChart";

interface DemoData {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
}

function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M9 3H5v4M15 3h4v4M9 21H5v-4M19 21h-4v-4" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M15 3h6v6M9 3H3v6M15 21h6v-6M9 21H3v-6" />
    </svg>
  );
}

export default function UlasimDemographicsChart() {
  const [data, setData] = useState<DemoData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;

    void fetch("/data/izmir-ulasim-demographics.json")
      .then((response) => response.json())
      .then((payload: DemoData) => {
        if (isActive) {
          setData(payload);
        }
      });

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      isActive = false;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen();
      return;
    }

    void document.exitFullscreen();
  };

  if (!data) {
    return (
      <div className="my-8 flex h-[500px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-sm text-slate-400">
        Loading demographic data…
      </div>
    );
  }

  const premiumColors: Record<string, string> = {
    STUDENT: "#60A5FA",
    FULL_FARE: "#10B981",
    SIXTY_YEARS_OLD: "#F59E0B",
    FREE: "#F87171",
    TEACHER: "#A78BFA",
    OTHER: "#94A3B8",
  };

  const plotData = data.groups.map((group) => ({
    x: data.months,
    y: data.series[group],
    name: group.replace(/_/g, " "),
    type: "bar",
    marker: {
      color: premiumColors[group] || "#64748b",
      line: { width: 0 },
    },
  }));

  return (
    <div
      ref={containerRef}
      className={`relative my-10 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0f172a] shadow-2xl transition-all duration-300 ${
        isFullscreen ? "h-screen p-8" : "h-[550px] p-4"
      }`}
    >
      <div className="z-10 mb-4 flex items-center justify-between">
        <div className="ml-2">
          <h3 className="text-xl font-bold tracking-tight text-slate-100">
            Ridership Demographics Over Time
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Monthly shifts across full-fare, student, free, and other rider
            groups
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="mr-2 rounded-xl bg-slate-800/80 p-2 text-slate-300 transition-all hover:scale-105 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <FullscreenIcon active={isFullscreen} />
        </button>
      </div>

      <div className="relative flex-1">
        <PlotlyChart
          traceModules={["bar"]}
          data={plotData}
          minHeight={isFullscreen ? 820 : 500}
          loadingLabel="Loading demographic data…"
          className="h-full"
          layout={{
            barmode: "stack",
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#94a3b8", family: "Inter, sans-serif" },
            xaxis: {
              showgrid: false,
              zeroline: false,
              tickangle: -45,
              tickfont: { size: 10, color: "#64748b" },
            },
            yaxis: {
              title: {
                text: "Monthly Total Rides",
                font: { size: 12, color: "#64748b" },
              },
              showgrid: true,
              gridcolor: "#1e293b",
              zeroline: false,
              tickfont: { size: 10, color: "#64748b" },
            },
            margin: { t: 20, r: 30, b: 100, l: 80 },
            legend: {
              orientation: "h",
              y: -0.25,
              x: 0.5,
              xanchor: "center",
              font: { color: "#cbd5e1", size: 12 },
            },
            hovermode: "x unified",
            hoverlabel: {
              bgcolor: "#1e293b",
              bordercolor: "#334155",
              font: { color: "#f8fafc", family: "Inter, sans-serif" },
            },
            autosize: true,
          }}
        />
      </div>
    </div>
  );
}

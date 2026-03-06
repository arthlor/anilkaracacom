import { useState, useEffect, useRef } from 'react';
import { CornersOut, CornersIn } from '@phosphor-icons/react';

interface ChartData {
  weeks: string[];
  categories: string[];
  series: Record<string, number[]>;
}

export default function UlasimRecoveryChart() {
  const [data, setData] = useState<ChartData | null>(null);
  const [Plot, setPlot] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import Plotly only on the client side
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });

    fetch('/data/izmir-ulasim-transport-weekly.json')
      .then(res => res.json())
      .then(setData);

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  if (!Plot || !data) {
    return (
      <div className="w-full h-[500px] my-8 rounded-xl flex flex-col items-center justify-center border border-slate-800 bg-slate-900/50 backdrop-blur-sm animate-pulse">
        <div className="text-slate-400 font-mono">Loading Interactive Weekly Data...</div>
      </div>
    );
  }

  const premiumColors = {
    'Metro': '#A78BFA', // Soft Purple
    'Bus': '#F87171', // Soft Red
    'Train': '#60A5FA', // Soft Blue
    'Ferry': '#38BDF8', // Cyan
    'Tram': '#34D399', // Emerald
    'Other': '#94A3B8' // Slate
  };

  const plotData = data.categories.map(cat => {
    return {
      x: data.weeks,
      y: data.series[cat],
      name: cat,
      type: 'scatter',
      mode: 'lines',
      stackgroup: 'one',
      line: {
        width: 1,
        color: (premiumColors as any)[cat] || '#6366f1'
      },
      fillcolor: (premiumColors as any)[cat] ? (premiumColors as any)[cat] + '33' : undefined // 20% opacity
    };
  });

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl shadow-2xl transition-all duration-300 border border-slate-700/50 bg-[#0f172a] overflow-hidden flex flex-col ${
        isFullscreen ? 'h-screen p-8' : 'h-[650px] my-10 p-4'
      }`}
    >
      <div className="flex justify-between items-center mb-4 z-20">
        <div className="flex flex-col ml-2">
          <h3 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            İzmir Public Transportation Recovery (Weekly)
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Analyze ridership trends by week (2021-2024)
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 mr-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <CornersIn size={22} weight="bold" /> : <CornersOut size={22} weight="bold" />}
        </button>
      </div>

      <div className="flex-1 w-full h-full relative">
        <Plot
          data={plotData as any}
          layout={{
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#cbd5e1', family: 'Inter, sans-serif' },
            xaxis: {
              showgrid: false,
              zeroline: false,
              tickangle: -45,
              tickfont: { size: 10, color: '#94a3b8' },
              rangeslider: { visible: true, thickness: 0.1, bgcolor: '#1e293b' },
              type: 'category'
            },
            yaxis: {
              title: { text: 'Weekly Total Rides', font: { size: 12, color: '#94a3b8' } },
              showgrid: true,
              gridcolor: '#334155',
              zeroline: false,
              tickfont: { size: 10, color: '#94a3b8' }
            },
            margin: { t: 20, r: 30, b: 20, l: 80 },
            legend: {
              orientation: 'h',
              y: 1.1,
              x: 0.5,
              xanchor: 'center',
              font: { color: '#f8fafc', size: 12 }
            },
            hovermode: 'x unified',
            hoverlabel: {
              bgcolor: '#0f172a',
              bordercolor: '#475569',
              font: { color: '#f8fafc', family: 'Inter, sans-serif' }
            },
            autosize: true,
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}


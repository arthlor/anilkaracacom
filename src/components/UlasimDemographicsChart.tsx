import { useState, useEffect, useRef } from 'react';
import { CornersOut, CornersIn } from '@phosphor-icons/react';

interface DemoData {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
}

export default function UlasimDemographicsChart() {
  const [data, setData] = useState<DemoData | null>(null);
  const [Plot, setPlot] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import Plotly only on the client side
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });

    fetch('/data/izmir-ulasim-demographics.json')
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
        <div className="text-slate-400 font-mono">Loading Demographic Data...</div>
      </div>
    );
  }

  const premiumColors = {
    'STUDENT': '#60A5FA', // Sky Blue
    'FULL_FARE': '#10B981', // Emerald
    'SIXTY_YEARS_OLD': '#F59E0B', // Amber
    'FREE': '#F87171', // Red
    'TEACHER': '#A78BFA', // Violet
    'OTHER': '#94A3B8' // Slate
  };

  const plotData = data.groups.map(group => {
    const color = (premiumColors as any)[group] || '#64748b';
    const friendlyName = group.replace(/_/g, ' ');

    return {
      x: data.months,
      y: data.series[group],
      name: friendlyName,
      type: 'bar',
      marker: { 
        color,
        line: { width: 0 }
      }
    };
  });

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl shadow-2xl transition-all duration-300 border border-slate-700/50 bg-[#0f172a] overflow-hidden flex flex-col ${
        isFullscreen ? 'h-screen p-8' : 'h-[550px] my-10 p-4'
      }`}
    >
      <div className="flex justify-between items-center mb-4 z-20">
        <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight ml-2">
          {isFullscreen ? 'Ridership Demographics Over Time' : ''}
        </h3>
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
            title: isFullscreen ? undefined : {
              text: 'Ridership Demographics Over Time',
              font: { color: '#f8fafc', size: 20, family: 'Space Grotesk, sans-serif' },
              x: 0.05
            },
            barmode: 'stack',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#94a3b8', family: 'Inter, sans-serif' },
            xaxis: {
              showgrid: false,
              zeroline: false,
              tickangle: -45,
              tickfont: { size: 10, color: '#64748b' }
            },
            yaxis: {
              title: { text: 'Monthly Total Rides', font: { size: 12, color: '#64748b' } },
              showgrid: true,
              gridcolor: '#1e293b',
              zeroline: false,
              tickfont: { size: 10, color: '#64748b' }
            },
            margin: { t: isFullscreen ? 20 : 60, r: 30, b: 100, l: 80 },
            legend: {
              orientation: 'h',
              y: -0.25,
              x: 0.5,
              xanchor: 'center',
              font: { color: '#cbd5e1', size: 12 }
            },
            hovermode: 'x unified',
            hoverlabel: {
              bgcolor: '#1e293b',
              bordercolor: '#334155',
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

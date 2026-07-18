import React from 'react';
import { UrgeLog } from '../types';
import { Flame, ShieldCheck, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

interface ProgressChartsProps {
  streakCount: number;
  urges: UrgeLog[];
}

export default function ProgressCharts({ streakCount, urges }: ProgressChartsProps) {
  const totalUrges = urges.length;
  const resistedUrges = urges.filter(u => u.status === 'resisted').length;
  const slips = totalUrges - resistedUrges;
  const resistanceRate = totalUrges > 0 ? Math.round((resistedUrges / totalUrges) * 100) : 100;

  // Let's create an SVG chart representing the intensity trend of the last 7 urges
  const lastSevenUrges = [...urges].slice(0, 7).reverse();
  const maxIntensity = 10;
  
  // Coordinates for the SVG line chart
  const padding = 20;
  const chartHeight = 80;
  const chartWidth = 260;
  
  const points = lastSevenUrges.map((urge, idx) => {
    const x = idx * (chartWidth / (lastSevenUrges.length - 1 || 1)) + padding;
    // Invert Y coordinate because SVG 0,0 is top-left
    const y = chartHeight - (urge.intensity / maxIntensity) * (chartHeight - padding) - padding/2;
    return { x, y, ...urge };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="progress-charts-bento">
      {/* 1. Streak Tracker */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-52">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">RE-ALIGNMENT STREAK</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2.5 py-1 rounded-full border border-indigo-100 font-bold uppercase tracking-wider">
            ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center animate-pulse">
              <Flame className="w-10 h-10 text-indigo-600 fill-indigo-500" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-sans font-bold text-slate-800 tracking-tight">{streakCount}</span>
            <span className="text-sm font-sans font-medium text-slate-500 block">Consecutive Days</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Sustaining focus re-orders neural connections. Every consecutive day deepens the cognitive wedge.
        </p>
      </div>

      {/* 2. Success Rate Stats */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-52">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">RESISTANCE PERFORMANCE</span>

        <div className="grid grid-cols-2 gap-4 py-1">
          <div className="space-y-1">
            <span className="text-3xl font-bold text-slate-800 block">{resistanceRate}%</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SUCCESS RATE</span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-bold text-slate-800 block">{resistedUrges}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">URGES DEFLECTED</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
          <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            {slips === 0 
              ? "Flawless record logged so far. Exceptional effort!" 
              : `${resistedUrges} resisted vs. ${slips} slips logged. Focus on triggers.`}
          </span>
        </div>
      </div>

      {/* 3. Urge Trend Line */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-52">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">CRAVING INTENSITY TREND</span>

        {lastSevenUrges.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
            <Calendar className="w-6 h-6 text-slate-300 mb-1" />
            <span className="text-xs text-slate-400">Log at least 2 urges to visualize trending loops.</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center">
            <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight}`} className="w-full h-20 overflow-visible">
              {/* Trend Line path */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                points={polylinePoints}
              />
              {/* Highlight Nodes */}
              {points.map((p, idx) => (
                <g key={p.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={p.status === 'resisted' ? '#4f46e5' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer"
                  />
                  <title>{`Intensity: ${p.intensity}/10 (${p.status})`}</title>
                </g>
              ))}
            </svg>
            <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1 font-bold">
              <span>OLDER URGES</span>
              <span>LATEST</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end text-[10px] font-mono font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            DEFLECTED
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            SLIPPED
          </span>
        </div>
      </div>
    </div>
  );
}

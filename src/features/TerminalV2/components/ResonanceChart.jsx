import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, ReferenceArea, YAxis, ReferenceDot } from 'recharts';
import { detectFlatBottomGreen, detectBeheadingRed } from '../utils/indicators';

export const ResonanceChart = ({
    title,
    meta,
    data,
    color,
    isScanning,
    showHit,
    enableTactical
}) => {
    // Extract latest metrics for display
    const latest = data.length > 0 ? data[data.length - 1] : null;
    const rsi = latest?.rsi ?? 50;
    const isOverbought = rsi > 70;
    const isOversold = rsi < 30;

    // Calculate Flat Bottom Signals (Long)
    const flatBottomIndices = useMemo(() => {
        if (!enableTactical) return [];
        return detectFlatBottomGreen(data);
    }, [data, enableTactical]);

    // Calculate Beheading Red Signals (Short)
    const beheadingRedIndices = useMemo(() => {
        if (!enableTactical) return [];
        return detectBeheadingRed(data);
    }, [data, enableTactical]);

    const hasSignals = flatBottomIndices.length > 0 || beheadingRedIndices.length > 0;

    // Check for mobile state
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="chart-wrapper group relative">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-yellow-500 transition-colors">{title}</span>
                <div className="flex items-center gap-3">
                    {enableTactical && hasSignals && (
                        <span className="text-[9px] font-mono animate-pulse flex items-center gap-2">
                            {flatBottomIndices.length > 0 && <span className="text-green-400">LONG_SIG[{flatBottomIndices.length}]</span>}
                            {beheadingRedIndices.length > 0 && <span className="text-red-400">SHORT_SIG[{beheadingRedIndices.length}]</span>}
                        </span>
                    )}
                    {latest && (
                        <div className={`flex items-center gap-1 text-[9px] font-mono border px-1 rounded ${isOverbought ? 'border-red-500/50 text-red-400' :
                            isOversold ? 'border-green-500/50 text-green-400' :
                                'border-slate-800 text-slate-600'
                            }`}>
                            <span>RSI: {rsi.toFixed(1)}</span>
                        </div>
                    )}
                    <span className="text-[9px] text-slate-600 font-mono">{meta}</span>
                </div>
            </div>

            <div className="relative hidden md:block h-[110px] rounded-lg border border-slate-800 overflow-hidden chart-grid bg-slate-900/20">

                {/* DESKTOP VIEW (Full Recharts) */}
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={100}>
                    <LineChart data={data}>
                        <YAxis domain={['auto', 'auto']} hide />

                        <Line
                            type="monotone"
                            dataKey="v"
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={1500}
                            strokeOpacity={0.8}
                        />
                        {showHit && (
                            <ReferenceArea
                                x1={data.length - 15}
                                x2={data.length - 1}
                                fill="#eab308"
                                fillOpacity={0.15}
                                stroke="#eab308"
                                strokeOpacity={0.5}
                                strokeDasharray="3 3"
                            />
                        )}

                        {/* Flat Bottom Markers (Green) */}
                        {enableTactical && flatBottomIndices.map(idx => (
                            <ReferenceDot
                                key={`fbg-${idx}`}
                                x={idx}
                                y={data[idx].l}
                                r={3}
                                fill="#4ade80"
                                stroke="#000"
                                strokeWidth={1}
                                ifOverflow="extendDomain"
                            />
                        ))}

                        {/* Beheading Red Markers (Red) */}
                        {enableTactical && beheadingRedIndices.map(idx => (
                            <ReferenceDot
                                key={`br-${idx}`}
                                x={idx}
                                y={data[idx].v}
                                r={3}
                                fill="#ef4444"
                                stroke="#000"
                                strokeWidth={1}
                                ifOverflow="extendDomain"
                            />
                        ))}

                    </LineChart>
                </ResponsiveContainer>

                {/* Visual Overlays - Hidden on Mobile via CSS */}
                {isScanning && (
                    <div className="hidden md:block absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-yellow-500 to-transparent shadow-[0_0_15px_#eab308] z-20 animate-scan pointer-events-none" />
                )}

                {/* RSI Heat Indicator Background */}
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isOverbought ? 'bg-red-500/5' : isOversold ? 'bg-green-500/5' : 'opacity-0'}`}></div>

                {/* Live Indicator Dot */}
                {data.length > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px] ${isOverbought ? 'bg-red-500 shadow-red-500' :
                            isOversold ? 'bg-green-500 shadow-green-500' :
                                'bg-slate-500'
                            }`}></div>
                        <span className="text-[8px] opacity-50 font-mono">
                            {isOverbought ? 'OVERHEAT' : isOversold ? 'OVERSOLD' : 'STABLE'}
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
};

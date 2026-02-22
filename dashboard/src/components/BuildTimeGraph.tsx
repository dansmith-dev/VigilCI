import { useMemo, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import AiSummaryModal from './AiSummaryModal';
import type { VigilResult } from '../types/vigil';
import './BuildTimeGraph.css';

interface BuildTimeGraphProps {
    testName: string;
    results: VigilResult[];
    repoFullName: string;
}

const SEGMENT_COLORS = ['#0969da', '#cf222e', '#1a7f37', '#9a6700', '#8250df', '#bf3989'];

const NIVO_THEME = {
    text: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12 },
    axis: {
        ticks: { text: { fill: '#656d76', fontSize: 11 } },
    },
    grid: {
        line: { stroke: '#d0d7de', strokeWidth: 1, strokeDasharray: '3 3' },
    },
    crosshair: {
        line: { stroke: '#0969da', strokeWidth: 1, strokeOpacity: 0.5 },
    },
};

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        + ', '
        + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatMs(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms)}ms`;
}

function BuildTimeGraph({ testName, results, repoFullName }: BuildTimeGraphProps) {
    const { allSeries, colorMap } = useMemo(() => {
        const sorted = [...results].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const segmentNames = new Set<string>();
        sorted.forEach(r => r.segments.forEach(s => segmentNames.add(s.name)));

        const names = Array.from(segmentNames);
        const cMap = new Map<string, string>();
        names.forEach((name, i) => cMap.set(name, SEGMENT_COLORS[i % SEGMENT_COLORS.length]));

        const series = names.map(segName => ({
            id: segName,
            data: sorted
                .filter(r => r.segments.some(s => s.name === segName))
                .map(r => {
                    const seg = r.segments.find(s => s.name === segName)!;
                    return {
                        x: formatTimestamp(r.timestamp),
                        y: Math.round(seg.averageMs * 100) / 100,
                        commit: r.commit,
                        branch: r.branch,
                    };
                }),
        }));

        return { allSeries: series, colorMap: cMap };
    }, [results]);

    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    function handleLegendClick(segName: string) {
        setActiveSegment(prev => prev === segName ? null : segName);
    }

    const visibleData = activeSegment
        ? allSeries.filter(s => s.id === activeSegment)
        : allSeries;

    const visibleColors = visibleData.map(s => colorMap.get(s.id)!);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handlePointClick(point: any) {
        const commit = point?.data?.commit as string | undefined;
        if (commit && repoFullName) {
            window.open(`https://github.com/${repoFullName}/commit/${commit}`, '_blank');
        }
    }

    return (
        <div className="build-time-graph">
            <div className="build-time-graph-header">
                <div className="build-time-graph-header-left">
                    <h3>{testName}</h3>
                    <button
                        className="ai-analyze-btn"
                        onClick={() => setShowAiModal(true)}
                        type="button"
                        title="AI Analysis"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        AI
                    </button>
                </div>
                <span className="build-time-graph-period">{results.length} runs</span>
            </div>

            <div className="build-time-graph-legend">
                {allSeries.map(series => {
                    const color = colorMap.get(series.id)!;
                    const isActive = activeSegment === null || activeSegment === series.id;
                    return (
                        <button
                            key={series.id}
                            className={`build-time-graph-legend-item ${isActive ? '' : 'build-time-graph-legend-item--dimmed'}`}
                            onClick={() => handleLegendClick(series.id)}
                            type="button"
                        >
                            <span className="legend-swatch" style={{ background: isActive ? color : '#d0d7de' }} />
                            {series.id}
                        </button>
                    );
                })}
                {activeSegment && (
                    <button
                        className="build-time-graph-legend-reset"
                        onClick={() => setActiveSegment(null)}
                        type="button"
                    >
                        Show all
                    </button>
                )}
            </div>

            <p className="build-time-graph-hint">Click a data point to view the commit</p>

            <div className="build-time-graph-chart">
                <ResponsiveLine
                    data={visibleData}
                    margin={{ top: 12, right: 24, bottom: 60, left: 72 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
                    curve="monotoneX"
                    colors={visibleColors}
                    lineWidth={2}
                    pointSize={10}
                    pointColor={{ from: 'seriesColor' }}
                    pointBorderWidth={2}
                    pointBorderColor="#ffffff"
                    enableArea={false}
                    enableGridX={false}
                    gridYValues={5}
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: -35,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickValues: 5,
                        format: (v) => formatMs(v as number),
                    }}
                    theme={NIVO_THEME}
                    useMesh={true}
                    onClick={handlePointClick}
                    tooltip={({ point }) => {
                        const datum = point.data as { x: string; y: number; commit?: string };
                        return (
                            <div className="graph-tooltip">
                                <div className="graph-tooltip-row">
                                    <span className="graph-tooltip-swatch" style={{ background: (point as any).serieColor ?? (point as any).seriesColor }} />
                                    <strong>{(point as any).serieId ?? (point as any).seriesId}</strong>
                                    <span>{formatMs(datum.y)}</span>
                                </div>
                                <div className="graph-tooltip-meta">{datum.x}</div>
                                {datum.commit && (
                                    <div className="graph-tooltip-commit">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.25a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
                                        </svg>
                                        {datum.commit.slice(0, 7)} — click point to open
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            {showAiModal && (
                <AiSummaryModal
                    testName={testName}
                    results={results}
                    repoFullName={repoFullName}
                    onClose={() => setShowAiModal(false)}
                />
            )}
        </div>
    );
}

export default BuildTimeGraph;

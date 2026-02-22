import { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
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
    const { chartData, colors } = useMemo(() => {
        const sorted = [...results].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const segmentNames = new Set<string>();
        sorted.forEach(r => r.segments.forEach(s => segmentNames.add(s.name)));

        const names = Array.from(segmentNames);
        const seriesColors = names.map((_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]);

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

        return { chartData: series, colors: seriesColors };
    }, [results]);

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
                <h3>{testName}</h3>
                <span className="build-time-graph-period">{results.length} runs</span>
            </div>

            <div className="build-time-graph-legend">
                {chartData.map((series, i) => (
                    <span key={series.id} className="build-time-graph-legend-item">
                        <span className="legend-swatch" style={{ background: colors[i] }} />
                        {series.id}
                    </span>
                ))}
            </div>

            <p className="build-time-graph-hint">Click a data point to view the commit</p>

            <div className="build-time-graph-chart">
                <ResponsiveLine
                    data={chartData}
                    margin={{ top: 12, right: 24, bottom: 60, left: 72 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
                    curve="monotoneX"
                    colors={colors}
                    lineWidth={2}
                    pointSize={10}
                    pointColor={{ from: 'serieColor' }}
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
                                    <span className="graph-tooltip-swatch" style={{ background: point.serieColor }} />
                                    <strong>{point.serieId}</strong>
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
        </div>
    );
}

export default BuildTimeGraph;

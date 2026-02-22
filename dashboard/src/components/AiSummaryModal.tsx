import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { VigilResult } from '../types/vigil';
import './AiSummaryModal.css';

const WORKER_URL = "https://hello-worker.daniel-smith-06a.workers.dev";

interface AiSummaryModalProps {
    testName: string;
    results: VigilResult[];
    repoFullName: string;
    onClose: () => void;
}

interface Regression {
    commit: string;
    message: string;
    segment: string;
    previousMs: number;
    currentMs: number;
    deltaMs: number;
    diff: string;
}

interface TimelineEntry {
    timestamp: string;
    commit: string;
    segments: { name: string; averageMs: number }[];
}

function detectRegressions(results: VigilResult[]): { commit: string; segment: string; previousMs: number; currentMs: number; deltaMs: number }[] {
    const sorted = [...results].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const regressions: { commit: string; segment: string; previousMs: number; currentMs: number; deltaMs: number }[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.commit === prev.commit) continue;

        for (const seg of curr.segments) {
            const prevSeg = prev.segments.find(s => s.name === seg.name);
            if (!prevSeg) continue;

            const delta = seg.averageMs - prevSeg.averageMs;
            const threshold = prevSeg.averageMs * 0.05;
            if (delta > threshold) {
                regressions.push({
                    commit: curr.commit,
                    segment: seg.name,
                    previousMs: prevSeg.averageMs,
                    currentMs: seg.averageMs,
                    deltaMs: delta,
                });
            }
        }
    }

    regressions.sort((a, b) => b.deltaMs - a.deltaMs);
    return regressions.slice(0, 3);
}

function buildTimeline(results: VigilResult[]): TimelineEntry[] {
    return [...results]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(r => ({
            timestamp: r.timestamp,
            commit: r.commit,
            segments: r.segments.map(s => ({ name: s.name, averageMs: s.averageMs })),
        }));
}

async function fetchCommitDetails(
    repoFullName: string,
    commitSha: string,
    token: string,
): Promise<{ message: string; diff: string }> {
    try {
        const [detailRes, diffRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${repoFullName}/commits/${commitSha}`, {
                headers: { Authorization: `token ${token}` },
            }),
            fetch(`https://api.github.com/repos/${repoFullName}/commits/${commitSha}`, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3.diff',
                },
            }),
        ]);

        const detail = detailRes.ok ? await detailRes.json() : null;
        const diff = diffRes.ok ? await diffRes.text() : '';

        return {
            message: detail?.commit?.message || 'Unknown commit',
            diff,
        };
    } catch {
        return { message: 'Failed to fetch commit', diff: '' };
    }
}

function AiSummaryModal({ testName, results, repoFullName, onClose }: AiSummaryModalProps) {
    const { token } = useAuth();
    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
    const [analysis, setAnalysis] = useState('');
    const [step, setStep] = useState('Detecting regressions...');

    const runAnalysis = useCallback(async () => {
        try {
            setStep('Detecting regressions...');
            const rawRegressions = detectRegressions(results);

            if (rawRegressions.length === 0) {
                setAnalysis('No significant performance regressions were detected in the test data. All changes appear to have maintained or improved performance.');
                setStatus('done');
                return;
            }

            setStep(`Fetching commit details (${rawRegressions.length} commits)...`);
            const uniqueCommits = [...new Set(rawRegressions.map(r => r.commit))];
            const commitDetails = new Map<string, { message: string; diff: string }>();

            for (const sha of uniqueCommits) {
                const details = await fetchCommitDetails(repoFullName, sha, token!);
                commitDetails.set(sha, details);
            }

            const regressions: Regression[] = rawRegressions.map(r => {
                const details = commitDetails.get(r.commit)!;
                return { ...r, message: details.message, diff: details.diff };
            });

            setStep('Analyzing with AI...');
            const timeline = buildTimeline(results);

            const res = await fetch(`${WORKER_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testName, timeline, regressions }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `Worker returned ${res.status}`);
            }

            const data = await res.json();
            setAnalysis(data.analysis);
            setStatus('done');
        } catch (err) {
            setAnalysis(err instanceof Error ? err.message : 'Analysis failed');
            setStatus('error');
        }
    }, [testName, results, repoFullName, token]);

    useEffect(() => {
        runAnalysis();
    }, [runAnalysis]);

    return (
        <div className="ai-modal-overlay" onClick={onClose}>
            <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <div className="ai-modal-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        AI Analysis — {testName}
                    </div>
                    <button className="ai-modal-close" onClick={onClose} type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="ai-modal-body">
                    {status === 'loading' && (
                        <div className="ai-modal-loading">
                            <div className="ai-modal-spinner" />
                            <p>{step}</p>
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="ai-modal-result">
                            {analysis.split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                            ))}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="ai-modal-error">
                            <p>{analysis}</p>
                            <button className="ai-modal-retry" onClick={runAnalysis} type="button">
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                <div className="ai-modal-footer">
                    Powered by Cloudflare Workers AI
                </div>
            </div>
        </div>
    );
}

export default AiSummaryModal;

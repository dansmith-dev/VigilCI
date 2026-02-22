import { useState, useMemo } from 'react';
import BuildTimeGraph from './BuildTimeGraph';
import type { VigilResult } from '../types/vigil';
import './RepoCard.css';

interface RepoCardProps {
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stars: number;
    isPrivate: boolean;
    updatedAt: string;
    vigilResults: VigilResult[];
}

function RepoCard({ name, fullName, description, language, stars, isPrivate, updatedAt, vigilResults }: RepoCardProps) {
    const [expanded, setExpanded] = useState(false);

    const testGroups = useMemo(() => {
        const groups = new Map<string, VigilResult[]>();
        for (const r of vigilResults) {
            const existing = groups.get(r.testName) || [];
            existing.push(r);
            groups.set(r.testName, existing);
        }
        return groups;
    }, [vigilResults]);

    const hasResults = testGroups.size > 0;

    return (
        <div className={`repo-card ${expanded ? 'repo-card--expanded' : ''}`}>
            <button
                className="repo-card-header"
                onClick={() => setExpanded(!expanded)}
                type="button"
            >
                <div className="repo-card-info">
                    <div className="repo-card-title-row">
                        <svg className="repo-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                        </svg>
                        <a
                            className="repo-name"
                            href={`https://github.com/${fullName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {name}
                        </a>
                        {isPrivate && <span className="repo-badge">Private</span>}
                        {hasResults && <span className="repo-badge repo-badge--vigil">{testGroups.size} tests</span>}
                    </div>
                    {description && <p className="repo-description">{description}</p>}
                    <div className="repo-meta">
                        {language && (
                            <span className="repo-language">
                                <span className={`language-dot language-${language.toLowerCase()}`} />
                                {language}
                            </span>
                        )}
                        {stars > 0 && (
                            <span className="repo-stars">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                                </svg>
                                {stars}
                            </span>
                        )}
                        <span className="repo-updated">Updated {new Date(updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <svg
                    className={`repo-chevron ${expanded ? 'repo-chevron--open' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {expanded && (
                hasResults ? (
                    Array.from(testGroups.entries()).map(([testName, testResults]) => (
                        <BuildTimeGraph
                            key={testName}
                            testName={testName}
                            results={testResults}
                            repoFullName={fullName}
                        />
                    ))
                ) : (
                    <div className="repo-card-empty">
                        No VigilCI results found for this repository.
                    </div>
                )
            )}
        </div>
    );
}

export default RepoCard;

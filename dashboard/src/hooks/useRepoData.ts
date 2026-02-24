import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Repo } from '../types/repo';
import type { VigilResult } from '../types/vigil';

function githubFetch(url: string, token: string, bustCache: boolean): Promise<Response> {
    return fetch(url, {
        headers: { Authorization: `token ${token}` },
        cache: bustCache ? 'no-store' : 'default',
    });
}

async function fetchRepos(token: string, bustCache: boolean): Promise<Repo[]> {
    const res = await githubFetch(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        token,
        bustCache,
    );
    if (!res.ok) throw new Error('Failed to fetch repositories');
    return res.json();
}

interface VigilFetchResult {
    results: VigilResult[];
    gistFound: boolean;
}

async function fetchVigilResults(token: string, bustCache: boolean): Promise<VigilFetchResult> {
    const res = await githubFetch(
        'https://api.github.com/gists?per_page=100',
        token,
        bustCache,
    );
    if (!res.ok) return { results: [], gistFound: false };

    const gists = await res.json();
    const vigilGist = gists.find(
        (g: { files: Record<string, unknown> }) => g.files['vigilci-results.json']
    );
    if (!vigilGist) return { results: [], gistFound: false };

    const gistFile = vigilGist.files['vigilci-results.json'] as {
        content?: string;
        truncated?: boolean;
        raw_url: string;
    };

    if (gistFile.content && !gistFile.truncated) {
        return { results: JSON.parse(gistFile.content), gistFound: true };
    }

    const dataRes = await githubFetch(
        `https://api.github.com/gists/${vigilGist.id}`,
        token,
        bustCache,
    );
    if (!dataRes.ok) return { results: [], gistFound: true };

    const fullGist = await dataRes.json();
    const fullContent = fullGist.files['vigilci-results.json']?.content;
    return { results: fullContent ? JSON.parse(fullContent) : [], gistFound: true };
}

export function useRepoData() {
    const { token } = useAuth();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [vigilResults, setVigilResults] = useState<VigilResult[]>([]);
    const [hasGist, setHasGist] = useState(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (!token) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const [repoData, vigilData] = await Promise.all([
                fetchRepos(token, isRefresh),
                fetchVigilResults(token, isRefresh),
            ]);
            setRepos(repoData);
            setVigilResults(vigilData.results);
            setHasGist(vigilData.gistFound);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const refresh = useCallback(() => load(true), [load]);

    const resultsByRepo = useMemo(() => {
        const map = new Map<string, VigilResult[]>();
        for (const r of vigilResults) {
            if (!r.repository) continue;
            const existing = map.get(r.repository) || [];
            existing.push(r);
            map.set(r.repository, existing);
        }
        return map;
    }, [vigilResults]);

    return { repos, resultsByRepo, hasGist, loading, refreshing, error, refresh };
}

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRepoData } from '../hooks/useRepoData';
import TopNav from '../components/TopNav';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import RepoCard from '../components/RepoCard';
import SetupBanner from '../components/SetupBanner';
import './Repos.css';

function Repos() {
    const { logout } = useAuth();
    const { repos, resultsByRepo, hasGist, loading, refreshing, error, refresh } = useRepoData();
    const [search, setSearch] = useState('');
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return repos;
        const q = search.toLowerCase();
        return repos.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.full_name.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.language && r.language.toLowerCase().includes(q))
        );
    }, [repos, search]);

    if (loading) {
        return (
            <div className="repos-page">
                <TopNav />
                <Spinner message="Loading repositories..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="repos-page">
                <TopNav />
                <div className="repos-error">
                    <p>{error}</p>
                    <button className="repos-error-btn" onClick={logout}>Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="repos-page">
            <TopNav />
            <div className="repos-content">
                <PageHeader
                    title="Repositories"
                    subtitle={`${repos.length} repos tracked`}
                    actions={[
                        { label: 'Refresh', onClick: refresh, variant: 'secondary', loading: refreshing },
                        { label: 'Sign out', onClick: logout },
                    ]}
                />
                <SearchBar value={search} onChange={setSearch} />

                {!hasGist && !bannerDismissed && (
                    <SetupBanner onDismiss={() => setBannerDismissed(true)} />
                )}

                {filtered.length === 0 ? (
                    <div className="repos-empty">
                        <p>No repositories match <strong>"{search}"</strong></p>
                    </div>
                ) : (
                    <div className="repos-list">
                        {filtered.map(repo => (
                            <RepoCard
                                key={repo.id}
                                name={repo.name}
                                fullName={repo.full_name}
                                description={repo.description}
                                language={repo.language}
                                stars={repo.stargazers_count}
                                isPrivate={repo.private}
                                updatedAt={repo.updated_at}
                                vigilResults={resultsByRepo.get(repo.full_name) || []}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Repos;

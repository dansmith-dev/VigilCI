import './App.css'
import { useState, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';

const WORKER_URL = "https://hello-worker.daniel-smith-06a.workers.dev";
const GITHUB_CLIENT_ID = "Ov23lixyN6BThSp0tC7U";

function App() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            window.location.href = `${WORKER_URL}/exchange?code=${code}`;
        }
    }, []);

    useEffect(() => {
        fetch(`${WORKER_URL}/github/user`, { credentials: "include" })
            .then(res => setIsAuthenticated(res.ok))
            .catch(() => setIsAuthenticated(false));
    }, []);

    function loginWithGitHub() {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,repo`;
        window.location.href = authUrl;
    }

    function logout() {
        window.location.href = `${WORKER_URL}/logout`;
    }

    async function fetchRepos() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${WORKER_URL}/github/user/repos?sort=updated`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch repos");
            setRepos(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <h1>Login to VigilCI</h1>
                <button className="github-button" onClick={loginWithGitHub}>
                    <img
                        src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                        alt="GitHub Logo"
                    />
                    Login with GitHub
                </button>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header>
                <h1>VigilCI</h1>
                <button onClick={logout}>Logout</button>
            </header>

            <main>
                <button onClick={fetchRepos} disabled={loading}>
                    {loading ? "Loading..." : "Get My Repos"}
                </button>

                {error && <p className="error">{error}</p>}

                {repos.length > 0 && (
                    <ul className="repo-list">
                        {repos.map(repo => (
                            <li key={repo.id}>
                                <a href={repo.html_url} target="_blank" rel="noreferrer">
                                    {repo.full_name}
                                </a>
                                <span>{repo.description}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}

export default App;
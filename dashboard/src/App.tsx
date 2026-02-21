import './App.css'
import { useState, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';

const WORKER_URL = "https://hello-worker.daniel-smith-06a.workers.dev";
let githubToken = null;

function App() {
    const [searchParams] = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) return;

        fetch(`${WORKER_URL}/exchange?code=${code}`)
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    githubToken = data.token;
                    setIsAuthenticated(true);
                    window.history.replaceState({}, "", window.location.pathname);
                }
            });
    }, []);

    function loginWithGitHub() {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=Ov23lixyN6BThSp0tC7U&scope=read:user,gist`;
        window.location.href = authUrl;
    }

    return (
        <div className="login-container">
            <h1>Login to MyApp</h1>
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

export default App;
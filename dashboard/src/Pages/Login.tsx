import './Login.css'
import logo from '../assets/logo.svg'
import TopNav from '../components/TopNav'
import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

function Login() {
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate()
    const hasExchanged = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code || hasExchanged.current) return;

        hasExchanged.current = true;

        fetch(`${WORKER_URL}/exchange?code=${code}`)
            .then(res => res.json())
            .then(data => {
                login(data.token);
                navigate('/repos', { replace: true });
            });
    }, []);

    function loginWithGitHub() {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,gist,repo`;
        window.location.href = authUrl;
    }

    return (
        <div className="login-container">
            <TopNav />
            <div className="logo-container">
                <img src={logo} alt="VigilCI" id="logo" />
                <h1>VigilCI</h1>
            </div>
            <p className="tagline">Track app performance trends directly in CI</p>
            <button className="login-button" onClick={loginWithGitHub}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#24292e">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
            </button>
        </div>
    );
}

export default Login;

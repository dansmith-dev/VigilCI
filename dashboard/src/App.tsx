import './App.css'
import { useState, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';

function App() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [code, setCode] = useState();

    useEffect(() => {
        const urlCode = searchParams.get("code");

        if (urlCode) {
            console.log(urlCode);
            setCode(urlCode);
        }
    }, [searchParams]);
    
    function redirectToGitHub() {
        const client_id = "Ov23lixyN6BThSp0tC7U";
        const scope = "read:user";


        const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}`;


        window.location.href = authUrl;
    }
    
  return (
      <div className="login-container">
          <h1>Login to MyApp</h1>
          <button className="github-button" onClick={redirectToGitHub}>
              <img
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  alt="GitHub Logo"
              />
              Login with GitHub
          </button>
      </div>
  )
}

export default App

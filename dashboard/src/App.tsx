import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

    function redirectToGitHub() {
        const client_id = "blah blah";
        const redirect_uri = "http://localhost:5173/";
        const scope = "read:user";


        const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`;


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

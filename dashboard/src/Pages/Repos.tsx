import { useEffect } from "react";
import { useAuth } from '../context/AuthContext'

const Repos = () => {

    const { token, login, logout } = useAuth();

    useEffect(() => {
        console.log(token);
        fetch('https://api.github.com/user/repos', {
            headers: {
                Authorization: `token ${token}`
            }
        })
            .then(res => res.json())
            .then(data => console.log(data));
    }, []);
    
    return (
        <h1>Repos</h1>
    )
}

export default Repos;
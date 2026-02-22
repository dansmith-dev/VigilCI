import { Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if(!token)
            navigate('/', { replace: true });
    }, [token]);

    return children;
}

export default ProtectedRoute;
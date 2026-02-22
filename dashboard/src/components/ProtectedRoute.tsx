import { useEffect, type ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if(!token)
            navigate('/', { replace: true });
    }, [token, navigate]);

    return <>{children}</>;
}

export default ProtectedRoute;

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store in localStorage so axios interceptor can use it
      localStorage.setItem('authToken', token);
      // Re-check auth with the new token
      checkAuth().then(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      flexDirection: 'column',
      gap: 20
    }}>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '2.5rem',
        color: '#EAB21B',
        fontWeight: 900,
        letterSpacing: 6
      }}>KOLOT</div>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(234,178,27,0.2)',
        borderTop: '3px solid #EAB21B',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: '#666', fontFamily: 'Assistant, sans-serif', fontSize: '0.9rem' }}>
        מתחבר...
      </div>
    </div>
  );
};

export default AuthCallback;

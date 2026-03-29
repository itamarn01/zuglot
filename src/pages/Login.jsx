import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const { loginUrl } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #111122 50%, #0d0d1a 100%)',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <div style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '4.5rem',
          letterSpacing: '8px',
          color: '#fff',
          lineHeight: 1,
          marginBottom: '4px',
        }}>KOLOT</div>
        <div style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '1.5rem',
          color: '#EAB21B',
          letterSpacing: '6px',
          marginBottom: '8px',
        }}>TURN IT UP.</div>
        <div style={{
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '1.1rem',
          color: '#81C7D5',
          letterSpacing: '4px',
          marginBottom: '48px',
        }}>CRM SYSTEM</div>
        
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '8px',
          }}>ברוכים הבאים</h2>
          <p style={{
            color: '#B0B0B0',
            fontSize: '0.9rem',
            marginBottom: '32px',
          }}>התחברו כדי לנהל את הלידים שלכם</p>
          
          <a
            href={loginUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 24px',
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseOver={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 16px rgba(255,255,255,0.15)';
            }}
            onMouseOut={e => {
              e.target.style.transform = '';
              e.target.style.boxShadow = '';
            }}
          >
            <FcGoogle size={24} />
            התחבר עם Google
          </a>
        </div>
        
        <p style={{
          marginTop: '24px',
          color: '#666680',
          fontSize: '0.8rem',
        }}>© {new Date().getFullYear()} להקת קולות - כל הזכויות שמורות</p>
      </div>
    </div>
  );
};

export default Login;

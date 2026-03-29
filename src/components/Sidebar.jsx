import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiUsers, FiPackage, FiFileText, FiSettings, 
  FiCalendar, FiGrid, FiLogOut, FiMenu, FiX, FiTrendingUp,
  FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: 'דשבורד' },
    { path: '/leads', icon: FiUsers, label: 'מעקב זוגות' },
    { path: '/won', icon: FiCheckCircle, label: 'WIN' },
    { path: '/lost', icon: FiXCircle, label: 'LOST' },
    { path: '/products', icon: FiGrid, label: 'מוצרים' },
    { path: '/packages', icon: FiPackage, label: 'חבילות' },
    { path: '/contracts', icon: FiFileText, label: 'חוזים' },
    { path: '/calendar', icon: FiCalendar, label: 'יומן' },
    { path: '/settings', icon: FiSettings, label: 'הגדרות' },
  ];

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span style={{fontSize:'1.6rem',lineHeight:1}}>🎵</span>
            <div>
              <span className="logo-text">KOLOT</span>
              <div className="logo-subtitle" style={{fontSize:'0.7rem',marginTop:-2}}>CRM</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              {user.avatar && <img src={user.avatar} alt="" className="user-avatar" />}
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={logout}>
            <FiLogOut />
            <span>התנתק</span>
          </button>
        </div>
      </aside>
      
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default Sidebar;

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiUsers, FiPackage, FiFileText, FiSettings, 
  FiCalendar, FiGrid, FiLogOut, FiMenu, FiX, FiTrendingUp,
  FiCheckCircle, FiXCircle, FiMoreHorizontal, FiLayers
} from 'react-icons/fi';
import { useState } from 'react';
import './Sidebar.css';

// Main nav items for bottom tab bar (max 5 primary)
const primaryTabs = [
  { path: '/dashboard', icon: FiHome, label: 'דשבורד' },
  { path: '/leads',    icon: FiUsers,       label: 'מעקב' },
  // "זוגות" group – sub-tabs handled via SubTabs page
  { path: '/tracking-group', icon: FiTrendingUp, label: 'זוגות', isGroup: true, children: [
    { path: '/leads', icon: FiUsers, label: 'מעקב' },
    { path: '/won',   icon: FiCheckCircle, label: 'WIN' },
    { path: '/lost',  icon: FiXCircle,     label: 'LOST' },
  ]},
  { path: '/catalog-group', icon: FiLayers, label: 'קטלוג', isGroup: true, children: [
    { path: '/products', icon: FiGrid,    label: 'מוצרים' },
    { path: '/packages', icon: FiPackage, label: 'חבילות' },
  ]},
  { path: '/contracts', icon: FiFileText, label: 'חוזים' },
  { path: '/calendar',  icon: FiCalendar, label: 'יומן' },
];

// All sidebar items for desktop
const navItems = [
  { path: '/dashboard', icon: FiHome,        label: 'דשבורד' },
  { path: '/leads',     icon: FiUsers,       label: 'מעקב זוגות' },
  { path: '/won',       icon: FiCheckCircle, label: 'WIN' },
  { path: '/lost',      icon: FiXCircle,     label: 'LOST' },
  { path: '/products',  icon: FiGrid,        label: 'מוצרים' },
  { path: '/packages',  icon: FiPackage,     label: 'חבילות' },
  { path: '/contracts', icon: FiFileText,    label: 'חוזים' },
  { path: '/calendar',  icon: FiCalendar,    label: 'יומן' },
  { path: '/settings',  icon: FiSettings,    label: 'הגדרות' },
];

// Bottom tabs: dashboard, tracking-group, catalog-group, contracts, calendar, more(settings+logout)
const bottomTabs = [
  { path: '/dashboard', icon: FiHome, label: 'דשבורד' },
  {
    id: 'tracking', icon: FiTrendingUp, label: 'זוגות', isGroup: true,
    children: [
      { path: '/leads', icon: FiUsers,       label: 'מעקב' },
      { path: '/won',   icon: FiCheckCircle, label: 'WIN' },
      { path: '/lost',  icon: FiXCircle,     label: 'LOST' },
    ]
  },
  {
    id: 'catalog', icon: FiLayers, label: 'קטלוג', isGroup: true,
    children: [
      { path: '/products', icon: FiGrid,    label: 'מוצרים' },
      { path: '/packages', icon: FiPackage, label: 'חבילות' },
    ]
  },
  { path: '/contracts', icon: FiFileText, label: 'חוזים' },
  { path: '/calendar',  icon: FiCalendar, label: 'יומן' },
  { id: 'more', icon: FiMoreHorizontal, label: 'עוד', isMore: true },
];

const moreItems = [
  { path: '/settings', icon: FiSettings, label: 'הגדרות' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // 'tracking' | 'catalog' | null
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isGroupActive = (children) =>
    children?.some(c => location.pathname === c.path);

  const handleGroupTab = (tabId) => {
    if (openGroup === tabId) {
      setOpenGroup(null);
    } else {
      setOpenGroup(tabId);
      setShowMore(false);
    }
  };

  const handleMoreTab = () => {
    setShowMore(v => !v);
    setOpenGroup(null);
  };

  const closeAll = () => { setOpenGroup(null); setShowMore(false); };

  return (
    <>
      {/* ── Desktop / Tablet hamburger toggle ── */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* ── Desktop Sidebar ── */}
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

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="bottom-tab-bar">
        {bottomTabs.map((tab) => {
          if (tab.isMore) {
            return (
              <button
                key="more"
                className={`tab-item ${showMore ? 'active' : ''}`}
                onClick={handleMoreTab}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            );
          }

          if (tab.isGroup) {
            const active = isGroupActive(tab.children);
            return (
              <button
                key={tab.id}
                className={`tab-item ${active || openGroup === tab.id ? 'active' : ''}`}
                onClick={() => handleGroupTab(tab.id)}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
              onClick={closeAll}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ─── Group Sub-menu Drawers ─── */}
      {openGroup && (
        <>
          <div className="tab-more-overlay" onClick={closeAll} />
          <div className="tab-more-menu">
            <div className="tab-more-header">
              <span className="tab-more-title">
                {openGroup === 'tracking' ? '📊 מעקב זוגות' : '🎵 קטלוג'}
              </span>
              <button onClick={closeAll} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'1.2rem'}}>
                <FiX />
              </button>
            </div>
            <div className="tab-more-grid">
              {(openGroup === 'tracking'
                ? [
                    { path: '/leads', icon: FiUsers,       label: 'מעקב זוגות' },
                    { path: '/won',   icon: FiCheckCircle, label: '✅ WIN' },
                    { path: '/lost',  icon: FiXCircle,     label: '❌ LOST' },
                  ]
                : [
                    { path: '/products', icon: FiGrid,    label: 'מוצרים' },
                    { path: '/packages', icon: FiPackage, label: 'חבילות' },
                  ]
              ).map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `tab-more-item ${isActive ? 'active' : ''}`}
                  onClick={closeAll}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── "More" Drawer ─── */}
      {showMore && (
        <>
          <div className="tab-more-overlay" onClick={closeAll} />
          <div className="tab-more-menu">
            <div className="tab-more-header">
              <span className="tab-more-title">⚙️ תפריט</span>
              <button onClick={closeAll} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'1.2rem'}}>
                <FiX />
              </button>
            </div>
            <div className="tab-more-grid">
              {moreItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `tab-more-item ${isActive ? 'active' : ''}`}
                  onClick={closeAll}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <div className="tab-user-row">
              <div className="tab-user-info">
                {user?.avatar && <img src={user.avatar} alt="" className="tab-user-avatar" />}
                <span className="tab-user-name">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--error-dim)',border:'1px solid var(--error)',color:'var(--error)',borderRadius:'var(--radius-sm)',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',fontFamily:'var(--font-body)'}}
              >
                <FiLogOut /> התנתק
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;

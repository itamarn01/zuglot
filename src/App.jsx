import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Products from './pages/Products';
import Packages from './pages/Packages';
import Contracts from './pages/Contracts';
import ContractView from './pages/ContractView';
import Settings from './pages/Settings';
import CalendarPage from './pages/CalendarPage';
import PublicForm from './pages/PublicForm';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/form" element={<PublicForm />} />
      <Route path="/contract/:linkToken" element={<ContractView />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads filter="tracking" />} />
                <Route path="/won" element={<Leads filter="won" />} />
                <Route path="/lost" element={<Leads filter="lost" />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/products" element={<Products />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

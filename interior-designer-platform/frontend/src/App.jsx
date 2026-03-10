import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthToken } from './api';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DesignerDashboard from './pages/DesignerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ProjectDetail from './pages/ProjectDetail';

const ROLES = { designer: 'designer', client: 'client', employee: 'employee' };
const ALL_ROLES = [ROLES.designer, ROLES.client, ROLES.employee];

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('token', token);
    } else {
      setAuthToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, [token]);

  const handleLogin = (data) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const handleLogout = () => setToken(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <span style={{ color: '#666' }}>Loading…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
      <Route path="/signup" element={token ? <Navigate to="/" replace /> : <Signup />} />

      <Route path="/" element={
        <PrivateRoute user={user} token={token} allowedRoles={ALL_ROLES}>
          {user?.role === 'designer' && <DesignerDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'client' && <ClientDashboard user={user} onLogout={handleLogout} />}
          {(user?.role === 'employee' || (user && !['designer', 'client'].includes(user.role))) && <EmployeeDashboard user={user} onLogout={handleLogout} />}
        </PrivateRoute>
      } />

      <Route path="/project/:id" element={
        <PrivateRoute user={user} token={token} allowedRoles={ALL_ROLES}>
          <ProjectDetail user={user} onLogout={handleLogout} />
        </PrivateRoute>
      } />

      <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default App;

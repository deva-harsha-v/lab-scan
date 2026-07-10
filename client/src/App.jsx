import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import JoinSession from './pages/student/JoinSession';
import ExperimentView from './pages/student/ExperimentView';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLabDetail from './pages/student/StudentLabDetail';
import ChangePassword from './pages/student/ChangePassword';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyLabAssignments from './pages/faculty/FacultyLabAssignments';
import SessionMonitor from './pages/faculty/SessionMonitor';
import SubmissionList from './pages/faculty/SubmissionList';
import ExperimentForm from './pages/faculty/ExperimentForm';
import AdminDashboard from './pages/admin/AdminDashboard';
// 1. ADDED: Bulk Import Page Import
import AdminBulkImport from './pages/admin/AdminBulkImport'; 
import HODDashboard from './pages/hod/HODDashboard';

export const RouterContext = React.createContext(null);

function useRouter() {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter outside RouterContext');
  return ctx;
}
export { useRouter };

function getInitialPage() {
  return 'landing';
}

function SPARouter({ children }) {
  const [page, setPage] = useState(getInitialPage);
  const [params, setParams] = useState({});
  const [history, setHistory] = useState([{ page: 'landing', params: {} }]);

  const navigate = useCallback((newPage, newParams = {}) => {
    setPage(newPage);
    setParams(newParams);
    setHistory(prev => [...prev, { page: newPage, params: newParams }]);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const last = next[next.length - 1];
      setPage(last.page);
      setParams(last.params);
      return next;
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ page, params, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
}

function AppShell() {
  const { page, params, navigate } = React.useContext(RouterContext);
  const { user, loading } = useAuth();
  const { tokens } = useTheme();

  // Auth guard
  useEffect(() => {
    if (loading) return;
    const facultyPages = ['faculty-dashboard','faculty-lab-assignments','session-monitor','submissions','experiment-form','experiment-manager'];
    // Added 'admin-bulk-import' to the admin page security array
    const adminPages = ['admin-dashboard', 'admin-bulk-import']; 
    const hodPages = ['hod-dashboard'];
    const studentPages = ['student-dashboard','student-lab-detail','scan','student-change-password']; // Added 'scan' to sync auth criteria bounds

    if (facultyPages.includes(page) && (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN' && user.role !== 'HOD'))) {
      navigate('login');
    }
    if (adminPages.includes(page) && (!user || user.role !== 'ADMIN')) {
      navigate('login');
    }
    if (hodPages.includes(page) && (!user || (user.role !== 'HOD' && user.role !== 'ADMIN'))) {
      navigate('login');
    }
    if (studentPages.includes(page) && (!user || user.role !== 'STUDENT')) {
      navigate('login');
    }
  }, [page, user, loading, navigate]);

  // Auto-redirect logged-in users to their dashboard
  useEffect(() => {
    if (loading) return;
    if (user && page === 'login') {
      if (user.role === 'ADMIN') navigate('admin-dashboard');
      else if (user.role === 'HOD') navigate('hod-dashboard');
      else if (user.role === 'FACULTY') navigate('faculty-dashboard');
      else navigate('student-dashboard');
    }
    if (user && page === 'landing') {
      if (user.role === 'ADMIN') navigate('admin-dashboard');
      else if (user.role === 'HOD') navigate('hod-dashboard');
      else if (user.role === 'FACULTY') navigate('faculty-dashboard');
      else navigate('student-dashboard');
    }
  }, [user, loading, page, navigate]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background: tokens.bgPage, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:`2px solid ${tokens.accentMuted}`, borderTopColor: tokens.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  switch (page) {
    case 'landing':                 return <LandingPage />;
    case 'login':                   return <LoginPage />;
    case 'student-dashboard':       return <StudentDashboard />;
    case 'student-lab-detail':      return <StudentLabDetail />;
    case 'student-change-password': return <ChangePassword />;
    case 'join-session':            return <JoinSession />;
    case 'experiment-view':         return <ExperimentView />;
    case 'faculty-dashboard':       return <FacultyDashboard />;
    case 'faculty-lab-assignments': return <FacultyLabAssignments />;
    case 'session-monitor':         return <SessionMonitor />;
    case 'submissions':             return <SubmissionList />;
    case 'experiment-form':         return <ExperimentForm />;
    
    // ✅ RECTIFIED: 'scan' action routes point seamlessly to JoinSession multi-step engine
    case 'scan':                    return <JoinSession />;
    
    case 'hod-dashboard':           return <HODDashboard />;
    case 'admin-dashboard':         return <AdminDashboard />;
    // 2. ADDED: Switch case for bulk import view
    case 'admin-bulk-import':       return <AdminBulkImport />; 
    default:                        return <LandingPage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <SPARouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SPARouter>
    </ThemeProvider>
  );
}
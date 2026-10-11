import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import { Loading } from './components/Feedback.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import WorkoutsPage from './pages/WorkoutsPage.jsx';
import WorkoutDetailPage from './pages/WorkoutDetailPage.jsx';
import WeeklyPlanPage from './pages/WeeklyPlanPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RecommendationsPage from './pages/RecommendationsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { token } = useAuth();
  if (token === undefined) return <Loading />;
  return <Routes>
    <Route path="/login" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
    <Route path="/register" element={token ? <Navigate to="/" replace /> : <AuthPage initialMode="register" />} />
    <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
      <Route index element={<DashboardPage />} />
      <Route path="workouts" element={<WorkoutsPage />} />
      <Route path="workouts/:slug" element={<WorkoutDetailPage />} />
      <Route path="weekly-plan" element={<WeeklyPlanPage />} />
      <Route path="statistics" element={<StatisticsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="recommendations" element={<RecommendationsPage />} />
      <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
    </Route>
    <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
  </Routes>;
}

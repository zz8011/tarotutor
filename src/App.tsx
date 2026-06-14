import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/useAuthStore';
import './styles/global.scss';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const MentorSelectPage = lazy(() => import('./pages/MentorSelectPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const CardLibraryPage = lazy(() => import('./pages/CardLibraryPage'));
const SpreadPage = lazy(() => import('./pages/SpreadPage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));

function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>正在连接神秘力量...</p>
    </div>
  );
}

// 路由保护：未登录（且非游客模式）重定向 /auth
function Private({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore();
  const loc = useLocation();
  if (!initialized) return <Loading />;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);

  return (
    <HashRouter>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Private><HomePage /></Private>} />
            <Route path="/quiz" element={<Private><QuizPage /></Private>} />
            <Route path="/mentors" element={<Private><MentorSelectPage /></Private>} />
            <Route path="/learn/:cardId?" element={<Private><LearnPage /></Private>} />
            <Route path="/library" element={<Private><CardLibraryPage /></Private>} />
            <Route path="/spread" element={<Private><SpreadPage /></Private>} />
            <Route path="/diary" element={<Private><DiaryPage /></Private>} />
            <Route path="/profile" element={<Private><ProfilePage /></Private>} />
            <Route path="/review" element={<Private><ReviewPage /></Private>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  );
}

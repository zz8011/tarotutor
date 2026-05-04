import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.scss';

const HomePage = lazy(() => import('./pages/HomePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const MentorSelectPage = lazy(() => import('./pages/MentorSelectPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const CardLibraryPage = lazy(() => import('./pages/CardLibraryPage'));
const SpreadPage = lazy(() => import('./pages/SpreadPage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>正在连接神秘力量...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/mentors" element={<MentorSelectPage />} />
            <Route path="/learn/:cardId?" element={<LearnPage />} />
            <Route path="/library" element={<CardLibraryPage />} />
            <Route path="/spread" element={<SpreadPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

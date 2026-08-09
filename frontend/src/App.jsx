import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import BuilderProfile from './pages/BuilderProfile';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Projects from './pages/Projects';
import Opportunities from './pages/Opportunities';
import ProjectWorkspace from './pages/workspace/ProjectWorkspace';
import Overview from './pages/workspace/Overview';
import AIChat from './pages/workspace/AIChat';
import Research from './pages/workspace/Research';
import Brand from './pages/workspace/Brand';
import Docs from './pages/workspace/Docs';
import Timeline from './pages/workspace/Timeline';
import Submission from './pages/workspace/Submission';
import ComingSoon from './pages/ComingSoon';
import NotFound from './pages/NotFound';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-2 border-ash border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/signin" element={user ? <Navigate to="/dashboard" replace /> : <SignIn />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUp />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireProfile={false}>
            <BuilderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/opportunities"
        element={
          <ProtectedRoute>
            <Opportunities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectWorkspace />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="ai" element={<AIChat />} />
        <Route path="research" element={<Research />} />
        <Route path="brand" element={<Brand />} />
        <Route path="docs" element={<Docs />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="submission" element={<Submission />} />
      </Route>

      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <ComingSoon
              title="AI Workspace"
              description="Open a project and use the AI tab inside its workspace."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/research"
        element={
          <ProtectedRoute>
            <ComingSoon
              title="Research"
              description="Research lives inside each project workspace."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand"
        element={
          <ProtectedRoute>
            <ComingSoon
              title="Brand Studio"
              description="Brand Studio lives inside each project workspace."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs"
        element={
          <ProtectedRoute>
            <ComingSoon
              title="Documentation"
              description="Documentation lives inside each project workspace."
            />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

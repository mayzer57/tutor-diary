import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import TutorSchedule from './pages/TutorSchedule';
import StudentSchedule from './pages/StudentSchedule';
import ScheduleTemplate from './pages/ScheduleTemplate';
import TutorJournal from './pages/TutorJournal';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    if (token && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
    } else {
      setIsAuthenticated(false);
      setUserType(null);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    const storedUserType = localStorage.getItem('userType');
    setIsAuthenticated(true);
    setUserType(storedUserType);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUserType(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Авторизация */}
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to={userType === 'student' ? '/student-dashboard' : '/dashboard'} replace />
            ) : (
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            )
          }
        />

        {/* Панель репетитора */}
        <Route
        path="/journal"
        element={
          isAuthenticated && userType === 'tutor' ? (
            <TutorJournal />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userType === 'tutor' ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/schedule-template"
          element={
            isAuthenticated && userType === 'tutor' ? (
              <ScheduleTemplate />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        {/* Панель ученика */}
        <Route
          path="/student-dashboard"
          element={
            isAuthenticated && userType === 'student' ? (
              <StudentDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Расписание ученика */}
        <Route
          path="/student-schedule"
          element={
            isAuthenticated && userType === 'student' ? (
              <StudentSchedule />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route 
          path="/schedule" 
          element={
            isAuthenticated && userType === 'tutor' ? (
              <TutorSchedule />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
        
      </Routes>
   
    </BrowserRouter>
  );
}

export default App;

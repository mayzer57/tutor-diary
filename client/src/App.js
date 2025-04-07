
import { useState, useEffect, useCallback } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 👈 добавим

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    if (token && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType); // 👈 сохрани тип
    } else {
      setIsAuthenticated(false);
      setUserType(null);
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    console.log('Auth success callback triggered');
    const storedUserType = localStorage.getItem('userType');
    setIsAuthenticated(true);
    setUserType(storedUserType); // 👈 важно
  }, []);

  const handleLogout = useCallback(() => {
    console.log('Logout callback triggered');
    setIsAuthenticated(false);
    setUserType(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
  }, []);


  return (
    <BrowserRouter>
     <Routes>
  <Route 
    path="/auth" 
    element={
      isAuthenticated ? (
        <Navigate 
          to={userType === 'student' ? '/student-dashboard' : '/dashboard'} 
          replace 
        />
      ) : (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
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
    path="/student-dashboard" 
    element={
      isAuthenticated && userType === 'student' ? (
        <StudentDashboard onLogout={handleLogout} />
      ) : (
        <Navigate to="/auth" replace />
      )
    } 
  />

  <Route 
    path="*" 
    element={
      <Navigate 
        to={isAuthenticated 
          ? (userType === 'student' ? '/student-dashboard' : '/dashboard') 
          : '/auth'
        } 
        replace 
      />
    } 
  />
</Routes>

    </BrowserRouter>
  );
}

export default App;
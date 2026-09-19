import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import FacilitySelection from './pages/FacilitySelection';
import FacilityInput from './pages/FacilityInput';
import Dashboard from './pages/Dashboard';
import WhatIfSimulator from './pages/WhatIfSimulator';
import PredictionResult from './pages/PredictionResult';

// Root redirector based on authentication state
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/facilities" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/facilities"
                  element={
                    <ProtectedRoute>
                      <FacilitySelection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/facility/:id/input"
                  element={
                    <ProtectedRoute>
                      <FacilityInput />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/facility/:id/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/:facilityId"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/what-if/:facilityId"
                  element={
                    <ProtectedRoute>
                      <WhatIfSimulator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/facility/:id/what-if"
                  element={
                    <ProtectedRoute>
                      <WhatIfSimulator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prediction/:id/result"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<Navigate to="/facilities" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

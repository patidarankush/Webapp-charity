import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketSales from './pages/TicketSales';
import DiaryManagement from './pages/DiaryManagement';
import Search from './pages/Search';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-secondary-50">
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tickets" element={<TicketSales />} />
                <Route path="/diaries" element={<DiaryManagement />} />
                <Route path="/search" element={<Search />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

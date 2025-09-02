import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketSales from './pages/TicketSales';
import DiaryManagement from './pages/DiaryManagement';
import Search from './pages/Search';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-secondary-900">Temple Trust Lottery Management</h1>
          <p className="text-secondary-600">Application is loading...</p>
        </div>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketSales />} />
            <Route path="/diaries" element={<DiaryManagement />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </Layout>
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
  );
}

export default App;

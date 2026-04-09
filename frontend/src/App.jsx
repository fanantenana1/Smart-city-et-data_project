import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AdminDashboard from "./components/AdminDashboard";
import SimpleUserDashboard from "./components/SimpleUserDashboard";

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with = if needed
    const paddedBase64 = base64 + '==='.slice(0, (4 - base64.length % 4) % 4);
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

function HomeRouter() {
  const token = localStorage.getItem('sw_token');
  if (!token) return <LoginPage />;

  try {
    // Decode token to get user info
    const payload = decodeJWT(token);
    if (!payload) throw new Error('Invalid token');
    const isAdmin = payload.role === 'admin';
    return isAdmin ? <AdminDashboard /> : <SimpleUserDashboard />;
  } catch (e) {
    console.error('Error decoding token:', e);
    return <LoginPage />;
  }
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<HomeRouter />} />
        <Route path="/simple" element={<SimpleUserDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

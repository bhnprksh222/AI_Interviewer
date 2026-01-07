import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import About from "./components/About";
import Dashboard from "./components/Dashboard";
import UserProfileUpdate from "./components/UserProfileUpdate";
import ProtectedRoute from "./components/ProtectedRoute";
import Toolbar from "./components/Toolbar";
import SelfIntroduction from "./components/SelfIntroduction";
import TechnicalRound from "./components/TechnicalRound";
import MCQRound from "./components/MCQRound";
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toolbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile-update" element={<ProtectedRoute><UserProfileUpdate /></ProtectedRoute>} />
          <Route path="/self-introduction" element={<ProtectedRoute><SelfIntroduction /></ProtectedRoute>} />
          <Route path="/technical-round" element={<ProtectedRoute><TechnicalRound /></ProtectedRoute>} />
          <Route path="/mcq-round" element={<ProtectedRoute><MCQRound /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

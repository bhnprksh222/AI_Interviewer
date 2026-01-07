import React, { useState, useEffect } from 'react';
import "../Login.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError('An error occurred during login.');
    }
  };

  return (
    <div className="login-container">
      {/* Navigation Bar */}
      <div className="toolbar">
        <div className="toolbar-logo">
          <img src="/AI_INT.png" alt="Logo" className="logo" />
        </div>
        <div className="toolbar-title">AI INTERVIEW PREPARATION COACH</div>
        <div className="toolbar-links">
          <a href="/about" className="toolbar-link">About</a>
          <a href="/signup" className="toolbar-link">Sign Up</a>
        </div>
      </div>

      {/* Login Box */}
      <div className="login-box">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">LOGIN</h2>
          {error && <div className="error-message">{error}</div>}
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Login</button>
          <p className="signup-link">
            Don't have an account?{" "}
            <Link to="/signup" className="signup-text">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

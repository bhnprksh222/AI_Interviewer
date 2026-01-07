import React, { useState } from "react";
import "../../src/Signup.css"; // Import the updated CSS file
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "./config";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate that password and confirmPassword match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Combine firstName and lastName into fullName
    const fullName = `${formData.firstName} ${formData.lastName}`;

    // Prepare the data to send to the backend
    const dataToSend = {
      username: formData.email, // Use email as username
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      fullname: fullName, // Match the backend field name
    };

    console.log("Data being sent to the backend:", dataToSend); // Debugging log

    const response = await fetch(`${BACKEND_URL}/auth/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    if (response.ok) {
      navigate("/");
    } else {
      const errorData = await response.json();
      console.error("Signup failed:", errorData); // Log the error response for debugging
      alert("Signup failed! Please check your input.");
    }
  };

  return (
    <div className="signup-container">
      {/* Navigation Bar */}
      <div className="toolbar">
        <div className="toolbar-logo">
          <img src="/AI_INT.png" alt="Logo" className="logo" />
        </div>
        <div className="toolbar-title">AI INTERVIEW PREPARATION COACH</div>
        <div className="toolbar-links">
          <a href="/about" className="toolbar-link">About</a>
          <a href="/" className="toolbar-link">Login</a>
        </div>
      </div>

      {/* Signup Box */}
      <div className="signup-box">
        <form className="signup-form" onSubmit={handleSignup}>
          <h2 className="signup-title">SIGN UP</h2>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="input-field"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="input-field"
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-field"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-field"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="input-field"
            onChange={handleChange}
            required
          />
          <button type="submit" className="signup-btn">Sign Up</button>
          <p className="login-link">
            Already have an account?{" "}
            <Link to="/" className="login-text">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;

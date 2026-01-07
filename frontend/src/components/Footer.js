import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaLinkedin, FaGithub, FaHeart } from 'react-icons/fa';
import '../Footer.css';

const Footer = ({ isAuthenticated = false }) => {
  const currentYear = new Date().getFullYear();

  const authenticatedLinks = [
    { to: "/dashboard", text: "Dashboard" },
    { to: "/profile-update", text: "Profile" },
    { to: "/about", text: "About" },
    { to: "/self-introduction", text: "Practice" }
  ];

  const publicLinks = [
    { to: "/about", text: "About" },
    { to: "/login", text: "Login" },
    { to: "/signup", text: "Sign Up" },
    { to: "/contact", text: "Contact" }
  ];

  const links = isAuthenticated ? authenticatedLinks : publicLinks;

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-logo">
            <img src="/AI_INT.png" alt="AI Interview Coach Logo" />
            <span className="footer-logo-text">AI Interview Coach</span>
          </div>
          <p className="footer-description">
            Empowering job seekers with AI-powered interview preparation and personalized feedback.
          </p>
        </div>

        <div className="footer-center">
          <ul className="footer-links">
            {links.map((link, index) => (
              <li key={index}>
                <Link to={link.to} className="footer-link">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-right">
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebook className="social-icon" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter className="social-icon" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin className="social-icon" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub className="social-icon" />
            </a>
          </div>
        </div>

        <div className="footer-copyright">
          <p>
            Made with <FaHeart style={{ color: '#e25555' }} /> by Team AI Interview Coach
          </p>
          <p>© {currentYear} AI Interview Coach. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

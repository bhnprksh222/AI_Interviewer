import React, { useEffect, useState } from "react";
import "../../src/Dashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "./config";
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
         BarChart, Bar, ComposedChart, Area } from 'recharts';


const ProjectInfo = () => (
  <div className="project-info">
    <h2>Welcome to AI Interviewer</h2>
    <div className="project-description">
      <p>
        The AI Interviewer is a smart, interactive platform designed to simulate real interview
        experiences using advanced AI models. It guides users through different rounds—Self Introduction,
        Technical Questions, and MCQs—using voice prompts and evaluates their responses in real-time.
      </p>

      <div className="features">
        <h3>Key Features</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">🎤</span>
            <p>Voice-based interaction to simulate real interview environments</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <p>LLaMA-powered feedback on communication, technical knowledge, and confidence</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <p>Score tracking and feedback summaries to help users improve</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📚</span>
            <p>RAG (Retrieval-Augmented Generation) integration for context-aware questioning</p>
          </div>
        </div>
      </div>

      <div className="goal-section">
        <h3>Our Goal</h3>
        <p>
          The goal is to help users practice, improve, and gain confidence in interviews using
          personalized AI feedback.
        </p>
      </div>

      <div className="get-started">
        <h3>Ready to Begin?</h3>
        <p>Click the "START INTERVIEW" button below to begin your interview practice journey!</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null); // Store the summary data
  const [message, setMessage] = useState(""); // Store the "no interviews" message
  const [chartData, setChartData] = useState([]); // Data for the chart

  const handleStartInterview = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please login again.");
        navigate("/");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data || response.data === "Profile not found") {
        alert("Please create your profile before starting the interview.");
        navigate("/profile-update");
        return;
      }

      // Check for required fields
      const profile = response.data;
      const requiredFields = {
        company_experience: "Work experience",
        skills: "Skills",
        preferred_role: "Preferred role",
        education: "Education details"
      };

      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!profile[field] ||
            (Array.isArray(profile[field]) && profile[field].length === 0) ||
            (typeof profile[field] === 'string' && profile[field].trim() === '')) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        alert(`Please complete the following in your profile: ${missingFields.join(", ")}`);
        navigate("/profile-update");
        return;
      }

      // If profile is complete, proceed to interview
      navigate("/self-introduction");
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("access_token");
        navigate("/");
      } else {
        console.error("Error checking profile:", error);
        alert("Error checking profile. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("access_token"); // Retrieve the token
        if (!token) {
          console.error("No token found. Please log in again.");
          setMessage("You are not logged in. Please log in to view your interview summary.");
          navigate("/"); // Redirect to login if no token is found
          return;
        }

        const response = await axios.get(
          `${BACKEND_URL}/api/interview/summary/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.message) {
          setMessage(response.data.message); // Set the "no interviews" message
        } else {
          setSummary(response.data); // Set the summary data

          // Prepare and sort data for the chart
          const chartData = response.data.self_intro.map((interview, index) => ({
            date: new Date(interview.timestamp).getTime(), // Convert to timestamp for sorting
            dateDisplay: new Date(interview.timestamp).toLocaleDateString(),
            communication: interview.communication_score,
            confidence: interview.confidence_score,
            professionalism: interview.professionalism_score,
            mcq: response.data.mcq[index]?.score || 0,
            technical: response.data.technical[index]?.technical_knowledge_score || 0,
          }));

          // Sort by date in ascending order (oldest to newest)
          chartData.sort((a, b) => a.date - b.date);

          setChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching interview summary:", error);
        if (error.response && error.response.status === 401) {
          setMessage("Unauthorized access. Please log in again.");
          navigate("/"); // Redirect to login if unauthorized
        } else {
          setMessage("Failed to fetch interview summary. Please try again later.");
        }
      }
    };

    fetchSummary();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <header className="toolbar">
        <div className="toolbar-logo">
          <img src="/AI_INT.png" alt="Logo" className="logo" />
        </div>
        <div className="toolbar-title">AI INTERVIEW PREPARATION COACH</div>
        <div className="toolbar-links">
          <a onClick={() => navigate("/profile-update")} className="toolbar-link">
            Profile
          </a>
          <a onClick={logout} className="toolbar-link">
            Logout
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {message ? (
          <ProjectInfo />
        ) : summary ? (
          <>
            <h2 className="page-heading">Interview Summary</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
              {/* Trend Line Chart */}
              <div className="chart-container" style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
                  Score Trends Over Time
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                    Track your progress across all categories
                  </div>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="dateDisplay"
                      tickFormatter={(date) => date}
                      label={{
                        value: 'Interview Timeline',
                        position: 'bottom',
                        offset: 0,
                        style: { textAnchor: 'middle', fill: '#666', fontSize: '0.9em' }
                      }}
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#666"
                    />
                    <YAxis
                      domain={[0, 10]}
                      label={{
                        value: 'Performance Score',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#666', fontSize: '0.9em' }
                      }}
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#666"
                      tickCount={6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '10px'
                      }}
                      formatter={(value, name) => [`${Number(value).toFixed(1)} / 10`, name]}
                      labelFormatter={(date) => `Interview Date: ${date}`}
                    />
                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={36}
                      wrapperStyle={{
                        paddingTop: '10px',
                        paddingBottom: '20px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="communication"
                      fill="url(#colorComm)"
                      stroke="#8884d8"
                      name="Communication"
                      strokeWidth={2}
                    />
                    {[
                      { key: 'confidence', name: 'Confidence', color: '#82ca9d' },
                      { key: 'professionalism', name: 'Professionalism', color: '#ffc658' },
                      { key: 'mcq', name: 'MCQ Score', color: '#ff7300' },
                      { key: 'technical', name: 'Technical Knowledge', color: '#0088fe' }
                    ].map((metric) => (
                      <Line
                        key={metric.key}
                        type="monotone"
                        dataKey={metric.key}
                        name={metric.name}
                        stroke={metric.color}
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          strokeWidth: 2,
                          fill: '#fff',
                          stroke: metric.color
                        }}
                        activeDot={{
                          r: 6,
                          stroke: '#fff',
                          strokeWidth: 2,
                          fill: metric.color,
                          className: 'animated-dot'
                        }}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart for Latest Scores */}
              <div className="chart-container" style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
                  Latest Performance Overview
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                    Your most recent interview scores
                  </div>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[chartData[chartData.length - 1]]}>
                    <PolarGrid gridType="circle" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#666' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#666' }}
                      tickCount={6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '10px'
                      }}
                      formatter={(value) => [`${Number(value).toFixed(1)} / 10`]}
                    />
                    <Radar
                      name="Latest Scores"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      data={[
                        { name: 'Communication', value: chartData[chartData.length - 1]?.communication || 0 },
                        { name: 'Confidence', value: chartData[chartData.length - 1]?.confidence || 0 },
                        { name: 'Professionalism', value: chartData[chartData.length - 1]?.professionalism || 0 },
                        { name: 'MCQ', value: chartData[chartData.length - 1]?.mcq || 0 },
                        { name: 'Technical', value: chartData[chartData.length - 1]?.technical || 0 }
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart for Average Scores */}
              <div className="chart-container" style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                gridColumn: '1 / -1'
              }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
                  Average Performance by Category
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                    Your overall performance across all interviews
                  </div>
                </h3>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[{
                      communication: chartData.reduce((acc, curr) => acc + curr.communication, 0) / chartData.length,
                      confidence: chartData.reduce((acc, curr) => acc + curr.confidence, 0) / chartData.length,
                      professionalism: chartData.reduce((acc, curr) => acc + curr.professionalism, 0) / chartData.length,
                      mcq: chartData.reduce((acc, curr) => acc + curr.mcq, 0) / chartData.length,
                      technical: chartData.reduce((acc, curr) => acc + curr.technical, 0) / chartData.length
                    }]}
                    margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
                  >
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      label={{
                        value: 'Interview Categories',
                        position: 'bottom',
                        offset: 0,
                        style: { textAnchor: 'middle', fill: '#666', fontSize: '0.9em' }
                      }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      label={{
                        value: 'Average Score',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#666', fontSize: '0.9em' }
                      }}
                      tickCount={6}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '10px'
                      }}
                      formatter={(value) => [`${Number(value).toFixed(1)} / 10`]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={36}
                      wrapperStyle={{
                        paddingTop: '10px',
                        paddingBottom: '20px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    />
                    <Bar
                      dataKey="communication"
                      name="Communication"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (value) => `${Number(value).toFixed(1)}`,
                        fontSize: 12,
                        fill: '#666'
                      }}
                    />
                    <Bar
                      dataKey="confidence"
                      name="Confidence"
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (value) => `${Number(value).toFixed(1)}`,
                        fontSize: 12,
                        fill: '#666'
                      }}
                    />
                    <Bar
                      dataKey="professionalism"
                      name="Professionalism"
                      fill="#ffc658"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (value) => `${Number(value).toFixed(1)}`,
                        fontSize: 12,
                        fill: '#666'
                      }}
                    />
                    <Bar
                      dataKey="mcq"
                      name="MCQ Score"
                      fill="#ff7300"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (value) => `${Number(value).toFixed(1)}`,
                        fontSize: 12,
                        fill: '#666'
                      }}
                    />
                    <Bar
                      dataKey="technical"
                      name="Technical Knowledge"
                      fill="#0088fe"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (value) => `${Number(value).toFixed(1)}`,
                        fontSize: 12,
                        fill: '#666'
                      }}
                    />
                  </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Add some CSS for animations */}
            <style>
              {`
                .animated-dot {
                  animation: pulse 1s infinite;
                }

                @keyframes pulse {
                  0% { r: 6; }
                  50% { r: 8; }
                  100% { r: 6; }
                }
              `}
            </style>

            {/* Overall Score Display with Gradient */}
            <div className="overall-score-container" style={{
              marginTop: '20px',
              textAlign: 'center',
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {summary && (
                <>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Overall Score</h3>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '25px 50px',
                      borderRadius: '12px',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#fff',
                      background: (() => {
                        const score = (
                          (summary.self_intro.reduce((acc, curr) => acc + curr.communication_score, 0) +
                            summary.mcq.reduce((acc, curr) => acc + (curr.score || 0), 0) +
                            summary.technical.reduce((acc, curr) => acc + (curr.technical_knowledge_score || 0), 0)) /
                          (summary.self_intro.length + summary.mcq.length + summary.technical.length)
                        ) * 10;

                        // Enhanced color gradient logic
                        if (score <= 40) {
                          // Red to Orange (0-40%)
                          const ratio = score / 40;
                          return `linear-gradient(135deg,
                            rgb(220, 53, 69) ${100 - ratio * 100}%,
                            rgb(255, 123, 0) ${ratio * 100}%)`;
                        } else if (score <= 70) {
                          // Orange to Yellow (41-70%)
                          const ratio = (score - 40) / 30;
                          return `linear-gradient(135deg,
                            rgb(255, 123, 0) ${100 - ratio * 100}%,
                            rgb(255, 193, 7) ${ratio * 100}%)`;
                        } else {
                          // Yellow to Green (71-100%)
                          const ratio = (score - 70) / 30;
                          return `linear-gradient(135deg,
                            rgb(255, 193, 7) ${100 - ratio * 100}%,
                            rgb(40, 167, 69) ${ratio * 100}%)`;
                        }
                      })(),
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease',
                      cursor: 'default',
                      ':hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                {(
                  (summary.self_intro.reduce((acc, curr) => acc + curr.communication_score, 0) +
                    summary.mcq.reduce((acc, curr) => acc + (curr.score || 0), 0) +
                    summary.technical.reduce((acc, curr) => acc + (curr.technical_knowledge_score || 0), 0)) /
                      (summary.self_intro.length + summary.mcq.length + summary.technical.length) * 10
                    ).toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '10px',
                    fontStyle: 'italic'
                  }}>
                    Based on your performance across all interview rounds
                  </div>
                </>
              )}
            </div>

            {/* Combined Interview Cards */}
            <div className="interview-history">
              {summary.self_intro.map((interview, index) => (
                <div key={index} className="combined-interview-card">
                  <h3>{new Date(interview.timestamp).toLocaleDateString()}</h3>
                  <div className="combined-scores">
                    <div>
                      <h4>Self Introduction</h4>
                      <p>
                        <strong>Communication:</strong> {interview.communication_score}
                      </p>
                      <p>
                        <strong>Confidence:</strong> {interview.confidence_score}
                      </p>
                      <p>
                        <strong>Professionalism:</strong> {interview.professionalism_score}
                      </p>
                      <p>
                        <strong>Feedback:</strong> {interview.feedback || "No feedback available."}
                      </p>
                    </div>
                    {summary.mcq[index] && (
                      <div>
                        <h4>MCQ Round</h4>
                        <p>
                          <strong>Score:</strong> {summary.mcq[index].score}
                        </p>
                        <p>
                          <strong>Feedback:</strong> {summary.mcq[index].feedback}
                        </p>
                      </div>
                    )}
                    {summary.technical[index] && (
                      <div>
                        <h4>Technical Round</h4>
                        <p>
                          <strong>Communication:</strong> {summary.technical[index].communication_score}
                        </p>
                        <p>
                          <strong>Technical Knowledge:</strong> {summary.technical[index].technical_knowledge_score}
                        </p>
                        <p>
                          <strong>Confidence:</strong> {summary.technical[index].confidence_score}
                        </p>
                        <p>
                          <strong>Feedback:</strong> {summary.technical[index].feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="loading-message">Loading interview data...</div>
        )}
      </main>

      {/* Separate Container for Start Interview Button */}
      <div className="start-interview-container">
        <button className="start-interview-button gradient-button" onClick={handleStartInterview}>
          START INTERVIEW
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

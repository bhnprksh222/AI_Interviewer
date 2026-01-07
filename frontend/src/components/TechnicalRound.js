import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaMicrophone, FaRobot } from "react-icons/fa";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import "../../src/SelfIntroduction.css";
import { BACKEND_URL } from "./config";

const TechnicalRound = () => {
  const [status, setStatus] = useState("Loading...");
  const [timer, setTimer] = useState(10);
  const [isRecording, setIsRecording] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [prevQA, setPrevQA] = useState({ prev_question: "", prev_answer: "" });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isNextVisible, setIsNextVisible] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  // Cleanup function to stop recording and audio
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Stop all audio elements
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.src = "";
    });
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => console.error("Error accessing media devices:", err));
  };

  // Handle page reload
  useBeforeUnload(() => {
    cleanup();
  });

  // Handle navigation away from page
  useEffect(() => {
    const handleBeforeNavigate = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeNavigate);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeNavigate);
      cleanup();
    };
  }, []);

  useEffect(() => {
    startTechnicalRound();
  }, []);

  useEffect(() => {
    if (questionCount > 0 && questionCount < 6) {
      askQuestion();
    }
  }, [questionCount]);

  const startTechnicalRound = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No token found. Please log in again.");
        navigate("/");
        return;
      }

      setStatus("Starting technical round...");
      const startRes = await axios.post(
        `${BACKEND_URL}/api/startTechnicalRound/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const startFile = startRes.data.ai_prompt;
      const subtitleText = startRes.data.subtitle;
      const startAudio = new Audio(`${BACKEND_URL}/static/${startFile}?t=${Date.now()}`);
      setIsPlayingAudio(true);
      setSubtitle(subtitleText);
      setShowSubtitle(true);
      startAudio.play();

      startAudio.onended = () => {
        setIsPlayingAudio(false);
        setShowSubtitle(false);
        setStatus("Technical round started. Preparing first question...");
        askQuestion();
      };
    } catch (error) {
      console.error("Error during startTechnicalRound:", error);
      if (error.response?.status === 401) {
        navigate("/");
      } else {
        setStatus("Error occurred during technical round preparation");
      }
    }
  };

  const askQuestion = async () => {
    if (questionCount >= 5) {
      stopTechnicalRound();
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No token found. Please log in again.");
        navigate("/");
        return;
      }

      setStatus(`Asking question ${questionCount + 1}...`);
      const questionRes = await axios.post(
        `${BACKEND_URL}/api/generateTechQuestion/`,
        prevQA,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const questionText = questionRes.data.new_question;
      const questionFile = questionRes.data.speech_file;
      const subtitleText = questionRes.data.subtitle || questionText;

      const questionAudio = new Audio(`${BACKEND_URL}/static/${questionFile}?t=${Date.now()}`);
      setIsPlayingAudio(true);
      setSubtitle(subtitleText);
      setShowSubtitle(true);
      questionAudio.play();

      questionAudio.onended = () => {
        setIsPlayingAudio(false);
        setShowSubtitle(false);
        setStatus(`Recording answer for question ${questionCount + 1}...`);
        startRecording();

        let countdown = 10;
        setTimer(countdown);
        const timerInterval = setInterval(() => {
          countdown -= 1;
          setTimer(countdown);
          if (countdown <= 0) {
            clearInterval(timerInterval);
            stopRecordingAndProceed(questionText);
          }
        }, 1000);
      };
    } catch (error) {
      console.error("Error during generateTechQuestion:", error);
      if (error.response?.status === 401) {
        navigate("/");
      } else {
        setStatus("Error occurred while generating question");
      }
    }
  };

  const stopRecordingAndProceed = async (questionText) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No token found. Please log in again.");
        navigate("/");
        return;
      }

      const audioBlob = await stopRecording();

      const formData = new FormData();
      formData.append("audio_file", audioBlob, `answer_${questionCount + 1}.wav`);

      const sttRes = await axios.post(
        `${BACKEND_URL}/api/speechToText/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const transcription = sttRes.data.transcription;

      console.log("Question: ", questionText);
      console.log("Transcription: ", transcription);
      setPrevQA({ prev_question: questionText, prev_answer: transcription });

      setQuestionCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error during stopRecordingAndProceed:", error);
      if (error.response?.status === 401) {
        navigate("/");
      } else {
        setStatus("Error occurred while processing the answer");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus("Error accessing microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        resolve(audioBlob);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  const stopTechnicalRound = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/stopTechRound/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { closing_prompt, feedback, subtitle: closingSubtitle } = response.data;
      console.log("Feedback:", feedback);

      const stopAudio = new Audio(`${BACKEND_URL}/static/${closing_prompt}?t=${Date.now()}`);
      setIsPlayingAudio(true);
      setSubtitle(closingSubtitle);
      setShowSubtitle(true);
      stopAudio.play();

      stopAudio.onended = () => {
        setIsPlayingAudio(false);
        setShowSubtitle(false);
        setStatus("Technical round completed!");
        setIsNextVisible(true);
      };
    } catch (error) {
      console.error("Error during stopTechnicalRound:", error);
      setStatus("Error occurred while stopping technical round. Please try again.");
    }
  };

  const handleNavigation = (path) => {
    cleanup();
    navigate(path);
    window.location.reload();
  };

  return (
    <div className="dashboard-container">
      <header className="toolbar">
        <div className="toolbar-logo">
          <img src="/AI_INT.png" alt="Logo" className="logo" />
        </div>
        <div className="toolbar-title">AI INTERVIEW PREPARATION COACH</div>
        <div className="toolbar-links">
          <button className="toolbar-link" onClick={() => handleNavigation("/dashboard")}>
            Home
          </button>
          <button className="toolbar-link" onClick={() => handleNavigation("/profile-update")}>
            Profile
          </button>
          <button className="toolbar-link" onClick={() => handleNavigation("/")}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <h1 className="page-heading">Technical Round</h1>

        <div className="ai-interaction-container">
          <FaRobot
            size={150}
            className={`ai-icon ${isPlayingAudio ? "blinking" : ""}`}
          />
          <p className="status-text">{status}</p>
          {showSubtitle && (
            <div className="subtitle-container">
              <p className="subtitle-text">{subtitle}</p>
            </div>
          )}
          <div className="mic-container">
            <FaMicrophone size={80} color={isRecording ? "red" : "black"} className={`mic-icon ${isRecording ? "recording" : ""}`} />
          </div>
          {isRecording && <p className="timer">Time remaining: {timer}s</p>}
        </div>

        {isNextVisible && (
          <div className="next-button-container">
            <button
              className={`next-button ${isNextVisible ? "" : "disabled"}`}
              onClick={() => handleNavigation("/dashboard")}
              disabled={!isNextVisible}
            >
              SUBMIT
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 AI Interview Coach. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TechnicalRound;

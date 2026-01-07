import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import "../../src/UserProfileUpdate.css";
import { BACKEND_URL } from "./config";
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Specialist",
  "UI/UX Designer",
  "Product Manager",
  "Business Analyst",
  "HR / Talent Acquisition",
  "Project Manager",
  "Scrum Master",
  "Software Engineer",
  "AI Researcher",
  "Technical Lead",
  "Solution Architect",
  "IT Manager",
  "Business Development Manager",
  "Operations Manager",
  "Marketing Manager",
  "Sales Manager",
];

const UserProfileUpdate = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [companyExperience, setCompanyExperience] = useState([{ company_name: "", years: "" }]);
  const [skills, setSkills] = useState([]);
  const [preferredRole, setPreferredRole] = useState("");
  const [education, setEducation] = useState([{ degree: "", institution: "", year_of_passing: "", grade_or_percentage: "" }]);
  const [certifications, setCertifications] = useState([]);
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const skillOptions = [
    { value: "Python", label: "Python" },
    { value: "Java", label: "Java" },
    { value: "C++", label: "C++" },
    { value: "JavaScript", label: "JavaScript" },
    { value: "React", label: "React" },
    { value: "Angular", label: "Angular" },
    { value: "CSS", label: "CSS" },
    { value: "HTML", label: "HTML" },
    { value: "Node.js", label: "Node.js" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "Deep Learning", label: "Deep Learning" },
    { value: "Large Language Models (LLM)", label: "Large Language Models (LLM)" },
    { value: "Project Management", label: "Project Management" },
    { value: "Agile Methodologies", label: "Agile Methodologies" },
    { value: "DevOps", label: "DevOps" },
    { value: "Cloud Computing", label: "Cloud Computing" },
    { value: "Kubernetes", label: "Kubernetes" },
    { value: "Docker", label: "Docker" },
    { value: "Data Analysis", label: "Data Analysis" },
    { value: "Data Engineering", label: "Data Engineering" },
  ];

  const certificationOptions = [
    { value: "AWS Certified Solutions Architect", label: "AWS Certified Solutions Architect" },
    { value: "Microsoft Azure Fundamentals", label: "Microsoft Azure Fundamentals" },
    { value: "Google Cloud Associate Engineer", label: "Google Cloud Associate Engineer" },
    { value: "PMP Certification", label: "PMP Certification" },
    { value: "Certified Scrum Master", label: "Certified Scrum Master" },
    { value: "TensorFlow Developer Certificate", label: "TensorFlow Developer Certificate" },
    { value: "IBM Data Science Professional Certificate", label: "IBM Data Science Professional Certificate" },
    { value: "Oracle Java SE Certification", label: "Oracle Java SE Certification" },
    { value: "CompTIA Security+", label: "CompTIA Security+" },
    { value: "Adobe Certified Professional", label: "Adobe Certified Professional" },
    { value: "Certified Ethical Hacker (CEH)", label: "Certified Ethical Hacker (CEH)" },
    { value: "Cisco Certified Network Associate (CCNA)", label: "Cisco Certified Network Associate (CCNA)" },
    { value: "Microsoft Certified: Azure AI Engineer", label: "Microsoft Certified: Azure AI Engineer" },
    { value: "Google Professional Data Engineer", label: "Google Professional Data Engineer" },
    { value: "AWS Certified Developer", label: "AWS Certified Developer" },
    { value: "Certified Kubernetes Administrator (CKA)", label: "Certified Kubernetes Administrator (CKA)" },
    { value: "Certified Information Systems Security Professional (CISSP)", label: "Certified Information Systems Security Professional (CISSP)" },
    { value: "ITIL Foundation Certification", label: "ITIL Foundation Certification" },
    { value: "Certified Data Scientist (CDS)", label: "Certified Data Scientist (CDS)" },
    { value: "Salesforce Certified Administrator", label: "Salesforce Certified Administrator" },
  ];

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      border: "1px solid #ccc",
      borderRadius: "5px",
      padding: "5px",
      fontSize: "14px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 1000,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#8e2de2" : "white",
      color: state.isFocused ? "white" : "black",
      fontSize: "14px",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#8e2de2",
      color: "white",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "white",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "white",
      ":hover": {
        backgroundColor: "#4a00e0",
        color: "white",
      },
    }),
  };

  const handleAddCompanyExperience = () => {
    setCompanyExperience([...companyExperience, { company_name: "", years: "" }]);
  };

  const handleRemoveCompanyExperience = (index) => {
    const updatedExperience = companyExperience.filter((_, i) => i !== index);
    setCompanyExperience(updatedExperience);
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: "", institution: "", year_of_passing: "", grade_or_percentage: "" }]);
  };

  const handleRemoveEducation = (index) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    setEducation(updatedEducation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("company_experience", JSON.stringify(companyExperience));
    formData.append("skills", JSON.stringify(skills.map((skill) => skill.value)));
    formData.append("preferred_role", preferredRole);
    formData.append("education", JSON.stringify(education));
    formData.append("certifications", JSON.stringify(certifications.map((cert) => cert.value)));
    if (resume) {
      formData.append("resume", resume);
    }

    try {
      const token = localStorage.getItem("access_token");
      const endpoint = isLoading ? "createProfile" : "updateProfile";

      const response = await axios({
        method: isLoading ? 'post' : 'put',
        url: `${BACKEND_URL}/profile/${endpoint}/`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Profile saved successfully:", response.data);
      alert("Profile saved successfully!");

    } catch (error) {
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("access_token");
        window.location.href = '/login';
      } else {
        console.error("Error saving profile:", error);
        alert("Error saving profile. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${BACKEND_URL}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data !== "Profile not found") {
          if (response.data.company_experience && response.data.company_experience.length > 0) {
            setCompanyExperience(response.data.company_experience);
          }

          if (response.data.skills && response.data.skills.length > 0) {
            const formattedSkills = response.data.skills.map(skill => ({
              value: skill,
              label: skill
            }));
            setSkills(formattedSkills);
          }

          if (response.data.preferred_role) {
            setPreferredRole(response.data.preferred_role);
          }

          if (response.data.education && response.data.education.length > 0) {
            setEducation(response.data.education);
          }

          if (response.data.certifications && response.data.certifications.length > 0) {
            const formattedCertifications = response.data.certifications.map(cert => ({
              value: cert,
              label: cert
            }));
            setCertifications(formattedCertifications);
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          alert("Your session has expired. Please login again.");
          localStorage.removeItem("access_token");
          window.location.href = '/login';
        } else if (error.response?.status !== 404) {
          console.error("Error fetching profile:", error);
          alert("Error loading profile data. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="profile-update-page">
        <div className="profile-update-container">
          <h2 className="page-title">Loading Profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-update-page">
      {/* Top Navigation Bar */}
      <header className="toolbar">
        <div className="toolbar-logo">
          <img src="/AI_INT.png" alt="Logo" className="logo" />
        </div>
        <div className="toolbar-title">AI INTERVIEW PREPARATION COACH</div>
        <div className="toolbar-links">
          <a onClick={() => navigate("/dashboard")} className="toolbar-link">
            Home
          </a>
          <a onClick={logout} className="toolbar-link">
            Logout
          </a>
        </div>
      </header>

      <div className="profile-update-container">
        <h2 className="page-title">Update Profile</h2>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Company Experience</h3>
            {companyExperience.map((exp, index) => (
              <div key={index} className="form-row">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={exp.company_name}
                  onChange={(e) => {
                    const newExperience = [...companyExperience];
                    newExperience[index].company_name = e.target.value;
                    setCompanyExperience(newExperience);
                  }}
                />
                <input
                  type="number"
                  placeholder="Years"
                  value={exp.years}
                  onChange={(e) => {
                    const newExperience = [...companyExperience];
                    newExperience[index].years = e.target.value;
                    setCompanyExperience(newExperience);
                  }}
                />
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => handleRemoveCompanyExperience(index)}
                >
                  ✖
                </button>
              </div>
            ))}
            <button type="button" className="add-button" onClick={handleAddCompanyExperience}>
              Add Experience
            </button>
          </div>

          <div className="form-section">
            <h3>Skills</h3>
            <Select
              isMulti
              options={skillOptions}
              value={skills}
              onChange={(selectedOptions) => setSkills(selectedOptions)}
              styles={customSelectStyles} // Apply custom styles
              className="multi-select-dropdown"
              placeholder="Select your skills"
            />
          </div>

          <div className="form-section">
            <h3>Preferred Role</h3>
            <select
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              className="dropdown"
            >
              {roleOptions.map((role, index) => (
                <option key={index} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Education</h3>
            {education.map((edu, index) => (
              <div key={index} className="form-row">
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => {
                    const newEducation = [...education];
                    newEducation[index].degree = e.target.value;
                    setEducation(newEducation);
                  }}
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const newEducation = [...education];
                    newEducation[index].institution = e.target.value;
                    setEducation(newEducation);
                  }}
                />
                <input
                  type="number"
                  placeholder="Year of Passing"
                  value={edu.year_of_passing}
                  onChange={(e) => {
                    const newEducation = [...education];
                    newEducation[index].year_of_passing = e.target.value;
                    setEducation(newEducation);
                  }}
                />
                <input
                  type="text"
                  placeholder="Grade/Percentage (Optional)"
                  value={edu.grade_or_percentage}
                  onChange={(e) => {
                    const newEducation = [...education];
                    newEducation[index].grade_or_percentage = e.target.value;
                    setEducation(newEducation);
                  }}
                />
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => handleRemoveEducation(index)}
                >
                  ✖
                </button>
              </div>
            ))}
            <button type="button" className="add-button" onClick={handleAddEducation}>
              Add Education
            </button>
          </div>

          <div className="form-section">
            <h3>Certifications</h3>
            <Select
              isMulti
              options={certificationOptions}
              value={certifications}
              onChange={(selectedOptions) => setCertifications(selectedOptions)}
              styles={customSelectStyles} // Apply custom styles
              className="multi-select-dropdown"
              placeholder="Select your certifications"
            />
          </div>

          <div className="form-section">
            <h3>Resume Upload</h3>
            <input type="file" onChange={(e) => setResume(e.target.files[0])} className="file-input" />
          </div>

          <button type="submit" className="submit-button gradient-button">
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfileUpdate;

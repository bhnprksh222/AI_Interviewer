import React, { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./config";

const ProfileForm = () => {
  const [companyExperience, setCompanyExperience] = useState([{ company_name: "", years: "" }]);
  const [skills, setSkills] = useState([]);
  const [preferredRole, setPreferredRole] = useState("");
  const [education, setEducation] = useState([{ degree: "", institution: "", year_of_passing: "", grade_or_percentage: "" }]);
  const [certifications, setCertifications] = useState([]);
  const [resume, setResume] = useState(null);

  const skillOptions = [
    "Software Engineer",
    "Full Stack Developer (Java/JavaScript)",
    "Machine Learning Engineer",
    "Frontend Developer",
    "Backend Developer",
    "DevOps Engineer",
    "Data Scientist",
    "Data Analyst",
    "Data Engineer",
    "HR / Talent Acquisition",
    "Product Manager",
    "UI/UX Designer",
    "Cloud Engineer",
    "Cybersecurity Specialist",
  ];

  const certificationOptions = [
    "AWS Certified Solutions Architect",
    "Microsoft Azure Fundamentals",
    "Google Cloud Associate Engineer",
    "PMP Certification",
    "Certified Scrum Master",
    "TensorFlow Developer Certificate",
    "IBM Data Science Professional Certificate",
    "Oracle Java SE Certification",
    "CompTIA Security+",
    "Adobe Certified Professional",
  ];

  const handleAddCompanyExperience = () => {
    setCompanyExperience([...companyExperience, { company_name: "", years: "" }]);
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: "", institution: "", year_of_passing: "", grade_or_percentage: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("company_experience", JSON.stringify(companyExperience));
    formData.append("skills", JSON.stringify(skills));
    formData.append("preferred_role", preferredRole);
    formData.append("education", JSON.stringify(education));
    formData.append("certifications", JSON.stringify(certifications));
    if (resume) {
      formData.append("resume", resume);
    }

    try {
      const response = await axios.put(`${BACKEND_URL}/updateProfile/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Profile updated successfully:", response.data);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Update Profile</h2>

      <div>
        <h3>Company Experience</h3>
        {companyExperience.map((exp, index) => (
          <div key={index}>
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
          </div>
        ))}
        <button type="button" onClick={handleAddCompanyExperience}>
          Add Experience
        </button>
      </div>

      <div>
        <h3>Skills</h3>
        <select multiple value={skills} onChange={(e) => setSkills([...e.target.selectedOptions].map((o) => o.value))}>
          {skillOptions.map((skill, index) => (
            <option key={index} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Preferred Role</h3>
        <select value={preferredRole} onChange={(e) => setPreferredRole(e.target.value)}>
          {skillOptions.map((role, index) => (
            <option key={index} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Education</h3>
        {education.map((edu, index) => (
          <div key={index}>
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
          </div>
        ))}
        <button type="button" onClick={handleAddEducation}>
          Add Education
        </button>
      </div>

      <div>
        <h3>Certifications</h3>
        <select multiple value={certifications} onChange={(e) => setCertifications([...e.target.selectedOptions].map((o) => o.value))}>
          {certificationOptions.map((cert, index) => (
            <option key={index} value={cert}>
              {cert}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Resume Upload</h3>
        <input type="file" onChange={(e) => setResume(e.target.files[0])} />
      </div>

      <button type="submit">Update Profile</button>
    </form>
  );
};

export default ProfileForm;

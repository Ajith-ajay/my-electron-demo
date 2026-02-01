import React, { useEffect, useState } from "react";
import ReusableUploadPage from "./ReusableUploadPage";
import axios from "axios";

const QuestionUploadPage = () => {
  const instructions = [
    "The Unit field should be entered strictly as a numeric value, and the number provided should exactly correspond to the approved syllabus-to-unit mapping without any deviation",
    "The Topic field should be entered only in capital letters, using officially approved topic names, and abbreviations, spelling variations, or additional spaces should be strictly avoided",
    "The Difficulty Level should be entered only as numeric values defined by the system, and no textual descriptions or symbolic representations should be used",
    "Each question should be entered as a complete, clear, and grammatically correct sentence, ensuring that all numerical values, symbols, and expressions are accurate and consistently formatted",
    "Unnecessary line breaks, extra spaces, or inconsistent formatting should not be included in the question text or option fields, as they may cause validation errors",
    "All four answer options (A, B, C, and D) should be provided for every question, and each option should be logically valid, distinct, and not overlapping in meaning or value",
    "Units of measurement, symbols, currency formats, ratios, and numerical precision should be maintained consistently across all answer options",
    "The correct answer should be entered as the exact value matching one of the provided options, and option labels such as A, B, C, or D should not be entered",
    "All Excel cells should be maintained in General format only, and automatic formatting such as dates, time values, number conversions, or merged cells should not be applied",
    "The original sheet structure should be preserved by keeping the column headers and order unchanged, and incomplete, duplicate, or non-compliant entries will be rejected during validation"
  ];
  const [subjects, setSubjects] = useState([]);
  const [link, setLink] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responce = await axios.get('/api/main-backend/examiner/questions/subjects');
        setSubjects(responce.data.data)
        setLink(responce.data.s3link)
      } catch (error) {
        console.error("Error fetching Subjects data", error);
      }
    }

    fetchData()
  }, [])  

  return (
    <ReusableUploadPage
      title="Question Data Upload"
      description="Upload Excel file containing QA/VR/BS Questions"
      options={subjects}
      apiUrl="/api/main-backend/examiner/questions/upload"
      uploadFor="question"
      instructions={instructions}
      s3link={link}
    />
  );
};

export default QuestionUploadPage;
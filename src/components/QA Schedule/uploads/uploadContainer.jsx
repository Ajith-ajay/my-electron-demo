import React from "react";
import { useLocation } from "react-router";
import QuestionUploadPage from "./questionUpload";
import StudentBatchUploadPage from "./studentBatchUpload";
import Banner from "../../Banner";

const UploadContainer = () => {
  const location = useLocation();

  const state = location.state?.page
  return (
    <>
      <Banner
        backgroundImage="./Banners/examsbanner.webp"
        headerText="office of controller of examinations"
        subHeaderText="COE"
      />
      {state === "question" && <QuestionUploadPage />}
      {state === "student" && <StudentBatchUploadPage />}
    </>
  );
};

export default UploadContainer;
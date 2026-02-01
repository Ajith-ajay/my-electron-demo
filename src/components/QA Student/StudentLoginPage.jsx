import React from "react";
import { useState, useEffect } from "react";
import "./StudentLoginPage.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import loginImg from "../../assets/login.jpg";
import logo from "../../assets/NEWLOGO.png"
import axios from "axios";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    registerno: "",
    password: "",
    year: ""
  });
  
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch departments and batches from backend
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoadingData(true);
        const response = await axios.get("/api/main-backend/auth/students");
        const data = response.data;
        
        // Map full department names to short codes
        const deptMap = {
          "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE": "AI&DS",
          "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
          "COMPUTER SCIENCE AND ENGINEERING": "CSE",
          "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
          "ELECTRONICS AND INSTRUMENTATION ENGINEERING": "EIE",
          "INFORMATION TECHNOLOGY": "IT",
          "MECHANICAL ENGINEERING": "MECH",
          "AUTOMOBILE ENGINEERING": "AUTO",
          "CIVIL ENGINEERING": "CIVIL",
          "CSE(CYBER SECURITY)": "CSE(CS)",
        };

        const mappedDepartments = data.departments?.map(dept => deptMap[dept.toUpperCase()] || dept) || [];
        
        setDepartments(mappedDepartments);
        setBatches(data.batches || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to Load Data",
          text: "Could not load departments and batches. Please refresh the page.",
          confirmButtonColor: "#800000",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchFormData();
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const loginStudent = async () => {
    const deptMap = {
      "AI&DS": "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
      "ECE": "ELECTRONICS AND COMMUNICATION ENGINEERING",
      "CSE": "COMPUTER SCIENCE AND ENGINEERING",
      "EEE": "ELECTRICAL AND ELECTRONICS ENGINEERING",
      "EIE": "ELECTRONICS AND INSTRUMENTATION ENGINEERING",
      "IT": "INFORMATION TECHNOLOGY",
      "MECH": "MECHANICAL ENGINEERING",
      "AUTO": "AUTOMOBILE ENGINEERING",
      "CIVIL": "CIVIL ENGINEERING",
      "CSE(CS)": "CSE(CYBER SECURITY)",
    };

    return axios.post("/api/main-backend/auth/student/login", {
      registerno: formData.registerno,
      password: formData.password,
      department: deptMap[formData.department],
      batch: formData.year,
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !formData.department ||
      !formData.registerno ||
      !formData.password ||
      !formData.year
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all mandatory fields.",
        confirmButtonColor: "#800000",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await loginStudent();
      const data = res.data;

      // ✅ Save student details to sessionStorage
      if (data.student) {
        sessionStorage.setItem('studentDetails', JSON.stringify(data.student));
      }

      // ✅ PAUSED SESSION
      if (data.code === "SESSION_PAUSED" && data.canResume) {
        const result = await Swal.fire({
          icon: "info",
          title: "Previous Session Found",
          text: "You have a paused exam session. Do you want to resume it?",
          confirmButtonText: "Resume Exam",
          confirmButtonColor: "#800000",
          allowOutsideClick: false,
        });

        if (result.isConfirmed) {

          Swal.close(); // ✅ IMPORTANT

          navigate("/QA/confirm", {
            replace: true,
            state: { student: data.student, canResume: true },
          });
        }

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "You have successfully logged in.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/QA/confirm", {
        replace: true,
        state: { student: data.student },
      });

    } catch (error) {
      if (error.response?.data?.code === "ALREADY_LOGGED_IN") {
        Swal.fire({
          icon: "warning",
          title: "Already Logged In",
          text:
            "You are already attending the exam on another device or tab. Please continue there.",
          confirmButtonColor: "#800000",
        });
        return;
      } else if (error.response?.data?.code === "SESSION_COMPLETED") {
        Swal.fire({
          icon: "success",
          title: "Already Exam Completed",
          text: error.response?.data?.message,
          confirmButtonColor: "#800000",
        });
        return;
      } else if (error.response?.data?.code === "SESSION_TERMINATED") {
        Swal.fire({
          icon: "error",
          title: "Exam Session Terminated",
          text: error.response?.data?.message,
          confirmButtonColor: "#800000",
        });
        return;
      }
        
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text:
          error?.response?.data?.message ||
          "Invalid credentials. Please try again.",
        confirmButtonColor: "#800000",
      });
    } finally {
      setLoading(false)
    }
  }

  // ---------------- FULLSCREEN ENFORCEMENT WITH WARNING ----------------
  useEffect(() => {
    const enterFullscreenOnce = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
      document.removeEventListener("click", enterFullscreenOnce);
    };

    document.addEventListener("click", enterFullscreenOnce);

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        Swal.fire({
          title: "Fullscreen Required",
          text: "Please stay in fullscreen mode to continue the examination process.",
          icon: "warning",
          confirmButtonText: "Return to Fullscreen",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          document.documentElement.requestFullscreen().catch(() => { });
        });
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("click", enterFullscreenOnce);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };

  }, []);

  useEffect(() => {
    const checkDevice = () => {
      // Logic: If screen width is less than 1024px, it's likely a mobile or tablet
      if (window.innerWidth < 1024) {
        setStatus('invalid_device');
      } else if (localStorage.getItem('exam_status') === 'blocked') {
        setStatus('blocked');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice); // Re-check if window is resized
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // INVALID DEVICE POPUP
  if (status === "invalid_device") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white shadow-xl rounded-xl p-6 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-3">⚠ DESKTOP REQUIRED</h2>
          <p>This exam cannot be taken on a Mobile or Tablet device.</p>
          <p className="mb-6">
            Please use a <b>Laptop or Desktop</b> with minimum width 1024px.
          </p>
          <button
            onClick={() => navigate("/QA/qaexam")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // BLOCKED POPUP
  if (status === "blocked") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white shadow-xl rounded-xl p-6 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-yellow-600 mb-3">⛔ ACCESS BLOCKED</h2>
          <p>Your access to this exam has been blocked.</p>
          <button
            onClick={() => navigate("/QA/qaexam")}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="QAEXAM"
      style={{
        backgroundImage: `url(${loginImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="form-container">
        <div className="flex justify-center">
          <img src={logo} alt="logo" className="w-24" />
        </div>
        <h2 className="title_of_Aptitude font-bold">Aptitude Examination</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="registerno"
              value={formData.registerno}
              onChange={handleChange}
              placeholder=""
              required
            />
            <label>Registration No*</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=""
              required
            />
            <label>Password*</label>
          </div>

          <div className={`input-group ${formData.department ? "has-value" : ""}`}>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={isLoadingData}
              required
            >
              <option value="" disabled hidden></option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <label>Department*</label>
          </div>

          <div className={`input-group mt-4 mb-4 ${formData.year ? "has-value" : ""}`}>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              disabled={isLoadingData}
              required
            >
              <option value="" disabled hidden></option>
              {batches.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <label>Batch*</label>
          </div>

          <button type="submit" disabled={loading || isLoadingData}>
            {loading ? "Entering..." : isLoadingData ? "Loading..." : "Enter into Exam"}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./questions.css";
import axios from "axios";
import Swal from "sweetalert2";
import { formatMathText } from "./questionNormalizer";

const alertBox = (title, text, icon = "info") => {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
  });
};

// ✅ REAL INTERNET CHECK - Not just network adapter
const checkBackendConnection = async () => {
  try {
    await axios.get("/api/main-backend/exam/qa/session/ping", {
      timeout: 10000 
    });
    return true;
  } catch {
    return false;
  }
};

const QuestionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const exam = location.state?.exam || JSON.parse(localStorage.getItem("exam_data"));
  const student = location.state?.student;
  const violation = location.state?.violations || {
    fullscreenExit: 0,
    tabSwitch: 0,
  };


  // ✅ STATE
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [visited, setVisited] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOnline, setIsOnline] = useState(true); // Start optimistic
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState({
    fullscreenExit: violation.fullscreenExit || 0,
    tabSwitch: violation.tabSwitch || 0,
  });
  const [examSubmitted, setExamSubmitted] = useState(false);

  const scrollRef = useRef(null);
  const circleRefs = useRef([]);
  
  // ✅ Refs to track states
  const isFullscreenWarningShown = useRef(false);
  const offlineAlertShown = useRef(false);

  // SAFETY CHECK
  useEffect(() => {
    if (!exam || !student) {
      navigate("/QA/qaexam", { replace: true });
    }
  }, [exam, student, navigate]);

  
  // Get total questions from exam data or calculate based on exam type
  const totalQuestions = exam?.totalQuestions || (exam?.examType === "cie3" ? 100 : 50);
    
  // ---------------- QUESTIONS ----------------
  const questions = exam.questions.map((q, index) => ({
    id: index + 1,
    question: q.question,
    options: [q.A, q.B, q.C, q.D],
  }));

  const q = questions[current];

  // ✅ TIMER
  useEffect(() => {
    const fetchRemainingTime = async () => {
      try {
        const res = await axios.get("/api/main-backend/exam/qa/session/time");
        setTimeLeft(res.data.remainingSeconds);
      } catch (err) {
        if (err.response?.data?.status === "TIME_UP") {
          await submitExam(true);
        } else {
          forceExit(err.response?.data || { message: "Time up" });
        }
      }
    };

    fetchRemainingTime();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null) return "Loading...";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // SESSION CHECK STATUS
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await axios.get("/api/main-backend/exam/qa/session/status");
        if (res.data.status !== "ACTIVE") {
          forceExit({ message: "Session verification error" });
        }
      } catch (err) {
        console.error("Session verification error:", err);
      }
    };
    verifySession();
  }, []);

  // RESUME EXAM DATA
  useEffect(() => {
    const resumeExam = async () => {
      try {
        const res = await axios.get("/api/main-backend/exam/qa/session/resume-data");

        const {
          currentQuestionIndex,
          answeredQuestions
        } = res.data;

        // rebuild questions array
        const rebuiltQuestions = answeredQuestions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: [q.A, q.B, q.C, q.D],
        }));

        const rebuiltSelected = {};
        const rebuiltVisited = {};

        answeredQuestions.forEach((q, index) => {
          if (q.selected) {
            rebuiltSelected[index] = q.selected;
            rebuiltVisited[index] = true;
          }
        });

        setSelected(rebuiltSelected);
        setVisited(rebuiltVisited);
        setCurrent(currentQuestionIndex);
      } catch (err) {
        console.error("Resume exam error:", err);
      }
    };

    resumeExam();
  }, []);

  // HEARTBEAT CHECK
  useEffect(() => {
    const interval = setInterval(async () => {
      // Stop heartbeat after exam submission
      if (examSubmitted) {
        clearInterval(interval);
        return;
      }

      try {
        await axios.post("/api/main-backend/exam/qa/session/heartbeat");
      } catch (err) {
        forceExit(err.response?.data || { message: "HeartBeat error"});
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [examSubmitted]);

  // BEACON ON UNLOAD
  useEffect(() => {
    const onUnload = () => {
      const beaconSent = navigator.sendBeacon(
        "/api/main-backend/exam/qa/session/offline",
        JSON.stringify({ registerno: student?.registerno })
      );
      
      if (!beaconSent) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/main-backend/exam/qa/session/offline", false);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify({ registerno: student?.registerno }));
        } catch (err) {
          console.error("Failed to mark offline:", err);
        }
      }
    };

    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("unload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("unload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [student?.registerno]);

  // DISABLE CLIPBOARD
  useEffect(() => {
    const blockClipboard = (e) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    return () => {
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
    };
  }, []);

  // ✅ FIX #1: REAL OFFLINE/ONLINE HANDLING - Checks actual internet, not just adapter
  const isBrowserOnline = () => navigator.onLine;

  const checkRealInternet = async () => {
    if (!isBrowserOnline()) {
      return false;
    }
    
    return await checkBackendConnection();
  };

  useEffect(() => {
    let checkInterval;
    let isCheckingInternet = false; // Prevent overlapping checks

    const handleOffline = async () => {
      if (isCheckingInternet || offlineAlertShown.current) return;
      isCheckingInternet = true;
      
      const hasInternet = await checkRealInternet();
      
      if (!hasInternet && !offlineAlertShown.current) {
        offlineAlertShown.current = true;
        setIsOnline(false);

        Swal.fire({
          title: "Connection Lost",
          text: "Internet connection lost. Exam paused. Reconnect to continue.",
          icon: "warning",
          allowOutsideClick: false,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
      
      isCheckingInternet = false;
    };

    const handleOnline = async () => {
      if (isCheckingInternet || !offlineAlertShown.current) return;
      isCheckingInternet = true;
      
      const hasInternet = await checkRealInternet();
      
      if (hasInternet && offlineAlertShown.current) {
        offlineAlertShown.current = false;
        setIsOnline(true);
        Swal.close();

        try {
          await axios.post("/api/main-backend/exam/qa/session/resume");
          
          const res = await axios.get("/api/main-backend/exam/qa/session/resume-data");
          setCurrent(res.data.currentQuestionIndex || 0);
          setSelected(res.data.selectedAnswers || {});
          setVisited(res.data.selectedAnswers || {});

          Swal.fire({
            title: "Reconnected",
            text: "Exam resumed successfully",
            icon: "success",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error("Failed to resume:", err);
        }
      }
      
      isCheckingInternet = false;
    };

    // ✅ Listen to browser events (instant detection)
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // ✅ Poll backend every 10 seconds (reduced frequency)
    checkInterval = setInterval(async () => {
      if (isCheckingInternet) return; 
      
      const hasInternet = await checkRealInternet();
      
      if (!hasInternet && !offlineAlertShown.current) {
        handleOffline();
      } else if (hasInternet && offlineAlertShown.current) {
        handleOnline();
      }
    }, 10000); 

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(checkInterval);
    };
  }, []);

  // VIOLATION TRACKING - Electron IPC based detection
  const registerViolation = async (type, message) => {
    try {
      const res = await axios.post("/api/main-backend/exam/qa/session/violation", {
        type,
      });
      
      if (res.data.terminated) {
        forceExit({ reason: "Violation limit exceeded" });
        return;
      }

      setViolations({
        fullscreenExit: res.data.fullscreenExit || 0,
        tabSwitch: res.data.tabSwitch || 0,
      });
      
      Swal.fire({
        title: "⚠️ Warning",
        html: `
          <p>${message}</p>
          <p style="margin-top: 10px; color: #dc3545; font-weight: bold;">
            Total Violations: ${res.data.totalViolations}
          </p>
        `,
        icon: "warning",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Violation registration error:", err);
    }
  };

  // page hide
  useEffect(() => {
    const onPageHide = () => {
      registerViolation("pagehide", "Page hidden or navigated away");
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  // tab blur detection, ✅ TAB SWITCH DETECTION
  useEffect(() => {
    const onBlur = () => {
      registerViolation("tabSwitch", "Window focus lost (Alt+Tab detected)");
    };

    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // FULLSCREEN ENFORCEMENT - Fixed to always show warning
  useEffect(() => {
    let isHandlingExit = false;

    const forceFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    // Enter fullscreen on first interaction
    document.addEventListener("click", forceFullscreen, { once: true });

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !isHandlingExit) {
        isHandlingExit = true;

        // 🚨 Register violation immediately
        registerViolation(
          "fullscreenExit",
          "Exited fullscreen mode"
        );

        // 🔒 Force fullscreen back instantly
        setTimeout(() => {
          forceFullscreen();
          isHandlingExit = false;
        }, 200); // small delay to avoid browser race condition
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [document.fullscreenElement]);


  // BACK NAVIGATION BLOCKING
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const blockBackNavigation = () => {
      Swal.fire({
        title: "Exam in Progress",
        text: "You cannot go back during the exam.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      window.history.pushState(null, "", window.location.href);
    };

    const warnBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have an ongoing exam.";
    };

    window.addEventListener("popstate", blockBackNavigation);
    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      window.removeEventListener("popstate", blockBackNavigation);
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, []);

  // KEYBOARD BLOCKING
  useEffect(() => {
    const blockKeyboard = (e) => {
      // Allow typing in radio buttons and other interactive elements
      const target = e.target;
      if (target.type === 'radio' || target.type === 'checkbox') {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("keydown", blockKeyboard, true);
    document.addEventListener("keyup", blockKeyboard, true);
    document.addEventListener("keypress", blockKeyboard, true);

    return () => {
      document.removeEventListener("keydown", blockKeyboard, true);
      document.removeEventListener("keyup", blockKeyboard, true);
      document.removeEventListener("keypress", blockKeyboard, true);
    };
  }, []);

  // KEYBOARD BLOCKING - Selective dangerous keys only
  useEffect(() => {
    const blockDangerousKeys = (e) => {
      // Block developer tools access
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        return false;
      }

      // Block copy/paste/cut
      if (e.ctrlKey && ["c", "v", "x"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }

      // Register screenshot attempts
      if (e.key === "PrintScreen") {
        e.preventDefault();
        registerViolation("printScreen", "Screenshot attempt detected");
        return false;
      }
    };

    document.addEventListener("keydown", blockDangerousKeys, true);
    return () => document.removeEventListener("keydown", blockDangerousKeys, true);
  }, []);


  // FULLSCREEN ENFORCEMENT - Web version only (Electron handles in main.js)
  useEffect(() => {
    const isElectron = window?.electronAPI || window?.appEnv?.isElectron;
    if (isElectron) return; // Skip for Electron - main.js handles it

    let isHandlingExit = false;

    const forceFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    // Enter fullscreen on first interaction
    document.addEventListener("click", forceFullscreen, { once: true });

    return () => {
      document.removeEventListener("click", forceFullscreen);
    };
  }, []);

  // PREVENT TEXT SELECTION & RIGHT CLICK
  useEffect(() => {
    const preventSelection = (e) => e.preventDefault();
    const disableContextMenu = (e) => e.preventDefault();
    
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener("contextmenu", disableContextMenu);
    
    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener("contextmenu", disableContextMenu);
    };
  }, []);

  // SCREENSHOT DETECTION
  useEffect(() => {
    const detectScreenshot = (e) => {
      if (
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && ['3', '4'].includes(e.key)) ||
        (e.metaKey && e.shiftKey && e.key === 's')
      ) {
        registerViolation('screenshot', 'Screenshot attempt detected');
      }
    };

    document.addEventListener('keyup', detectScreenshot);
    return () => document.removeEventListener('keyup', detectScreenshot);
  }, []);

  // DISABLE RIGHT CLICK
  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);
    return () => document.removeEventListener("contextmenu", disableContextMenu);
  }, []);

  // AUTO SCROLL PROGRESS
  useEffect(() => {
    if (circleRefs.current[current]) {
      circleRefs.current[current].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [current]);

  // ACTIONS
  const forceExit = async (data) => {
    const reason = data.reason || data.message || "Exam session is no longer active";
    
    try {
      // Call backend to update session status
      await axios.post("/api/main-backend/exam/qa/session/forceexit", {
        reason,
        registerno: student.registerno
      });
    } catch (error) {
      console.error("Force exit error:", error);
    } finally {
      // Show alert and redirect regardless of backend response
      Swal.fire({
        title: "Exam Ended",
        text: reason,
        icon: "error",
        allowOutsideClick: false,
      }).then(() => {
        // Clear local storage
        localStorage.removeItem("exam_data");
        sessionStorage.removeItem("studentDetails");
        navigate("/QA/qaexam", { replace: true });
      });
    }
  };

  const selectOption = (opt) => {
    setSelected((prev) => ({ ...prev, [current]: opt }));
  };

  const nextQuestion = async () => {
    if (!selected[current]) {
      alertBox("Required", "Please select an option before continuing.", "info");
      return;
    }

    const success = await submitCurrentAnswer();
    if (!success) return;

    setVisited((prev) => ({ ...prev, [current]: true }));
    setCurrent(prev => prev + 1);
  };

  const submitCurrentAnswer = async () => {
    if (!selected[current]) {
      alertBox("Required", "Please select an option before continuing.", "info");
      return;
    }
    try {
      setLoading(true);
      const currentQuestion = questions[current];
      console.log(currentQuestion, selected[current], current);

      const res = await axios.post("/api/main-backend/student/answers/next", {
        question: currentQuestion.question,
        choosedOption: selected[current],
        questionIndex: current,
      });

      return true;
    } catch (error) {
      Swal.fire({
        title: "Submission Error",
        text: error.response?.data?.message || "Failed to save answer",
        icon: "error",
        allowOutsideClick: false,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async (forced = false) => {
    // Skip validation if forced (time up)
    if (!forced && !selected[current]) {
      alertBox("Required", "Please select an option before continuing.", "info");
      return;
    }

    if (selected[current]) {
      await submitCurrentAnswer();
    }

    try {
      setLoading(true);
      setExamSubmitted(true); // Stop heartbeat and other checks

      const res = await axios.post("/api/main-backend/student/results", {
        scheduleId: exam.scheduleId
      });

      const { registerno, name, department, batch, totalMarks, violations, cie } = res.data;

      // If forced (time up), update backend session status to COMPLETED
      if (forced) {
        try {
          await axios.post("/api/main-backend/exam/qa/session/forceexit", {
            reason: "Time up",
            registerno
          });
        } catch (err) {
          console.error("Failed to update session status:", err);
        }
      }

      Swal.fire({
        title: forced ? "Time's Up! - Exam Auto-Submitted" : "Exam Result",
        icon: "success",
        html: `
          <div style="
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size:14px;
            color:#1f2937;
            padding:5px 0;
          ">

            <div style="
              border:1px solid #e5e7eb;
              border-radius:8px;
              padding:12px 16px;
              background:#f9fafb;
            ">
              <table style="
                width:100%;
                border-collapse:collapse;
                text-align:left;
              ">
                <tr>
                  <td style="
                    width:130px;
                    padding:6px 0;
                    font-weight:600;
                    color:#374151;
                    vertical-align:top;
                    text-align:left;
                  ">
                    Register No
                  </td>

                  <td style="
                    width:20px;
                    padding:6px 10px;   /* ADDED GAP AROUND : */
                    font-weight:600;
                    vertical-align:top;
                    text-align:center;
                  ">
                    :
                  </td>

                  <td style="
                    padding:6px 0 6px 10px;  /* ADDED GAP AFTER : */
                    color:#111827;
                    vertical-align:top;
                    text-align:left;
                  ">
                    ${registerno}
                  </td>
                </tr>

                <tr>
                  <td style="width:170px; padding:6px 0; font-weight:600; text-align:left;">
                    Name
                  </td>
                  <td style="width:20px; padding:6px 10px; text-align:center; font-weight:600;">:</td>
                  <td style="padding:6px 0 6px 10px; text-align:left;">
                    ${name}
                  </td>
                </tr>

                <tr>
                  <td style="width:170px; padding:6px 0; font-weight:600; text-align:left;">
                    Department
                  </td>
                  <td style="width:20px; padding:6px 10px; text-align:center; font-weight:600;">:</td>
                  <td style="padding:6px 0 6px 10px; text-align:left;">
                    ${department}
                  </td>
                </tr>

                <tr>
                  <td style="width:170px; padding:6px 0; font-weight:600; text-align:left;">
                    Year
                  </td>
                  <td style="width:20px; padding:6px 10px; text-align:center; font-weight:600;">:</td>
                  <td style="padding:6px 0 6px 10px; text-align:left;">
                    ${batch}
                  </td>
                </tr>
              </table>
            </div>
            <div style="
              margin-top:14px;
              padding:12px;
              text-align:center;
              border-radius:8px;
              background:#ecfdf5;
              border:1px solid #bbf7d0;
            ">
              <div style="font-size:18px; font-weight:700; color:#15803d;">
                Total Marks
              </div>
              <div style="font-size:22px; font-weight:800; color:#166534;">
                ${totalMarks} / ${totalQuestions}
              </div>
            </div>

            <div style="
              margin-top:16px;
              border-top:1px dashed #d1d5db;
              padding-top:12px;
            ">
              <div style="
                font-weight:700;
                color:#b91c1c;
                margin-bottom:8px;
                text-align:center;
              ">
                Violation Summary
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                background:#fef2f2;
                padding:8px 12px;
                border-radius:6px;
                margin-bottom:6px;
              ">
                <span>Fullscreen Exits</span>
                <span style="font-weight:700;">${violations.fullscreenExit}</span>
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                background:#fef2f2;
                padding:8px 12px;
                border-radius:6px;
              ">
                <span>Tab Switches</span>
                <span style="font-weight:700;">${violations.tabSwitch}</span>
              </div>
            </div>
          </div>
        `,
        confirmButtonText: "Finish",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(async () => {
        localStorage.removeItem("examSession");
        sessionStorage.removeItem("studentDetails");
        await axios.post("/api/main-backend/student/complete", {
          scheduleId: exam.scheduleId
        });
        navigate("/QA/qaexam", { replace: true });
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch result",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <>
      <div className="z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            Time Left: <span className={timeLeft < 300 ? "text-red-600" : "text-green-600"}>{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">Fullscreen:</span>
              <span className="text-red-600">{violations.fullscreenExit}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">Tab Switch:</span>
              <span className="text-red-600">{violations.tabSwitch}</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${
              isOnline
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500 animate-pulse"
              }`}></span>
            {isOnline ? "Online" : "Offline"}
            {!isOnline && <span className="ml-1 text-xs font-medium">(Paused)</span>}
          </div>
        </div>
      </div>

      <div className="quest_page relative select-none" style={{ paddingTop: "20px" }}>
        <div className="quest_left">
          <h2 className="quest_title">Question</h2>
          <h3 className="quest_question">
            {q?.id}. {formatMathText(q?.question)}
          </h3>
        </div>

        <div className="quest_center">
          <h2 className="quest_options_title">Options</h2>
          <div className="quest_options_container" key={current}>
            {q?.options.map((opt, index) => (
              <label key={index} className="quest_option">
                <input
                  type="radio"
                  name={`q-${current}`}
                  checked={selected[current] === opt}
                  onChange={() => selectOption(opt)}
                  disabled={loading || !isOnline}
                />
                <span>{formatMathText(opt)}</span>
              </label>
            ))}
          </div>
          <div className="quest_button_area">
            {current < totalQuestions - 1 ? (
              <button className="quest_btn_next" onClick={nextQuestion} disabled={loading || !isOnline}>
                {loading ? "Saving..." : "Next"}
              </button>
            ) : (
              <button className="quest_btn_submit" onClick={() => submitExam()} disabled={loading || !isOnline}>
                {loading ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>

        <div className="quest_right">
          <h2 className="quest_progress_title">Progress</h2>
          <div className="quest_circles_scroll" ref={scrollRef}>
            {Array.from({ length: totalQuestions }, (_, index) => (
              <div
                key={index}
                ref={(el) => (circleRefs.current[index] = el)}
                className={`quest_circle 
                  ${current === index ? "quest_circle_active" : ""} 
                  ${visited[index] ? "quest_circle_done" : ""}`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestionPage;
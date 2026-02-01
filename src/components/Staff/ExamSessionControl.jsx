import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Search, Pause, Play, RefreshCw, AlertCircle, Clipboard } from "lucide-react";
import "./ExamSessionControl.css";

export default function ExamSessionControl() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pausingRegisterno, setPausingRegisterno] = useState(null);

  // Fetch active exam sessions on mount
  useEffect(() => {
    fetchActiveSessions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter sessions based on search
  useEffect(() => {
    const filtered = sessions.filter(session =>
      session.registerno.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [searchQuery, sessions]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/main-backend/examiner/exam/active-sessions");
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch active sessions"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeElapsed = (startedAt) => {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimeRemaining = (endsAt) => {
    const remaining = new Date(endsAt).getTime() - Date.now();
    if (remaining <= 0) return "Time Up";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "🟢 Active" },
      PAUSED: { bg: "bg-yellow-100", text: "text-yellow-800", label: "🟡 Paused" },
      COMPLETED: { bg: "bg-blue-100", text: "text-blue-800", label: "🔵 Completed" },
      TERMINATED: { bg: "bg-red-100", text: "text-red-800", label: "🔴 Terminated" }
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return <span className={`badge ${config.bg} ${config.text}`}>{config.label}</span>;
  };

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

  const handlePauseExam = async (session) => {
    const result = await Swal.fire({
      title: "Pause Exam?",
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><b>Student:</b> ${session.name}</p>
          <p><b>Register No:</b> ${session.registerno}</p>
          <p><b>Department:</b> ${session.department}</p>
          <p style="margin-top: 15px; color: #666;">
            Are you sure you want to pause this student's exam?
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff9800",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Pause Exam",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      setPausingRegisterno(session.registerno);

      const response = await axios.post("/api/main-backend/examiner/exam/pause", {
        registerno: session.registerno
      });

      Swal.fire({
        icon: "success",
        title: "Exam Paused",
        text: `${session.name}'s exam has been paused successfully`,
        timer: 2000
      });

      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s.registerno === session.registerno
            ? { ...s, status: "PAUSED", isOnline: false }
            : s
        )
      );
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Pause",
        text: error.response?.data?.message || "Could not pause exam"
      });
    } finally {
      setPausingRegisterno(null);
    }
  };

  return (
    <div className="exam-session-container">
      <div className="session-header">
        <div className="header-content">
          <h1 className="page-title text-secd"><Clipboard size={32}/> Active Exam Sessions</h1>
          <p className="page-subtitle">Manage and control ongoing student exams</p>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by register number, name, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <button 
          onClick={fetchActiveSessions}
          className="refresh-btn"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "spinning" : ""} />
          Refresh
        </button>
      </div>

      <div className="sessions-section">
        {loading && sessions.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading active sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No Active Sessions</h3>
            <p>
              {searchQuery
                ? "No students found matching your search"
                : "No students are currently taking exams"}
            </p>
          </div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.map((session) => (
              <div key={session._id} className="session-card">
                <div className="card-header">
                  <div className="student-info">
                    <h3 className="student-name">{session.name}</h3>
                    <p className="register-no">{session.registerno}</p>
                  </div>
                  <div className="status-badge">
                    {getStatusBadge(session.status)}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span className="value text-sm">{deptMap[session.department] || "N/A"}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Batch:</span>
                    <span className="value">{session.batch || "N/A"}</span>
                  </div>

                  <div className="divider"></div>

                  <div className="timer-section">
                    <div className="timer-item">
                      <span className="timer-label">⏱️ Time Elapsed:</span>
                      <span className="timer-value">
                        {formatTimeElapsed(session.startedAt)}
                      </span>
                    </div>
                    <div className="timer-item">
                      <span className="timer-label">⏰ Time Remaining:</span>
                      <span className="timer-value remaining">
                        {formatTimeRemaining(session.endsAt)}
                      </span>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="stats-row">
                    <div className="stat">
                      <span className="stat-label">Questions</span>
                      <span className="stat-value">{session.totalQuestions || "50"}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Answered</span>
                      <span className="stat-value">{session.answeredCount || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Violations</span>
                      <span className={`stat-value ${(session.violations?.totalViolations || 0) > 5 ? "warning" : ""}`}>
                        {session.violations?.totalViolations || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  {session.status === "ACTIVE" ? (
                    <button
                      onClick={() => handlePauseExam(session)}
                      disabled={pausingRegisterno === session.registerno}
                      className="btn btn-pause"
                    >
                      {pausingRegisterno === session.registerno ? (
                        <>
                          <div className="btn-spinner"></div>
                          <span>Pausing...</span>
                        </>
                      ) : (
                        <>
                          <Pause size={18} />
                          <span>Pause Exam</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button className="btn btn-disabled" disabled>
                      <span>
                        {session.status === "PAUSED" && "⏸️ Already Paused"}
                        {session.status === "COMPLETED" && "✓ Completed"}
                        {session.status === "TERMINATED" && "✗ Terminated"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="legend-section">
        <h4>Status Guide:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: "#10b981" }}></span>
            <span>Active - Exam in progress</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: "#f59e0b" }}></span>
            <span>Paused - Exam paused by staff</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: "#3b82f6" }}></span>
            <span>Completed - Exam submitted</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: "#ef4444" }}></span>
            <span>Terminated - Exam ended due to violation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

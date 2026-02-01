import { useState } from "react";
import { BarChart3, Users, ClipboardList, LogOut } from "lucide-react";
import ExamSessionControl from "./ExamSessionControl";
import "./StaffDashboard.css";

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="staff-dashboard">
      {/* <nav className="staff-navbar">
        <div className="navbar-container">
          <h1 className="navbar-brand">🎓 QA Examination Platform</h1>
          <div className="navbar-right">
            <span className="staff-role">Staff Panel</span>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </nav> */}

      <div className="staff-layout">
        {/* <aside className="staff-sidebar">
          <div className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === "sessions" ? "active" : ""}`}
              onClick={() => setActiveTab("sessions")}
            >
              <BarChart3 size={20} />
              <span>Active Sessions</span>
            </button>

            <button
              className={`menu-item ${activeTab === "violations" ? "active" : ""}`}
              onClick={() => setActiveTab("violations")}
            >
              <Users size={20} />
              <span>Exam Violations</span>
            </button>

            <button
              className={`menu-item ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              <ClipboardList size={20} />
              <span>Reports</span>
            </button>
          </div>
        </aside> */}

        <main className="staff-content">
          {activeTab === "sessions" && <ExamSessionControl />}

          {activeTab === "violations" && (
            <div className="placeholder-section">
              <h2>📊 Exam Violations</h2>
              <p>Monitor and review student exam violations and suspicious activities.</p>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="placeholder-section">
              <h2>📈 Reports</h2>
              <p>Generate and view detailed exam reports and analytics.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

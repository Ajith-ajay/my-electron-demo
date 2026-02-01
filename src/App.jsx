import React, { useEffect, useState, Suspense, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import styled, { createGlobalStyle } from "styled-components";

import LoadComp from "./components/LoadComp.jsx";
import AptitudeHeader from "./components/QA Student/AptitudeHeader.jsx";
import Boot from "./components/BootUp/BootUp.jsx";
import AuthPage from "./components/Auth/auth.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import "./App.css"
import UpdateChecker from "./components/updateChecker.jsx";

/* Lazy Loaded Pages */
const StudentLoginPage = React.lazy(() =>
  import("./components/QA Student/StudentLoginPage.jsx")
);
const InstructionPage = React.lazy(() =>
  import("./components/QA Student/Approve.jsx")
);
const QuestionPage = React.lazy(() =>
  import("./components/QA Student/questions.jsx")
);
const Schedule = React.lazy(() =>
  import("./components/QA Schedule/Schedule/schedule.jsx")
);
const UploadContainer = React.lazy(() =>
  import("./components/QA Schedule/uploads/uploadContainer.jsx")
);
const QAExamResults = React.lazy(() =>
  import("./components/QA Schedule/qaExamResult.jsx")
);
const ScheduledExam = React.lazy(() =>
  import("./components/QA Schedule/scheduledExam.jsx")
);
const StaffPage = React.lazy(() =>
  import("./components/Staff/StaffPage")
);

const GlobalStyle = createGlobalStyle`
    /* Global Cursor Style */
    body {
        cursor: url("/cursor.svg") 10 0, auto; /* Custom cursor with defined hotspot */
        overflow: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
        overflow-x: hidden; 
    }

    html {
        overflow-x: hidden;
    }

    body::-webkit-scrollbar {
        display: none; 
    }

    button, a, .clickable {
        cursor: url("/cursor.svg") 0 0, auto;
    }
    `;

const AppContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  `;

const MainContentWrapper = styled.div`
  flex: 1;
  padding-top: 8.69%;
  `;

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cookies = new Cookies();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // useGoogleAnalytics();

  /* ---------------- Boot Logic ---------------- */
  const [loaded, setLoaded] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  const isAuth =
    cookies.get("firstTime") !== undefined &&
    +cookies.get("firstTime") > 3;

  if (cookies.get("firstTime") === undefined)
    cookies.set("firstTime", 0);
  else if (cookies.get("firstTime") < 5)
    cookies.set("firstTime", +cookies.get("firstTime") + 1);

  const load = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBoot(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [loaded]);

  /* ---------------- Offline Handling ---------------- */
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => {
    setCurrentPath(location.pathname); // Update state when route changes
  }, [location]); 

  useEffect(() => {
    // ✅ Only redirect in Electron, not in web browser
    if (window.appEnv?.isElectron && location.pathname === '/') {
      navigate('/QA/qaexam', { replace: true });
    }
  }, [location.pathname, navigate]);

  const showStudentDetails = currentPath === "/QA/questions" || currentPath === "/QA/confirm";

  if (!isOnline) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadComp txt="You are offline" />
      </div>
    );
  }

  return (
    <>
    <GlobalStyle />
    <AuthProvider>
    <AppContainer>
      <UpdateChecker />
      {location.pathname === "/" && showBoot && (
        <Boot isAuth={isAuth} isLoaded={loaded} />
      )}

        <AptitudeHeader detailsFlag={showStudentDetails} />
        <MainContentWrapper id="main-content" className="overflow-y-auto h-full">
          <Suspense
            fallback={
              <div className="h-screen flex items-center justify-center">
                <LoadComp />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />

              <Route path="/QA/qaexam" element={<StudentLoginPage />} />
              <Route path="/QA/confirm" element={<InstructionPage />} />
              <Route path="/QA/questions" element={<QuestionPage />} />

              <Route path="/staff-dashboard" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <Schedule />
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <UploadContainer />
                </ProtectedRoute>
              } />
              <Route path="/scheduled-exam" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <ScheduledExam />
                </ProtectedRoute>
              } />
              <Route path="/qaresult" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <QAExamResults />
                </ProtectedRoute>
              } />
              <Route path="/qasession" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <StaffPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </MainContentWrapper>
    </AppContainer>
    </AuthProvider>
    </>
  );
};

export default App;
import { useState } from "react";
import StaffDashboard from "./StaffDashboard";
import "./StaffPage.css";

/**
 * Staff Page - Main entry point for staff functionality
 * This page can be accessed via /staff or similar route
 * 
 * Usage in App.jsx or routing file:
 * <Route path="/staff" element={<StaffPage />} />
 */
export default function StaffPage() {
  return <StaffDashboard />;
}

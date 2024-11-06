// src/Approute.js
import React, { useContext } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import ResponsiveAppBar from "./components/AppBar/AppBar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";
import { UserContext } from "./context/UserContext"; // Adjust the path accordingly
import { ROLES } from "./constants/roles";
// Import all your page components
import HomePage from "./pages/LandingPage/LandingPage";
import MyTimesheets from "./pages/MyTimesheets";
import ManagerView from "./pages/ManagerView";
import Allocations from "./pages/Allocations/Allocations";
import BizopsDashboard from "./pages/BizopsDashboard/BizopsDashboard";
import EmpPage from "./pages/EmployeesList/EmpPage";
import Projects from "./pages/ClientList/Projects";
import EmployeeDetails from "./pages/EmployeeDetails/EmployeeDetails";
import ClientProjects from "./pages/ClientProjects/ClientProjects";
import ClientDetails from "./pages/ProjectResources/ClientDetails";
import NotAuthorized from "./pages/NotAuthorized";
import LeaderDashboard from "./pages/LeadersDashboard/LeaderDashboard";
import LoadingSpinner from "./components/LoadingSpinner"; // Create this component
import ProtectedRoute from "./components/ProtectedRoute";

export default function Approute() {
  return <AppRoutes />;
}

function AppRoutes() {
  const { userRole, loading } = useContext(UserContext);

  if (loading) {
    return <LoadingSpinner />; // Show a loading spinner while fetching role
  }

  return (
    <div className="app">
      <BrowserRouter>
        <main className="content">
          <Routes>
            {/* Public Route */}
            {!userRole && (
              <Route path="*" element={<NotAuthorized />} />
            )}

            {/* Protected Routes */}
            {userRole && (
              <Route path="/" element={<ResponsiveAppBar />}>
                {/* Main Routes */}
                <Route index element={<HomePage />} />
                <Route
                  path="mytimesheet"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.BIZOPS, ROLES.LEADER]}>
                      <MyTimesheets />
                    </ProtectedRoute>
                  }
                />
                {/* Leaders View - Accessible only to Leaders */}
                <Route
                  path="leadersview"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.LEADER]}>
                      <LeaderDashboard />
                    </ProtectedRoute>
                  }
                />
                {/* Manager View - Accessible to Managers and Leaders */}
                <Route
                  path="managerview"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.LEADER]}>
                      <ManagerView />
                    </ProtectedRoute>
                  }
                />
                {/* Allocations and its Sub-Routes - Accessible to BizOps and Leaders */}
                <Route
                  path="allocations/*"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.BIZOPS, ROLES.LEADER]}>
                      <Allocations />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<BizopsDashboard />} />
                  <Route path="bizopsdashboard" element={<BizopsDashboard />} />
                  <Route path="employees" element={<EmpPage />} />
                  <Route path="projects" element={<Projects />} />
                </Route>
                
                {/* Other Routes */}
                <Route
                  path="employee/:id"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.BIZOPS, ROLES.LEADER]}>
                      <EmployeeDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client/:clientId/projects"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.BIZOPS, ROLES.LEADER]}>
                      <ClientProjects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client/:clientId/project/:projectId"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.BIZOPS, ROLES.LEADER]}>
                      <ClientDetails />
                    </ProtectedRoute>
                  }
                />
                
                {/* Redirect any unknown paths to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

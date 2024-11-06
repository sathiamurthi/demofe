// src/context/MockAuthProvider.js
import React, { createContext, useContext, useState } from "react";

// Create a context for mocked authentication
const AuthContext = createContext(null); // Use null or initial state

// Custom hook to use the authentication context
export const useMockAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
};

// Mocked Auth Provider Component
export const MockAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Mock login function
  const login = () => {
    setInProgress(true);
    setTimeout(() => {
      setIsAuthenticated(true);  // Simulate successful login
      setUserProfile({ name: "Sathiamurthi", email: "dnmsathia@gmail.com" });
      setInProgress(false);
    }, 1000);
  };

  // Mock logout function
  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  const value = {
    isAuthenticated,
    inProgress,
    login,
    logout,
    userProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

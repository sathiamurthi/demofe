// src/components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole } = useContext(UserContext);

  if (!userRole) {
    // Optionally, you can redirect to a loading page or login
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.includes(userRole)) {
    return children;
  } else {
    // Redirect to a "Not Authorized" page or home
    return <Navigate to="/not-authorized" replace />;
  }
};

export default ProtectedRoute;

// src/context/UserContext.js
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  const handleLogout = () => {
    setUserRole(null);
    // Additional logout logic if needed
  };

  return (
    <UserContext.Provider value={{ userRole, setUserRole, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};

// src/components/Layout.js
import React from 'react';
import ResponsiveAppBar from '../components/AppBar/AppBar'; // Adjust the path if necessary
import { Drawer, Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
// import './Layout.css'; // Create and style as needed

const Layout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <ResponsiveAppBar />

      {/* Sidebar Drawer */}
      {/* Ensure that the sidebar state is managed within ResponsiveAppBar or lifted up if needed */}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '64px' }}>
        {/* Outlet renders the matched child route */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

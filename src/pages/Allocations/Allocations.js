// src/pages/Allocations/Allocations.js
import React from 'react';
import { Outlet } from 'react-router-dom';

function Allocations() {
  return (
    <div>
      {/* You can add Allocations-specific content here */}
      <Outlet /> {/* This renders the sub-routes like BizopsDashboard, Employees, Projects */}
    </div>
  );
}

export default Allocations;

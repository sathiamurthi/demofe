import React, { useContext } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { FaRegClipboard, FaRegChartBar, FaClock, FaUser, FaProjectDiagram, FaUsers } from 'react-icons/fa';
import { UserContext } from '../../context/UserContext'; // Import the UserContext
import { ROLES } from '../../constants/roles'; // Import the roles

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Access the userRole from UserContext
  const { userRole } = useContext(UserContext);

  return (
    <div className="landing-container">
      <h1 style={{ marginLeft: '20px' }}>DemoDigital</h1>
      <div className="cards-container">
        {/* Conditionally render cards based on userRole */}

        {/* Leader's View Card (only for LEADER role) */}
        {userRole === ROLES.LEADER && (
          <div className="card">
            <div className="card-header">
              <FaRegClipboard className="icon" />
              <h3>Leader's View</h3>
            </div>
            <p className="subtitle">Strategic Dashboard for Leadership</p>
            <p>Monitor KPIs, resource utilization, and project health metrics. Get real-time insights into team performance and business outcomes.</p>
            <button className="button" onClick={() => navigate('/leadersview')}>
              Access Leaders Page
            </button>
          </div>
        )}

        {/* Manager's View Card (for MANAGER and LEADER roles) */}
        {(userRole === ROLES.MANAGER || userRole === ROLES.LEADER) && (
          <div className="card">
            <div className="card-header">
              <FaUsers className="icon" />
              <h3>Manager's View</h3>
            </div>
            <p className="subtitle">Team Management & Timesheet Approval</p>
            <p>Streamline timesheet approvals, monitor team capacity, and track project progress. Manage resource allocation and team performance.</p>
            <button className="button" onClick={() => navigate('/managerview')}>
              Access Managers View
            </button>
          </div>
        )}

        {/* Employee Allocation Card (for BIZOPS and LEADER roles) */}
        {(userRole === ROLES.BIZOPS || userRole === ROLES.LEADER) && (
          <div className="card">
            <div className="card-header">
              <FaUser className="icon" />
              <h3>Employee Allocation</h3>
            </div>
            <p className="subtitle">Resource Planning & Assignment</p>
            <p>View and manage employee assignments across projects. Balance workloads and track availability for optimal resource utilization.</p>
            <button className="button" onClick={() => navigate('/allocations/employees')}>
              Manage Employees
            </button>
          </div>
        )}

        {/* Allocation Report Card (for BIZOPS and LEADER roles) */}
        {(userRole === ROLES.BIZOPS || userRole === ROLES.LEADER) && (
          <div className="card">
            <div className="card-header">
              <FaRegChartBar className="icon" />
              <h3>Allocation Report</h3>
            </div>
            <p className="subtitle">Resource Analytics & Insights</p>
            <p>Generate detailed reports on resource allocation, utilization trends, and capacity planning. Identify bottlenecks and optimization opportunities.</p>
            <button className="button" onClick={() => navigate('/allocations')}>
              View Reports
            </button>
          </div>
        )}

        {/* Employee Timesheet Card (for EMPLOYEE, MANAGER, BIZOPS, and LEADER roles) */}
        {(userRole === ROLES.EMPLOYEE || userRole === ROLES.MANAGER || userRole === ROLES.BIZOPS || userRole === ROLES.LEADER) && (
          <div className="card">
            <div className="card-header">
              <FaClock className="icon" />
              <h3>Employee Timesheet</h3>
            </div>
            <p className="subtitle">Time Tracking & Project Logging</p>
            <p>Record daily work hours, track project tasks, and submit timesheets for approval. Maintain accurate records of project time investments.</p>
            <button className="button" onClick={() => navigate('/mytimesheet')}>
              Access Timesheet
            </button>
          </div>
        )}

        {/* Project Allocation Card (for BIZOPS and LEADER roles) */}
        {(userRole === ROLES.BIZOPS || userRole === ROLES.LEADER) && (
          <div className="card">
            <div className="card-header">
              <FaProjectDiagram className="icon" />
              <h3>Project Allocation</h3>
            </div>
            <p className="subtitle">Project Resource Management</p>
            <p>Assign resources to projects, track project staffing needs, and manage project team composition. Ensure optimal resource distribution.</p>
            <button className="button" onClick={() => navigate('/allocations/projects')}>
              Access Project Allocation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;

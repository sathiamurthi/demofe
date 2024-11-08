// src/pages/EmployeeTimesheetView.jsx

import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Icon, 
  Popup, 
  Message,
  Dropdown,
  Modal
} from 'semantic-ui-react';
import { MdCheck } from "react-icons/md";
import { IoMdClose } from "react-icons/io"; // Import Discard Icon
import axios from 'axios'; // Using axios for HTTP requests
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../context/UserContext'; // Import the UserContext
import { ProfileContext } from '../context/ProfileContext'; // Import ProfileContext
import CustomCalendar from './TimesheetCalendar/CustomCalendar';
import './TimeTable.css';
import config from "../Config.json";

const EmployeeTimesheetView = () => {  
  const { userRole } = useContext(UserContext);
  const profile = useContext(ProfileContext); // Access ProfileContext
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Consolidated loading state
  const [employeeData, setEmployeeData] = useState(null); // State for employee details
  const [timesheetData, setTimesheetData] = useState([]); // State for timesheet data

  // Approval Status Mapping
  const approvalStatusMap = {
    0: 'Not Submitted',
    1: 'Submitted',
    2: 'Approved',
    3: 'Rejected'
  };

  // Weekly Timesheet States
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [weekRange, setWeekRange] = useState('');
  const [days, setDays] = useState([]);

  // New States for Toggle and Day-wise View
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDay, setSelectedDay] = useState(new Date());

  // States for Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [commentToView, setCommentToView] = useState(null);

  // Ref to track which toasts have been shown
  const toastShownRef = useRef({}); // { "projectId-dayIndex": { allocationExceeded: bool, over24: bool } }

  // Helper function to parse date strings as local dates
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Helper function to format Date objects as 'YYYY-MM-DD'
  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Months are 0-indexed
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Helper function to generate default image based on employee name
  const getDefaultImage = (name) => {
    if (!name) return 'https://via.placeholder.com/150';
    const firstChar = name.charAt(0).toUpperCase();
    // Replace this URL with your logic to generate images based on the first character
    return `https://ui-avatars.com/api/?name=${firstChar}&background=random&size=150`;
  };

  // Weekly Timesheet Helper Functions

  // Helper function to get the start of the week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Helper function to format date as "d MMM yy" (e.g., "2 Oct 24")
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  // Initialize Days based on Current Week
  const initializeDays = (weekStart) => {
    const newDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayNumber = date.getDate();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // 'Mon', 'Tue', etc.
      const dateStr = formatDateStr(date); // Use local date formatting
      return { dayNumber, dayName, date, dateStr };
    });
    return newDays;
  };

  // Fetch employee data using the current user's email from ProfileContext
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Retrieve the email from profile context
      const emailToFetch = profile.userPrincipalName;
      if (!emailToFetch) {
        throw new Error("User email is not available.");
      }
      
      console.log(`Fetching employee data for email: ${emailToFetch}`);
      
      const response = await axios.get(`${config.azureApiUrl}/api/getEmployeeDetailsByEmailID`, {
        params: { email: emailToFetch }
      });
      setEmployeeData(response.data);
      console.log("Employee data fetched successfully:", response.data);

      setError(null); // Clear any previous errors

      // After fetching employee data, fetch timesheet data
      await fetchTimesheetData(response.data.EmployeeId, getSelectedDates());

    } catch (err) {
      console.error('Error fetching employee data:', err);
      if (err.response) {
        // Server responded with a status other than 200 range
        if (err.response.status === 404) {
          setError('Employee not found');
        } else if (err.response.status === 400) {
          setError('Invalid email format');
        } else {
          setError('Failed to load employee data');
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server');
      } else {
        // Something else happened
        setError('An unexpected error occurred');
      }
      setEmployeeData(null); // Clear employee data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch timesheet data based on employeeId and dates
  const fetchTimesheetData = async (employeeId, dates) => {
    if (!employeeId || dates.length === 0) {
      setTimesheetData([]);
      setProjects([]);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching timesheet data for EmployeeID: ${employeeId}, Dates: ${dates.join(',')}`);

      const response = await axios.get(`${config.azureApiUrl}/api/getEmployeeTimesheet`, {
        params: {
          employeeId: employeeId,
          dates: dates.join(',')
        }
      });

      const data = response.data;
      setTimesheetData(data);
      console.log("Timesheet data fetched successfully:", data);

      // Initialize projects based on fetched timesheet data
      const initializedProjects = initializeProjects(data, dates);
      setProjects(initializedProjects);

      setError(null); // Clear any previous errors

      // Reset toastShown when new timesheet data is fetched
      toastShownRef.current = {};
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      if (err.response) {
        // Server responded with a status other than 200 range
        setError('Failed to load timesheet data');
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server');
      } else {
        // Something else happened
        setError('An unexpected error occurred while fetching timesheet data');
      }
      setTimesheetData([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Determine selected dates based on view mode
  const getSelectedDates = () => {
    if (viewMode === 'week') {
      const weekStart = getStartOfWeek(currentWeek);
      const selectedDates = Array.from({ length: 7 }, (_, i) => formatDateStr(new Date(weekStart.getTime() + i * 86400000)));
      return selectedDates;
    } else if (viewMode === 'day') {
      return [formatDateStr(selectedDay)];
    }
    return [];
  };

  // Initialize Projects based on fetched timesheet data
  const initializeProjects = (data, dates) => {
    return data.map(project => {
      return {
        id: project.ProjectID,
        name: project.ProjectName,
        manager: project.TimesheetApprover,
        allocationID: project.AllocationID,
        timesheetApproverID: project.TimesheetApproverID,
        hours: dates.map(dateStr => project.DailyDetails[dateStr]?.TimesheetHours?.toString() || ''), // Store as strings
        approvalStatus: dates.map(dateStr => approvalStatusMap[project.DailyDetails[dateStr]?.ApprovalStatus] || 'Not Submitted'),
        comments: dates.map(dateStr => project.DailyDetails[dateStr]?.TimesheetApproverComments || ''),
        status: dates.map(dateStr => {
          const details = project.DailyDetails[dateStr];
          if (details) {
            if (details.OnHoliday === 1) return 'holiday';
            if (details.OnLeave === 1) return 'leave';
          }
          return 'normal';
        }),
        allocationHours: dates.map(dateStr => project.DailyDetails[dateStr]?.AllocationHours?.toString() || '8'), // Store as strings
        isAvailable: dates.map(dateStr => project.DailyDetails.hasOwnProperty(dateStr))
      };
    });
  };

  // Fetch employee data on component mount and when selected dates change
  useEffect(() => {
    if (profile.userPrincipalName) { // Ensure email is available
      fetchEmployeeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.userPrincipalName]);

  // Fetch timesheet data whenever the selected dates change (week or day view)
  useEffect(() => {
    if (employeeData) {
      const employeeId = employeeData.EmployeeId;
      const selectedDates = getSelectedDates();
      fetchTimesheetData(employeeId, selectedDates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek, selectedDay, viewMode]);

  // Update week range and days whenever currentWeek changes
  useEffect(() => {
    if (!employeeData) return; // Wait until employee data is fetched

    const start = getStartOfWeek(currentWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setWeekRange(`${formatDate(start)} - ${formatDate(end)}`);

    // Initialize days based on the current week
    const newDays = initializeDays(start);
    setDays(newDays);
  }, [currentWeek, employeeData]);

  // Handler to update the selected week
  const handleWeekChange = (newWeekStartDate) => {
    setCurrentWeek(newWeekStartDate);
  };

  // Handler to update the selected day
  const handleDayChange = (newSelectedDay) => {
    setSelectedDay(newSelectedDay);
    setViewMode('day'); // Optionally switch to day view when a day is selected
  };

  // Handle week navigation
  const changeWeek = (increment) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7 * increment);
    setCurrentWeek(newDate);
  };

  // Handle day navigation
  const changeDay = (increment) => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + increment);
    setSelectedDay(newDate);
  };

  // Handle input focus to clear previous value
  const handleFocus = (projectId, dayIndex) => {
    const key = `${projectId}-${dayIndex}`;
    
    // Only clear if the current value is not empty
    const currentValue = projects.find(p => p.id === projectId)?.hours[dayIndex];
    if (currentValue !== '') {
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? {
                ...project,
                hours: project.hours.map((h, i) => (i === dayIndex ? '' : h)),
              }
            : project
        )
      );
    }
  };

  // Handle input change for hours
  const handleHourChange = (projectId, dayIndex, value) => {
    let hoursStr = value;
    let hours = parseFloat(hoursStr);
    if (isNaN(hours)) hours = 0;

    const project = projects.find(p => p.id === projectId);
    const allocationHours = parseFloat(project?.allocationHours[dayIndex]) || 8.0;
    const day = days[dayIndex]?.dayName;

    // Define the key for the current project and day
    const key = `${projectId}-${dayIndex}`;

    // Initialize toastShown entry for this project and day if it doesn't exist
    if (!toastShownRef.current[key]) {
      toastShownRef.current[key] = { allocationExceeded: false, over24: false };
    }

    // Handle over 24 hours
    if (hours > 24) {
      if (!toastShownRef.current[key].over24) {
        toast.error(`Cannot set more than 24 hours for project "${project.name}" on ${day}.`);
        toastShownRef.current[key].over24 = true;
      }
      hours = 24; // Cap at 24 hours
      hoursStr = '24';
    } else {
      // Reset over24 flag if hours are reduced below 24
      if (toastShownRef.current[key].over24) {
        toastShownRef.current[key].over24 = false;
      }
    }

    // Handle allocationHours exceeded
    if (hours > allocationHours) {
      if (!toastShownRef.current[key].allocationExceeded) {
        toast.warn(`You have exceeded the allocated ${allocationHours} hours for project "${project.name}" on ${day}.`);
        toastShownRef.current[key].allocationExceeded = true;
      }
    } else {
      // Reset allocationExceeded flag if hours are reduced below allocationHours
      if (toastShownRef.current[key].allocationExceeded) {
        toastShownRef.current[key].allocationExceeded = false;
      }
    }

    // Enforce minimum of 0 hours
    if (hours < 0) {
      hours = 0;
      hoursStr = '0';
    }

    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
              ...project,
              hours: project.hours.map((h, i) => (i === dayIndex ? hoursStr : h)),
            }
          : project
      )
    );
  };


  // Handle status change for a specific project and day
  const handleStatusChange = (projectId, dayIndex, value) => {
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
              ...project,
              status: project.status.map((s, i) => (i === dayIndex ? value : s)),
            }
          : project
      )
    );
  };

  // Calculate total hours per project
  const calculateTotal = (hours) => hours.reduce((sum, hour) => sum + (parseFloat(hour) || 0), 0);

  // Calculate daily total hours
  const calculateDailyTotal = (dayIndex) => 
    projects.reduce((sum, project) => 
      project.status[dayIndex] === 'normal' ? sum + (parseFloat(project.hours[dayIndex]) || 0) : sum, 0
    , 0);


  // Updated getDayIndex to handle viewMode
  const getDayIndex = (date) => {
    if (viewMode === 'day') return 0; // Always use index 0 for day view
    const start = getStartOfWeek(currentWeek);
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Sunday being 0
  };

  // Helper function to get the current day index based on viewMode
  const getCurrentDayIndex = () => {
    return viewMode === 'day' ? 0 : getDayIndex(selectedDay);
  };

  // Function to determine cell background color based on approvalStatus and status
  const getCellBackgroundColor = (project, dayIndex) => {
    const status = project.status[dayIndex];
    const approvalStatus = project.approvalStatus[dayIndex];

    if (status === 'holiday' || status === 'leave') {
      return '#d3d3d3'; // Grey
    }

    switch (approvalStatus) {
      case 'Submitted':
        return '#f4b816'; // Yellow
      case 'Approved':
        return '#55a245'; // Green
      case 'Rejected':
        return '#ff0800'; // Red
      default:
        return 'transparent';
    }
  };

  // Function to get status options based on viewMode
  const getStatusOptions = () => {
    return [
      { key: 'normal', text: 'Normal', value: 'normal' },
      { key: 'holiday', text: 'Holiday', value: 'holiday' },
      { key: 'leave', text: 'On Leave', value: 'leave' },
    ];
  };
  
  // Modified handleSubmit Function
  const handleSubmit = async () => {
    if (!employeeData) {
      toast.error('Employee data is missing.');
      return;
    }

    const employeeId = employeeData.EmployeeId;
    const entries = [];

    if (viewMode === 'week') {
      projects.forEach(project => {
        project.hours.forEach((hour, index) => {
          const approvalStatus = project.approvalStatus[index];
          // Only include entries with 'Not Submitted' or 'Rejected' status
          if (approvalStatus === 'Not Submitted' || approvalStatus === 'Rejected') {
            // Only submit entries that are available
            if (project.isAvailable[index]) {
              entries.push({
                employeeId: employeeId,
                projectId: project.id,
                date: days[index].dateStr,
                hours: parseFloat(hour) || 0,
                status: project.status[index] === 'holiday' ? 'Holiday' :
                        project.status[index] === 'leave' ? 'Leave' : 'Normal',
                timesheetApproverComments: project.comments[index] || ''
              });
            }
          }
        });
      });
    } else if (viewMode === 'day') {
      const dayIndex = getCurrentDayIndex();
      projects.forEach(project => {
        const approvalStatus = project.approvalStatus[dayIndex];
        // Only include entries with 'Not Submitted' or 'Rejected' status
        if (approvalStatus === 'Not Submitted' || approvalStatus === 'Rejected') {
          // Only submit entries that are available
          if (project.isAvailable[dayIndex]) {
            entries.push({
              employeeId: employeeId,
              projectId: project.id,
              date: formatDateStr(selectedDay),
              hours: parseFloat(project.hours[dayIndex]) || 0,
              status: project.status[dayIndex] === 'holiday' ? 'Holiday' :
                      project.status[dayIndex] === 'leave' ? 'Leave' : 'Normal',
              timesheetApproverComments: project.comments[dayIndex] || ''
            });
          }
        }
      });
    }

    if (entries.length === 0) {
      toast.info('No timesheet entries to submit.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.put(`${config.azureApiUrl}/api/submitEmployeeTimesheet`, {
        entries: entries
      });

      if (response.status === 200) {
        const { results } = response.data;

        // Handle individual entry results
        results.forEach(result => {
          if (result.success) {
            toast.success(`Timesheet for Project ID ${result.projectId} on ${result.date} submitted successfully.`);
          } else {
            toast.error(`Failed to submit timesheet for Project ID ${result.projectId} on ${result.date}: ${result.error}`);
          }
        });

        // Update the frontend state based on successful submissions
        setProjects(prevProjects =>
          prevProjects.map(project => ({
            ...project,
            approvalStatus: project.approvalStatus.map((status, i) => {
              if (viewMode === 'week') {
                // For week view, iterate through all days
                const currentStatus = status;
                if (currentStatus === 'Not Submitted' || currentStatus === 'Rejected') {
                  return 'Submitted';
                }
                return currentStatus; // Leave as is for 'Submitted' or 'Approved'
              } else {
                // For day view, only update the selected day
                const currentStatus = project.approvalStatus[i];
                if (i === getCurrentDayIndex()) {
                  if (currentStatus === 'Not Submitted' || currentStatus === 'Rejected') {
                    return 'Submitted';
                  }
                }
                return currentStatus;
              }
            }),
          }))
        );

        // Optionally, re-fetch the timesheet data to ensure synchronization
        await fetchTimesheetData(employeeId, getSelectedDates());

      } else {
        toast.error('Failed to submit timesheet. Please try again later.');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast.error('An error occurred while submitting the timesheet.');
    } finally {
      setLoading(false);
    }
  };


  // Handle discard action
  const handleDiscard = () => {
    if (employeeData) {
      // Re-fetch the timesheet data to reset any changes
      fetchTimesheetData(employeeData.EmployeeId, getSelectedDates());
      console.log('Changes discarded');
      toast.info('Changes have been discarded.');
    }
  };

  // Handler to view comments
  const handleViewComment = (projectId, dayIndex) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const comment = project.comments[dayIndex];
      const dateStr = viewMode === 'day' ? formatDateStr(selectedDay) : days[dayIndex]?.dateStr;
      console.log(`Viewing comment for Project ID: ${projectId}, Day Index: ${dayIndex}, Comment: ${comment}, Date: ${dateStr}`);
      setCommentToView({ 
        projectName: project.name, 
        dayIndex: dayIndex, 
        comment: comment,
        date: dateStr
      });
      setModalOpen(true);
    } else {
      console.warn(`Project with ID ${projectId} not found.`);
    }
  };

  return (
    <div className="main-layout">
      <div className='right-content'>
        {loading && <div className="loading-indicator">Loading...</div>}
        {error && <Message negative>{error}</Message>}
        
        {!loading && employeeData && (
          <>
            {/* Employee Details Section */}
            <div className='middle-content'>
              <div className="employee-card">
                <div className="card-header">
                  {/* Employee Image or Default Image */}
                  <img 
                    src={employeeData.EmployeePhotoDetails ? employeeData.EmployeePhotoDetails : getDefaultImage(employeeData.EmployeeName)} 
                    alt="Employee Profile" 
                    className="profile-img" 
                  />
                  <div className="employee-info">
                    {/* Employee Name */}
                    <h2>{employeeData.EmployeeName}</h2>
                    {/* Employee ID */}
                    <p className="employee-id">ID: {employeeData.EmployeeId}</p>
                  </div>
                  {/* Info Icon with Popup */}
                  <Popup
                    trigger={<i className="info icon" style={{ cursor: 'pointer', fontSize: '1.5em' }} />}
                    content={
                      <div>
                        <p><strong>Joining Date:</strong> {new Date(employeeData.EmployeeJoiningDate).toLocaleDateString()}</p>
                        <p><strong>Ending Date:</strong> {employeeData.EmployeeEndingDate ? new Date(employeeData.EmployeeEndingDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>TYOE:</strong> {employeeData.EmployeeTYOE} Years</p>
                        <p><strong>Skills:</strong> {employeeData.EmployeeSkills}</p>
                        <p><strong>Contract Type:</strong> {employeeData.EmployeeContractType}</p>
                      </div>
                    }
                    position="top right"
                    on="click" // Click to show the popup
                  />
                </div>

                <div className="top-info">
                  <div className="info-item">
                    <Icon name="briefcase" size="large" />
                    <div>
                      <p>Role</p>
                      {/* Employee Role */}
                      <p>{employeeData.EmployeeRole}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <Icon name="building" size="large" />
                    <div>
                      <p>Studio</p>
                      {/* Employee Studio */}
                      <p>{employeeData.EmployeeStudio}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <Icon name="chart line" size="large" />
                    <div>
                      <p>Sub-studio</p>
                      {/* Employee Sub-Studio */}
                      <p>{employeeData.EmployeeSubStudio}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <Icon name="mail" size="large" />
                    <div>
                      <p>Email</p>
                      {/* Employee Email */}
                      <p>{employeeData.EmployeeEmail}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <Icon name="user" size="large" />
                    <div>
                      <p>HCM Status</p>
                      {/* Employee HCM Status */}
                      <p>{employeeData.EmployeeHCMStatus}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <Icon name="map marker alternate" size="large" />
                    <div>
                      <p>Location</p>
                      {/* Employee Location */}
                      <p>{employeeData.EmployeeLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="allocation-chart">
                <CustomCalendar 
                  viewMode={viewMode}
                  currentWeek={currentWeek}
                  selectedDay={selectedDay}
                  onWeekChange={handleWeekChange}
                  onDayChange={handleDayChange}
                  region={employeeData.EmployeeLocation  || null}
                />
              </div>
            </div>

            {/* Weekly Timesheet Section */}
            <div className='bottom-content'>
              {/* View Mode Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <Button 
                    icon
                    labelPosition='left' // Icon will appear to the left of the label
                    active={viewMode === 'week'}
                    color={viewMode === 'week' ? 'blue' : 'grey'}
                    onClick={() => setViewMode('week')}
                    title="Week-wise View"
                    size='large' // Increased button size
                    style={{ marginRight: '20px' }} // Increased space between buttons
                  >
                    <Icon name='calendar alternate outline' /> {/* Week view icon */}
                    Week View
                  </Button>

                  <Button 
                    icon
                    labelPosition='left' // Icon will appear to the left of the label
                    active={viewMode === 'day'}
                    color={viewMode === 'day' ? 'blue' : 'grey'}
                    onClick={() => setViewMode('day')}
                    title="Day-wise View"
                    size='large' // Increased button size
                  >
                    <Icon name='calendar day outline' /> {/* Day view icon */}
                    Day View
                  </Button>
                </div>
              <div className='timetable-content'> {/* Increased padding */}


                {/* Top Controls: Filter, and Week/Day Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '2em', marginBottom: '20px' }}>{viewMode === 'week' ? 'Weekly' : 'Daily'} Timesheet</h2>
                  {/* Conditionally render Week/Day Navigation */}
                  {viewMode === 'week' ? (
                    <>
                      {/* Week Navigation */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <Button
                          icon
                          size='large' // Consistent button size
                          onClick={() => changeWeek(-1)} 
                          title="Previous Week"
                          style={{ padding: '0.8em 1.5em' }} // Consistent padding for buttons
                        >
                          <Icon name='chevron left' size='large' /> {/* Consistent icon size */}
                        </Button>
                        
                        <span style={{ margin: '0 20px', fontWeight: 'bold', fontSize: '1.2em' }}>
                          {weekRange}
                        </span>

                        <Button
                          icon
                          size='large' // Consistent button size
                          onClick={() => changeWeek(1)}
                          title="Next Week"
                          style={{ padding: '0.8em 1.5em' }} // Consistent padding for buttons
                        >
                          <Icon name='chevron right' size='large' /> {/* Consistent icon size */}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Day Navigation */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <Button
                          icon
                          size='large' // Consistent button size
                          onClick={() => changeDay(-1)}
                          title="Previous Day"
                          style={{ padding: '0.8em 1.5em' }} // Consistent padding for buttons
                        >
                          <Icon name='chevron left' size='large' /> {/* Consistent icon size */}
                        </Button>

                        <span style={{ margin: '0 20px', fontWeight: 'bold', fontSize: '1.2em' }}>
                          {selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>

                        <Button
                          icon
                          size='large' // Consistent button size
                          onClick={() => changeDay(1)}
                          title="Next Day"
                          style={{ padding: '0.8em 1.5em' }} // Consistent padding for buttons
                        >
                          <Icon name='chevron right' size='large' /> {/* Consistent icon size */}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Timesheet Table */}
                <Table celled selectable structured>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell style={{ fontSize: '1.2em', padding: '1em' }}>Project</Table.HeaderCell>
                      <Table.HeaderCell style={{ fontSize: '1.2em', padding: '1em' }}>Project Manager</Table.HeaderCell>
                      {viewMode === 'week' && days.map((day, index) => (
                        <Table.HeaderCell 
                          key={day.dayNumber} 
                          textAlign='center' 
                          style={{ 
                            fontSize: '1.1em', 
                            padding: '1em', 
                            position: 'relative', 
                            opacity: projects.some(p => p.isAvailable[index]) ? 1 : 0.5 
                          }}
                        >
                          <div>
                            {`${day.dayNumber} ${day.dayName}`}
                          </div>
                        </Table.HeaderCell>
                      ))}
                      {viewMode === 'day' && (
                        <Table.HeaderCell 
                          textAlign='center' 
                          style={{ 
                            fontSize: '1.1em', 
                            padding: '1em', 
                            opacity: projects.some(p => p.isAvailable[getCurrentDayIndex()]) ? 1 : 0.5 
                          }}
                        >
                          {`${selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                        </Table.HeaderCell>
                      )}
                      <Table.HeaderCell textAlign='center' style={{ fontSize: '1.2em', padding: '1em' }}>Total</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {projects.map(project => (
                      <React.Fragment key={project.id}>
                        <Table.Row>
                          <Table.Cell style={{ fontSize: '1.1em', padding: '1em' }}>{project.name}</Table.Cell>
                          <Table.Cell style={{ fontSize: '1.1em', padding: '1em' }}>{project.manager}</Table.Cell>
                          {viewMode === 'week' && days.map((day, index) => {
                            const cellApprovalStatus = project.approvalStatus[index];
                            const cellStatus = project.status[index];
                            
                            // Updated isDisabledInput to include status checks and 24-hour restriction
                            const isDisabledInput = !project.isAvailable[index] || 
                                                    (cellApprovalStatus === 'Submitted' || cellApprovalStatus === 'Approved') ||
                                                    (cellStatus === 'holiday' || cellStatus === 'leave');
                            
                            const isDisabledDropdown = !project.isAvailable[index] || 
                                                       (cellApprovalStatus === 'Submitted' || cellApprovalStatus === 'Approved');

                            const backgroundColor = getCellBackgroundColor(project, index);
                            // Removed allocationHours as max is now 24
                            // const maxHours = project.allocationHours[index];

                            return (
                              <Table.Cell 
                                key={index} 
                                textAlign='center' 
                                style={{ 
                                  fontSize: '1.1em', 
                                  padding: '1em',
                                  backgroundColor: backgroundColor,
                                  opacity: project.isAvailable[index] ? 1 : 0.5
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Input
                                    type='number'
                                    min='0'
                                    max='24' // Restricting to 24 hours
                                    step='1' // Whole hours
                                    value={project.hours[index]}
                                    onChange={(e) => handleHourChange(project.id, index, e.target.value)}
                                    onFocus={() => handleFocus(project.id, index)} // Clear on focus
                                    style={{ width: '80px', fontSize: '1em', marginRight: '5px' }}
                                    size='small'
                                    disabled={isDisabledInput} // Disable based on availability, approvalStatus, and status
                                  />
                                  {project.isAvailable[index] && (
                                    <Popup
                                      trigger={<Icon name='ellipsis vertical' size='small' style={{ cursor: 'pointer' }} />}
                                      on='click'
                                      position='top center'
                                      closeOnDocumentClick
                                      content={
                                        <div>
                                          <Dropdown
                                            selection
                                            options={getStatusOptions()}
                                            value={project.status[index]}
                                            onChange={(e, { value }) => handleStatusChange(project.id, index, value)}
                                            placeholder='Select Status'
                                            fluid
                                            disabled={isDisabledDropdown} // Dropdown remains enabled unless timesheet is submitted or approved
                                          />
                                        </div>
                                      }
                                    />
                                  )}
                                </div>
                              </Table.Cell>
                            );
                          })}
                          {viewMode === 'day' && (() => {
                            const dayIndex = getCurrentDayIndex();
                            const cellApprovalStatus = project.approvalStatus[dayIndex];
                            const cellStatus = project.status[dayIndex];
                            
                            // Updated isDisabledInput to include status checks and 24-hour restriction
                            const isDisabledInput = !project.isAvailable[dayIndex] || 
                                                    (cellApprovalStatus === 'Submitted' || cellApprovalStatus === 'Approved') ||
                                                    (cellStatus === 'holiday' || cellStatus === 'leave');
                            
                            const isDisabledDropdown = !project.isAvailable[dayIndex] || 
                                                       (cellApprovalStatus === 'Submitted' || cellApprovalStatus === 'Approved');

                            const backgroundColor = getCellBackgroundColor(project, dayIndex);
                            // Removed allocationHours as max is now 24
                            // const maxHours = project.allocationHours[dayIndex] || 8;

                            return (
                              <Table.Cell 
                                key={'day'}
                                textAlign='center' 
                                style={{ 
                                  fontSize: '1.1em', 
                                  padding: '1em',
                                  opacity: project.isAvailable[dayIndex] ? 1 : 0.5,
                                  backgroundColor: backgroundColor, // Apply background color here
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Input
                                    type='number'
                                    min='0'
                                    max='24' // Restricting to 24 hours
                                    step='1' // Whole hours
                                    value={project.hours[dayIndex]}
                                    onChange={(e) => handleHourChange(project.id, dayIndex, e.target.value)}
                                    onFocus={() => handleFocus(project.id, dayIndex)} // Clear on focus
                                    style={{ width: '80px', fontSize: '1em', marginRight: '5px', backgroundColor: '#f9f9f9' }}
                                    size='small' // Adjusted input size
                                    disabled={isDisabledInput} // Disable based on availability, approvalStatus, and status
                                  />
                                  {project.isAvailable[dayIndex] && (
                                    <Popup
                                      trigger={<Icon name='ellipsis vertical' size='small' style={{ cursor: 'pointer' }} />}
                                      on='click'
                                      position='top center'
                                      closeOnDocumentClick
                                      content={
                                        <div>
                                          <Dropdown
                                            selection
                                            options={getStatusOptions()}
                                            value={project.status[dayIndex]}
                                            onChange={(e, { value }) => handleStatusChange(project.id, dayIndex, value)}
                                            placeholder='Select Status'
                                            fluid
                                            disabled={isDisabledDropdown} // Dropdown remains enabled unless timesheet is submitted or approved
                                          />
                                        </div>
                                      }
                                    />
                                  )}
                                </div>
                              </Table.Cell>
                            );
                          })()}
                          <Table.Cell textAlign='center' style={{ fontSize: '1.1em', padding: '1em' }}>
                            {viewMode === 'week' 
                              ? (calculateTotal(project.hours) || 0).toFixed(0) // Remove decimal and handle undefined
                              : (parseFloat(project.hours[getCurrentDayIndex()]) || 0).toFixed(0)}
                          </Table.Cell>
                        </Table.Row>

                        {/* Comments Row */}
                        <Table.Row>
                          <Table.Cell colSpan={2} style={{ padding: '0.5em' }}></Table.Cell>
                          {viewMode === 'week' && days.map((day, index) => (
                            <Table.Cell key={index} textAlign='center' style={{ padding: '0.5em' }}>
                              <span>
                                {project.approvalStatus[index]} 
                                <Icon 
                                  name='eye' 
                                  onClick={() => handleViewComment(project.id, index)} 
                                  style={{ cursor: 'pointer', marginLeft: '5px' }} 
                                  title="View Comment"
                                />
                              </span>
                            </Table.Cell>
                          ))}
                          {viewMode === 'day' && (
                            <Table.Cell textAlign='center' style={{ padding: '0.5em' }}>
                              <span>
                                {project.approvalStatus[getCurrentDayIndex()]} 
                                <Icon 
                                  name='eye' 
                                  onClick={() => handleViewComment(project.id, getCurrentDayIndex())} 
                                  style={{ cursor: 'pointer', marginLeft: '5px' }} 
                                  title="View Comment"
                                />
                              </span>
                            </Table.Cell>
                          )}
                          <Table.Cell style={{ padding: '0.5em' }}></Table.Cell>
                        </Table.Row>
                      </React.Fragment>
                    ))}

                    {/* Weekly or Daily Total Row */}
                    <Table.Row>
                      <Table.Cell colSpan={2} textAlign='center' style={{ fontSize: '1.2em', padding: '1em' }}>
                        <strong>{viewMode === 'week' ? 'Daily Total' : 'Total'}</strong>
                      </Table.Cell>
                      {viewMode === 'week' && days.map((day, index) => (
                        <Table.Cell 
                          key={index} 
                          textAlign='center' 
                          style={{ 
                            fontSize: '1.1em', 
                            padding: '1em',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <strong>{(calculateDailyTotal(index) || 0).toFixed(1)}</strong> {/* One decimal */}
                        </Table.Cell>
                      ))}
                      {viewMode === 'day' && (
                        <Table.Cell 
                          textAlign='center' 
                          style={{ 
                            fontSize: '1.1em', 
                            padding: '1em',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <strong>{projects.reduce((sum, project) => {
                            const value = parseFloat(project.hours[getCurrentDayIndex()]) || 0;
                            return sum + value;
                          }, 0).toFixed(1)}</strong> {/* One decimal */}
                        </Table.Cell>
                      )}
                      <Table.Cell textAlign='center' style={{ fontSize: '1.2em', padding: '1em' }}>
                        <strong>
                          {viewMode === 'week' 
                            ? (projects.reduce((sum, project) => sum + calculateTotal(project.hours), 0) || 0).toFixed(1) 
                            : (projects.reduce((sum, project) => {
                                const value = parseFloat(project.hours[getCurrentDayIndex()]) || 0;
                                return sum + value;
                              }, 0) || 0).toFixed(1)}
                        </strong>
                      </Table.Cell>
                    </Table.Row>


                    {/* Comments for Total Row */}
                    <Table.Row>
                      <Table.Cell colSpan={viewMode === 'week' ? '2' : '2'} style={{ padding: '0.5em' }}></Table.Cell>
                      {viewMode === 'week' && days.map((day, index) => (
                        <Table.Cell key={index} textAlign='center' style={{ padding: '0.5em', fontStyle: 'italic', color: '#555' }}>
                          {/* Customize as needed */}
                          {`Total for ${day.dayName}`}
                        </Table.Cell>
                      ))}
                      {viewMode === 'day' && (
                        <Table.Cell textAlign='center' style={{ padding: '0.5em', fontStyle: 'italic', color: '#555' }}>
                          {/* Customize as needed */}
                          {'Total hours for the day'}
                        </Table.Cell>
                      )}
                      <Table.Cell style={{ padding: '0.5em' }}></Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <Button 
                    icon={<IoMdClose size={24} />} // Discard Icon
                    onClick={handleDiscard} 
                    title="Discard Changes"
                    disabled={loading} // Disable when loading
                  />
                  <Button
                    style={{ backgroundColor: 'green', color: 'white', marginLeft: '10px' }}
                    icon={<MdCheck size={24} />}
                    onClick={handleSubmit}
                    title="Submit Timesheet"
                    disabled={loading} // Disable when loading
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size='small'
      >
        <Modal.Header>View Comment</Modal.Header>
        <Modal.Content>
          {commentToView ? (
            <div>
              <p><strong>Project:</strong> {commentToView.projectName}</p>
              <p><strong>Date:</strong> {commentToView.date ? new Date(commentToView.date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Comment:</strong></p>
              <p>{commentToView.comment || 'No comments available.'}</p>
            </div>
          ) : (
            <p>No comment available.</p>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </Modal.Actions>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default EmployeeTimesheetView;

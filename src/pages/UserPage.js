import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Header,
  Grid,
  Segment,
  Table,
  Button,
  Accordion,
  Icon,
  Label,
  Input,
  Checkbox,
  Loader,
  Dimmer,
  Message,
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import axios from 'axios'; // Using axios for HTTP requests
import { ProfileContext } from '../context/ProfileContext';
import config from "../Config.json";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Approval Status Mapping
const APPROVAL_STATUS = {
  0: "Not Submitted",
  1: "Submitted",
  2: "Approved",
  3: "Rejected",
};

// Color Mapping for Approval Status
const APPROVAL_STATUS_COLOR = {
  0: "grey",      // Not Submitted
  1: "yellow",    // Submitted
  2: "green",     // Approved
  3: "red",       // Rejected
};

// Helper function to get ordinal suffix for dates
const getOrdinalSuffix = (date) => {
  const j = date % 10,
        k = date % 100;
  if (j === 1 && k !== 11) {
    return date + "st";
  }
  if (j === 2 && k !== 12) {
    return date + "nd";
  }
  if (j === 3 && k !== 13) {
    return date + "rd";
  }
  return date + "th";
};

// Helper function to format dates
const formatDate = (date) => {
  const day = getOrdinalSuffix(date.getDate());
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
};

// Updated Helper function to calculate start and end dates of the week based on weekOffset, assuming week starts on Sunday
const getWeekDateRange = (weekOffset) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Week starts on Sunday
  const diffToSunday = -currentDay;
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + diffToSunday + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { startDate: startOfWeek, endDate: endOfWeek };
};

const ManagerView = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [managerDetails, setManagerDetails] = useState(null); // State for manager details
  const [employeeData, setEmployeeData] = useState(null); // State for employee details and clients
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeAccordionIndex, setActiveAccordionIndex] = useState(-1);
  const [timesheetComments, setTimesheetComments] = useState({});
  const [selectedTimesheets, setSelectedTimesheets] = useState({}); // { employeeId: Set(guidId) }
  const [employees, setEmployees] = useState([]); // Manage employees in state
  const [sortConfig, setSortConfig] = useState({}); // { employeeId: { column: 'columnName', direction: 'ascending' | 'descending' } }
  const [filter, setFilter] = useState('all'); // Filter state
  const [weekOffset, setWeekOffset] = useState(0); // New state for week offset
  const profile = useContext(ProfileContext); // Access ProfileContext

  // Set current date
  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);
  }, []);

  // Fetch manager's projects based on email and weekOffset
  useEffect(() => {
    fetchManagerProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.userPrincipalName, config.azureApiUrl, weekOffset]);

  // Fetch employees based on selected project and weekOffset
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, managerDetails, config.azureApiUrl, weekOffset]);

  // Function to fetch manager projects
  const fetchManagerProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Retrieve the email from ProfileContext
      const managerEmail = profile.userPrincipalName; // Adjust this based on how email is stored in ProfileContext
      if (!managerEmail) {
        throw new Error("User email is not available.");
      }

      // Get the week date range
      const { startDate, endDate } = getWeekDateRange(weekOffset);

      console.log(`Fetching manager projects for email: ${managerEmail}, Week Offset: ${weekOffset} (${formatDate(startDate)} to ${formatDate(endDate)})`);

      const response = await axios.get(`${config.azureApiUrl}/api/getManagerProjects/`, {
        params: { email: managerEmail, weekOffset } // Pass weekOffset here
      });

      if (response.data.status) {
        setEmployeeData(response.data.data);
        setSelectedClientId(response.data.data.clients[0]?.ClientID || null); // Select the first client by default
        setManagerDetails(response.data.data.employeeDetails); // Set manager details
      } else {
        throw new Error(response.data.message || "Failed to retrieve data.");
      }

    } catch (err) {
      console.error('Error fetching manager projects:', err);
      setError(err.message || 'Failed to load data.');
      toast.error(`Error fetching manager projects: ${err.message || 'Failed to load data.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch employees
  const fetchEmployees = async () => {
    if (selectedProjectId && managerDetails) {
      try {
        setLoading(true);
        setError(null);

        // Manager's EmployeeId
        const managerEmployeeId = managerDetails.EmployeeId;
        if (!managerEmployeeId) {
          throw new Error("Manager EmployeeId is not available.");
        }

        // Get the week date range
        const { startDate, endDate } = getWeekDateRange(weekOffset);

        console.log(`Fetching timesheet data for Manager ID: ${managerEmployeeId}, Project ID: ${selectedProjectId}, Week Offset: ${weekOffset} (${formatDate(startDate)} to ${formatDate(endDate)})`);

        // API Endpoint: /api/timesheet/approver/{employeeId}/project/{projectId}
        const endpoint = `${config.azureApiUrl}/api/timesheet/approver/${managerEmployeeId}/project/${selectedProjectId}`;

        const response = await axios.get(endpoint, {
          params: { weekOffset } // Pass weekOffset here
        });

        if (response.status === 200) {
          const fetchedEmployees = response.data.employees; // Adjust based on your API response structure

          // Map API response to frontend state
          const mappedEmployees = fetchedEmployees.map(emp => ({
            id: emp.EmployeeId, // Use EmployeeId as unique identifier
            employeeId: emp.EmployeeId,
            name: emp.EmployeeName,
            email: emp.EmployeeEmail,
            role: emp.EmployeeRole,
            workingStatus: emp.EmployeeKekaStatus, // Assuming KekaStatus corresponds to workingStatus
            contractType: emp.EmployeeContractType,
            allocatedHours: emp.allocatedHours,
            workedHours: emp.workedHours,
            workedPercentage: emp.workedPercentage,
            holidays: emp.holidays,
            leaves: emp.leaves,
            timesheet: emp.timesheet.map(entry => ({
              guidId: entry.guidId, // Use guidId from backend
              allocationId: entry.AllocationID, // Ensure this is mapped correctly
              date: entry.TimesheetDate,
              allocatedHours: entry.AllocationHours,
              workedHours: parseFloat(entry.TimesheetHours), // Convert to number
              approvalStatus: entry.ApprovalStatus,
              holiday: entry.OnHoliday ? 1 : 0,
              leave: entry.OnLeave ? 1 : 0,
              comment: entry.TimesheetApproverComments || '',
              allocationPercentage: entry.AllocationPercentage,
              allocationStatus: entry.AllocationStatus,
            })),
          }));

          setEmployees(mappedEmployees);
        } else {
          throw new Error("Failed to retrieve employee data.");
        }

      } catch (error) {
        console.error('Error fetching employee data:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load employee data.');
        toast.error(`Error fetching employee data: ${error.response?.data?.error || error.message || 'Failed to load employee data.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle week toggle with chevron buttons
  const handleWeekToggle = (direction) => {
    setWeekOffset(prev => prev + direction);
  };

  // Color scheme for project status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'On Hold':
        return 'purple';
      case 'In Progress':
        return 'yellow';
      default:
        return '';
    }
  };

  // Handle accordion click for Employee Table
  const handleAccordionClick = (index) => {
    setActiveAccordionIndex(activeAccordionIndex === index ? -1 : index);
  };

  // Handle comment changes in timesheet
  const handleCommentChange = (employeeId, guidId, value) => {
    setTimesheetComments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [guidId]: value,
      },
    }));
  };

  // Function to get default comment based on action
  const getDefaultComment = (action) => {
    switch (action) {
      case 'Approve':
        return 'Your timesheet for the date has been Approved.';
      case 'Reject':
        return 'Your timesheet for the date has been Rejected.';
      case 'Resubmit':
        return 'Your timesheet should be Resubmitted for the date.';
      default:
        return '';
    }
  };

  // Handle timesheet actions (single)
  const handleTimesheetAction = async (action, employeeId, guidId) => {
    try {
      const comment = timesheetComments[employeeId]?.[guidId] || getDefaultComment(action);
      
      // Prepare payload
      const payload = {
        action,
        guidIds: [guidId], // Single GUIDID in an array
        comments: { [guidId]: comment },
      };

      // API Endpoint: /api/updateTimesheetStatus
      const response = await axios.post(`${config.azureApiUrl}/api/updateTimesheetStatus`, payload);

      if (response.data.status) {
        // Refetch employees data to reflect updates
        await fetchEmployees();
        toast.success(`Timesheet ${action.toLowerCase()}d successfully.`);
      } else {
        throw new Error(response.data.message || "Action failed.");
      }
    } catch (error) {
      console.error('Error performing timesheet action:', error);
      toast.error(`Error performing action: ${error.response?.data?.error || error.message || 'Failed to perform action.'}`);
    }
  };

  // Handle bulk actions for employees
  const handleEmployeeAction = async (action, employeeId) => {
    const selectedAllocations = selectedTimesheets[employeeId];
    if (!selectedAllocations || selectedAllocations.size === 0) {
      toast.warning('Please select at least one timesheet entry to perform this action.');
      return;
    }

    try {
      // Prepare comments for each GUIDID
      const comments = {};
      selectedAllocations.forEach(guidId => {
        comments[guidId] = timesheetComments[employeeId]?.[guidId] || getDefaultComment(action);
      });

      // Prepare payload
      const payload = {
        action,
        guidIds: Array.from(selectedAllocations),
        comments,
      };

      // API Endpoint: /api/updateTimesheetStatus
      const response = await axios.post(`${config.azureApiUrl}/api/updateTimesheetStatus`, payload);

      if (response.data.status) {
        // Refetch employees data to reflect updates
        await fetchEmployees();
        toast.success(`Selected timesheets ${action.toLowerCase()}d successfully.`);
      } else {
        throw new Error(response.data.message || "Bulk action failed.");
      }

      // Reset selected timesheets after action
      setSelectedTimesheets((prev) => ({
        ...prev,
        [employeeId]: new Set(),
      }));
    } catch (error) {
      console.error('Error performing bulk employee action:', error);
      toast.error(`Error performing bulk action: ${error.response?.data?.error || error.message || 'Failed to perform bulk action.'}`);
    }
  };

  // Render working status label with colors
  const renderWorkingStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Label color="green" style={{ borderRadius: "12px" }}>Active</Label>;
      case "in-active":
        return <Label color="orange" style={{ borderRadius: "12px" }}>In-Active</Label>;
      case "closed":
        return <Label color="grey" style={{ borderRadius: "12px" }}>Closed</Label>;
      default:
        return <Label color="grey" style={{ borderRadius: "12px" }}>{status}</Label>;
    }
  };

  // Handle parent checkbox toggle for an employee
  const handleParentCheckbox = (employeeId, checked) => {
    setSelectedTimesheets((prev) => {
      const updated = { ...prev };
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return updated;

      // Filter timesheet entries based on current filter
      const filteredTimesheets = filter === 'all' ? employee.timesheet :
        employee.timesheet.filter(entry => {
          const statuses = getApprovalStatusesForFilter(filter);
          return statuses ? statuses.includes(entry.approvalStatus) : true;
        });

      if (checked) {
        const allGuidIds = new Set(filteredTimesheets.map(entry => entry.guidId));
        updated[employeeId] = allGuidIds;
      } else {
        updated[employeeId] = new Set();
      }
      return updated;
    });
  };

  // Handle child checkbox toggle for a timesheet entry
  const handleChildCheckbox = (employeeId, guidId, checked) => {
    setSelectedTimesheets((prev) => {
      const updated = { ...prev };
      if (!updated[employeeId]) {
        updated[employeeId] = new Set();
      }
      if (checked) {
        updated[employeeId].add(guidId);
      } else {
        updated[employeeId].delete(guidId);
      }
      return updated;
    });
  };

  // Handle sorting for timesheet tables
  const handleSort = (employeeId, column) => {
    setSortConfig((prev) => {
      const currentSort = prev[employeeId] || { column: null, direction: 'ascending' };
      let direction = 'ascending';
      if (currentSort.column === column && currentSort.direction === 'ascending') {
        direction = 'descending';
      }
      return {
        ...prev,
        [employeeId]: { column, direction },
      };
    });
  };

  // Map filter to approvalStatus
  const getApprovalStatusesForFilter = (filter) => {
    switch (filter) {
      case 'submitted':
        return [1]; // Submitted
      case 'not-submitted':
        return [0]; // Not Submitted
      case 'approved':
        return [2]; // Approved
      case 'rejected':
        return [3]; // Rejected
      default:
        return null; // All
    }
  };

  // Sort timesheet entries based on sortConfig
  const getSortedTimesheet = (employeeId, timesheet) => {
    const config = sortConfig[employeeId];
    if (!config || !config.column) return timesheet;

    const sorted = [...timesheet].sort((a, b) => {
      let aVal = a[config.column];
      let bVal = b[config.column];

      // Handle numeric and date sorting
      if (config.column === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (['allocatedHours', 'workedHours', 'holiday', 'leave', 'allocationPercentage'].includes(config.column)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (config.column === 'allocationStatus') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      } else {
        // For string comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) {
        return config.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return config.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSelectedTimesheets({}); // Reset selections when filter changes
    setActiveAccordionIndex(-1); // Close all accordions when filter changes
  };

  // Apply filtering to employees based on the selected filter
  const filteredEmployees = employees.filter(employee => {
    if (filter === 'all') return true;
    const statusesToMatch = getApprovalStatusesForFilter(filter);
    if (!statusesToMatch) return true;
    return employee.timesheet.some(entry => statusesToMatch.includes(entry.approvalStatus));
  });

  // Determine available actions at the employee (parent) level
  const getAvailableActionsForEmployee = (employee) => {
    const uniqueStatuses = new Set(employee.timesheet.map(entry => entry.approvalStatus));

    if (uniqueStatuses.size !== 1) {
      // Mixed statuses
      return [];
    }

    const status = [...uniqueStatuses][0];

    switch (status) {
      case 0: // Not Submitted
        return [];
      case 1: // Submitted
        return ['Approve', 'Reject'];
      case 2: // Approved
        return ['Resubmit'];
      case 3: // Rejected
        return ['Resubmit'];
      default:
        return [];
    }
  };

  const selectedClient = employeeData?.clients.find(client => client.ClientID === selectedClientId);

  return (
    <Container fluid>
      <div className="main-layout">
        <div className='right-content'>
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />

          {/* Greeting Section */}
          <div className='top-content'>
            <div className='greeting'>
              <Header as='h1'>Hello {profile.displayName},</Header>
              <Header as='h2'>{currentDate}</Header>
            </div>
          </div>

          {/* Week Toggle Buttons with Date Range Display */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button 
              icon 
              onClick={() => handleWeekToggle(-1)}
              aria-label="Previous Week"
            >
              <Icon name='chevron left' />
            </Button>
            
            <Header as='h3' style={{ margin: '0 15px' }}>
              {formatDate(getWeekDateRange(weekOffset).startDate)} to {formatDate(getWeekDateRange(weekOffset).endDate)}
            </Header>
            
            <Button 
              icon 
              onClick={() => handleWeekToggle(1)}
              disabled={weekOffset >= 1}
              aria-label="Next Week"
            >
              <Icon name='chevron right' />
            </Button>
          </div>

          {/* Display Selected Week Range from API (if backend provides) */}
          {!loading && !error && employeeData && employeeData.weekRange && (
            <Segment>
              <Header as='h4'>
                Selected Week: {formatDate(new Date(employeeData.weekRange.startDate))} to {formatDate(new Date(employeeData.weekRange.endDate))}
              </Header>
            </Segment>
          )}

          {/* Loading Indicator */}
          {loading && (
            <Segment>
              <Dimmer active inverted>
                <Loader>Loading</Loader>
              </Dimmer>
              <div style={{ height: '100px' }}></div> {/* Spacer to accommodate the loader */}
            </Segment>
          )}

          {/* Error Message */}
          {error && (
            <Segment>
              <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{error}</p>
              </Message>
            </Segment>
          )}

          {/* Client and Project Selection */}
          {!loading && !error && employeeData && (
            <Grid columns={2} divided className="client-project-container">
              <Grid.Row stretched>
                {/* Client Details */}
                <Grid.Column width={5}>
                  <Segment className="client-details-table" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Header as='h3'>Client Details</Header>
                    <Table selectable>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell style={{ width: '30%' }}>Client ID</Table.HeaderCell>
                          <Table.HeaderCell style={{ width: '70%' }}>Client Name</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {employeeData.clients.map((client) => (
                          <Table.Row
                            key={client.ClientID}
                            onClick={() => {
                              setSelectedClientId(client.ClientID);
                              setSelectedProjectId(null);
                              setSelectedTimesheets({});
                              setFilter('all'); // Reset filter when client changes
                            }}
                            active={client.ClientID === selectedClientId}
                            style={{ cursor: 'pointer' }}
                          >
                            <Table.Cell>{client.ClientID}</Table.Cell>
                            <Table.Cell>{client.ClientName}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Segment>
                </Grid.Column>

                {/* Project Details */}
                <Grid.Column width={11}>
                  <Segment className="project-details-table">
                    <Header as='h3'>
                      Project Details for {selectedClient ? selectedClient.ClientName : 'Select a Client'}
                    </Header>
                    {selectedClient && selectedClient.Projects.length > 0 ? (
                      <Table selectable>
                        <Table.Header>
                          <Table.Row>
                            <Table.HeaderCell>Project</Table.HeaderCell>
                            <Table.HeaderCell>Status</Table.HeaderCell>
                            <Table.HeaderCell>Project Manager</Table.HeaderCell>
                            <Table.HeaderCell>Start Date</Table.HeaderCell>
                            <Table.HeaderCell>End Date</Table.HeaderCell>
                            <Table.HeaderCell>Headcount</Table.HeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {selectedClient.Projects.map((project) => (
                            <Table.Row
                              key={project.ProjectID}
                              onClick={() => setSelectedProjectId(project.ProjectID)}
                              active={project.ProjectID === selectedProjectId}
                              style={{ cursor: 'pointer' }}
                            >
                              <Table.Cell>{project.ProjectName}</Table.Cell>
                              <Table.Cell>
                                <Label color={getStatusColor(project.ProjectStatus)}>
                                  {project.ProjectStatus}
                                </Label>
                              </Table.Cell>
                              <Table.Cell>{project.ProjectManager}</Table.Cell>
                              <Table.Cell>
                                {project.ProjectStartDate
                                  ? new Date(project.ProjectStartDate).toLocaleDateString()
                                  : '-'}
                              </Table.Cell>
                              <Table.Cell>
                                {project.ProjectEndDate
                                  ? new Date(project.ProjectEndDate).toLocaleDateString()
                                  : '-'}
                              </Table.Cell>
                              <Table.Cell>{project.Headcount}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    ) : (
                      <p>No projects found for this client.</p>
                    )}
                  </Segment>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          )}

          {/* Employee Allocation Table */}
          {!loading && !error && selectedProjectId && (
            <Segment className="employee-allocation-table" style={{ marginTop: '20px', borderRadius: '12px' }}>
              <Header as='h3'>Employee Allocations for Project ID: {selectedProjectId}</Header>

              {/* Filter Tabs */}
              <div className="filter-tabs" style={{ marginBottom: '10px' }}>
                <Button.Group>
                  <Button
                    active={filter === 'all'}
                    onClick={() => handleFilterChange('all')}
                  >
                    All
                  </Button>
                  <Button
                    active={filter === 'submitted'}
                    onClick={() => handleFilterChange('submitted')}
                  >
                    Submitted
                  </Button>
                  <Button
                    active={filter === 'not-submitted'}
                    onClick={() => handleFilterChange('not-submitted')}
                  >
                    Not Submitted
                  </Button>
                  <Button
                    active={filter === 'approved'}
                    onClick={() => handleFilterChange('approved')}
                  >
                    Approved
                  </Button>
                  <Button
                    active={filter === 'rejected'}
                    onClick={() => handleFilterChange('rejected')}
                  >
                    Rejected
                  </Button>
                </Button.Group>
              </div>

              <Table celled selectable compact="very" style={{ width: '100%', borderRadius: "12px" }}>
                <Table.Header>
                  <Table.Row>
                    {/* Parent Checkbox Header */}
                    <Table.HeaderCell />
                    <Table.HeaderCell>Employee ID</Table.HeaderCell>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Email</Table.HeaderCell>
                    <Table.HeaderCell>Role</Table.HeaderCell>
                    <Table.HeaderCell>Working Status</Table.HeaderCell>
                    <Table.HeaderCell>Contract Type</Table.HeaderCell>
                    <Table.HeaderCell>Allocated Hours</Table.HeaderCell>
                    <Table.HeaderCell>Worked Hours</Table.HeaderCell>
                    <Table.HeaderCell>Worked %</Table.HeaderCell>
                    <Table.HeaderCell>Holidays</Table.HeaderCell>
                    <Table.HeaderCell>Leaves</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee, index) => {
                      // Determine available actions for the employee
                      const availableActions = getAvailableActionsForEmployee(employee);

                      return (
                        <React.Fragment key={employee.id}>
                          <Table.Row>
                            {/* Parent Checkbox */}
                            <Table.Cell>
                              <Checkbox
                                checked={
                                  selectedTimesheets[employee.id]?.size === employee.timesheet.filter(entry => {
                                    const statuses = getApprovalStatusesForFilter(filter);
                                    return statuses ? statuses.includes(entry.approvalStatus) : true;
                                  }).length
                                }
                                indeterminate={
                                  selectedTimesheets[employee.id]?.size > 0 &&
                                  selectedTimesheets[employee.id]?.size < employee.timesheet.filter(entry => {
                                    const statuses = getApprovalStatusesForFilter(filter);
                                    return statuses ? statuses.includes(entry.approvalStatus) : true;
                                  }).length
                                }
                                onChange={(e, { checked }) => handleParentCheckbox(employee.id, checked)}
                              />
                            </Table.Cell>
                            {/* Employee Details */}
                            <Table.Cell>{employee.employeeId}</Table.Cell>
                            <Table.Cell>{employee.name}</Table.Cell>
                            <Table.Cell>{employee.email}</Table.Cell>
                            <Table.Cell>{employee.role}</Table.Cell>
                            <Table.Cell>{renderWorkingStatusLabel(employee.workingStatus)}</Table.Cell>
                            <Table.Cell>{employee.contractType}</Table.Cell>
                            {/* Allocation Metrics */}
                            <Table.Cell>{employee.allocatedHours}</Table.Cell>
                            <Table.Cell>{employee.workedHours}</Table.Cell>
                            <Table.Cell>{employee.workedPercentage}%</Table.Cell>
                            <Table.Cell>{employee.holidays}</Table.Cell>
                            <Table.Cell>{employee.leaves}</Table.Cell>
                            <Table.Cell>
                              {availableActions.map((action) => (
                                <Button
                                  key={action}
                                  color={
                                    action === 'Approve' ? 'green' :
                                    action === 'Reject' ? 'red' :
                                    action === 'Resubmit' ? 'blue' : 'grey'
                                  }
                                  icon
                                  size="small"
                                  onClick={() => handleEmployeeAction(action, employee.id)}
                                  title={action}
                                  disabled={availableActions.length === 0}
                                  style={{ marginRight: '5px' }}
                                >
                                  {action === 'Approve' && <Icon name="check" style={{ color: 'white' }} />}
                                  {action === 'Reject' && <Icon name="remove" style={{ color: 'white' }} />}
                                  {action === 'Resubmit' && <Icon name="refresh" style={{ color: 'white' }} />}
                                </Button>
                              ))}
                            </Table.Cell>
                          </Table.Row>

                          {/* Timesheet Details Accordion */}
                          <Table.Row>
                            <Table.Cell colSpan="13" style={{ padding: "0" }}>
                              <Accordion fluid styled>
                                <Accordion.Title
                                  active={activeAccordionIndex === index}
                                  index={index}
                                  onClick={() => handleAccordionClick(index)}
                                  style={{ paddingLeft: "1.5em" }}
                                >
                                  <Icon name="dropdown" />
                                  View Timesheet Details
                                </Accordion.Title>
                                <Accordion.Content active={activeAccordionIndex === index}>
                                  <Table celled size="small" compact>
                                    <Table.Header>
                                      <Table.Row>
                                        {/* Child Checkbox Header */}
                                        <Table.HeaderCell />
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'allocationId'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'allocationId')}
                                        >
                                          Allocation ID
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'date'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'date')}
                                        >
                                          Date
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'allocatedHours'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'allocatedHours')}
                                        >
                                          Allocated Hours
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'workedHours'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'workedHours')}
                                        >
                                          Worked Hours
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'approvalStatus'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'approvalStatus')}
                                        >
                                          Approval Status
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'holiday'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'holiday')}
                                        >
                                          Holiday
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                          sorted={
                                            sortConfig[employee.id]?.column === 'leave'
                                              ? sortConfig[employee.id].direction
                                              : null
                                          }
                                          onClick={() => handleSort(employee.id, 'leave')}
                                        >
                                          Leave
                                        </Table.HeaderCell>
                                        <Table.HeaderCell>Allocation %</Table.HeaderCell> {/* New Column */}
                                        <Table.HeaderCell>Allocation Status</Table.HeaderCell> {/* New Column */}
                                        <Table.HeaderCell>Comment</Table.HeaderCell>
                                        <Table.HeaderCell>Actions</Table.HeaderCell>
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      {getSortedTimesheet(employee.id, 
                                        filter === 'all' ? employee.timesheet :
                                        employee.timesheet.filter(entry => {
                                          const statuses = getApprovalStatusesForFilter(filter);
                                          return statuses ? statuses.includes(entry.approvalStatus) : true;
                                        })
                                      ).map((entry) => {
                                        // Determine available actions for the timesheet entry
                                        let entryActions = [];
                                        switch (entry.approvalStatus) {
                                          case 0: // Not Submitted
                                            entryActions = [];
                                            break;
                                          case 1: // Submitted
                                            entryActions = ['Approve', 'Reject'];
                                            break;
                                          case 2: // Approved
                                            entryActions = ['Resubmit'];
                                            break;
                                          case 3: // Rejected
                                            entryActions = ['Resubmit'];
                                            break;
                                          default:
                                            entryActions = [];
                                        }

                                        return (
                                          <Table.Row key={entry.guidId}> {/* Use guidId as key */}
                                            {/* Child Checkbox */}
                                            <Table.Cell>
                                              <Checkbox
                                                checked={selectedTimesheets[employee.id]?.has(entry.guidId)}
                                                onChange={(e, { checked }) =>
                                                  handleChildCheckbox(employee.id, entry.guidId, checked)
                                                }
                                              />
                                            </Table.Cell>
                                            {/* Timesheet Details */}
                                            <Table.Cell>{entry.allocationId}</Table.Cell> {/* Updated to use allocationId */}
                                            <Table.Cell>{formatDate(new Date(entry.date))}</Table.Cell>
                                            <Table.Cell>{entry.allocatedHours}</Table.Cell>
                                            <Table.Cell>{entry.workedHours}</Table.Cell>
                                            <Table.Cell>
                                              <Label color={APPROVAL_STATUS_COLOR[entry.approvalStatus]}>
                                                {APPROVAL_STATUS[entry.approvalStatus]}
                                              </Label>
                                            </Table.Cell>
                                            <Table.Cell>{entry.holiday}</Table.Cell>
                                            <Table.Cell>{entry.leave}</Table.Cell>
                                            <Table.Cell>{entry.allocationPercentage}%</Table.Cell> {/* Allocation % */}
                                            <Table.Cell>{entry.allocationStatus}</Table.Cell> {/* Allocation Status */}
                                            <Table.Cell>
                                              <Input
                                                placeholder="Add comment..."
                                                value={
                                                  (timesheetComments[employee.id] &&
                                                    timesheetComments[employee.id][entry.guidId]) ||
                                                  entry.comment || ''
                                                }
                                                onChange={(e) =>
                                                  handleCommentChange(employee.id, entry.guidId, e.target.value)
                                                }
                                              />
                                            </Table.Cell>
                                            <Table.Cell>
                                              {entryActions.map((action) => (
                                                <Button
                                                  key={action}
                                                  color={
                                                    action === 'Approve' ? 'green' :
                                                    action === 'Reject' ? 'red' :
                                                    action === 'Resubmit' ? 'blue' : 'grey'
                                                  }
                                                  icon
                                                  size="small"
                                                  onClick={() => handleTimesheetAction(action, employee.id, entry.guidId)}
                                                  title={action}
                                                  style={{ marginRight: '5px' }}
                                                >
                                                  {action === 'Approve' && <Icon name="check" style={{ color: 'white' }} />}
                                                  {action === 'Reject' && <Icon name="remove" style={{ color: 'white' }} />}
                                                  {action === 'Resubmit' && <Icon name="refresh" style={{ color: 'white' }} />}
                                                </Button>
                                              ))}
                                            </Table.Cell>
                                          </Table.Row>
                                        );
                                      })}
                                    </Table.Body>
                                  </Table>
                                </Accordion.Content>
                              </Accordion>
                            </Table.Cell>
                          </Table.Row>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan="13" textAlign="center">
                        No employees found for this project with the selected filter.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </Segment>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ManagerView;

import React, { useEffect, useState, useContext, useRef} from 'react';
import { Table, Icon, Input, Button, Message, Dropdown, Checkbox } from 'semantic-ui-react';
import ViewCard from '../../components/ViewCards/Viewcard';
import { useNavigate } from 'react-router-dom';
import './BizopsDashboard.css';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { ProfileContext } from '../../context/ProfileContext';
import config from "../../Config.json";
import AllocationsTableUpload from '../../components/ExcelPreviewModal/AllocationsTableUpload'; // Adjust the path as necessary
import { convertExcelDateToJSDate } from '../../utils/dateUtils'; // Adjust the path as necessary

// Column Labels Mapping
const columnLabels = {
  'AllocationID': 'Allocation ID',
  'EmployeeID': 'Employee ID',
  'EmployeeName': 'Employee Name',
  'EmployeeLocation': 'Employee Location',
  'EmployeeContractType': 'Contract Type',
  'EmployeeJoiningDate': 'Joining Date',
  'EmployeeEndingDate': 'Ending Date',
  'EmployeeStudio': 'Studio',
  'EmployeeSubStudio': 'Sub Studio',
  'EmployeeRole': 'Role',
  'EmployeeTYOE': 'Type of Employment',
  'EmployeeKekaStatus': 'RMSStatus',
  'ClientID': 'Client ID',
  'ClientName': 'Client Name',
  'ClientPartner': 'Client Partner',
  'ProjectID': 'Project ID',
  'ProjectName': 'Project Name',
  'ProjectManager': 'Project Manager',
  'AllocationStatus': 'Allocation Status',
  'AllocationPercent': 'Allocation %',
  'AllocationBillingType': 'Billing Type',
  'AllocationBilledCheck': 'Billed Check',
  'AllocationBillingRate': 'Billing Rate',
  'AllocationTimeSheetApprover': 'Timesheet Approver',
  'AllocationTimeSheetApproverID': 'Timesheet Approver ID', // New mapping
  'AllocationStartDate': 'Start Date',
  'AllocationEndDate': 'End Date',
  'ModifiedBy': 'Modified By',
  'ModifiedAt': 'Modified At'
};

// Helper function to generate page numbers with ellipsis
const generatePageNumbers = (totalPages, currentPage) => {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first two pages
    pages.push(1, 2);

    if (currentPage > 4) {
      pages.push('ellipsis1');
    }

    const start = Math.max(3, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push('ellipsis2');
    }

    // Always show last two pages
    pages.push(totalPages - 1, totalPages);
  }

  return pages;
};

// Updated ColumnToggle component with multiple selection capability
const ColumnToggle = ({ columns, visibleColumns, onToggle }) => {
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (visibleColumns.length === columns.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [visibleColumns, columns.length]);

  const handleSelectAll = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from closing
    if (selectAll) {
      onToggle('deselectAll');
    } else {
      onToggle('selectAll');
    }
    // No need to manually toggle selectAll here as useEffect handles it based on visibleColumns
  };

  const handleCheckboxChange = (e, column) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from closing
    onToggle(column);
  };

  return (
    <Dropdown
      text='Toggle Columns'
      icon='columns'
      floating
      labeled
      button
      className='icon'
      aria-label="Toggle Columns Dropdown"
      closeOnChange={false} // Prevent dropdown from closing on change
      closeOnBlur={false}   // Prevent dropdown from closing on blur
    >
      <Dropdown.Menu style={{ 
        maxHeight: '300px',  // Set your desired height
        overflowY: 'auto',    // Enable vertical scrollbar
        overflowX: 'hidden',  // Prevent horizontal scrollbar
      }}>
        {/* Select All / Deselect All Option */}
        <Dropdown.Item as='div' onClick={handleSelectAll}>
          <Checkbox
            label={selectAll ? 'Deselect All' : 'Select All'}
            checked={selectAll}
            onChange={handleSelectAll}
            toggle
            style={{ marginRight: '10px' }}
            aria-label={selectAll ? 'Deselect All Columns' : 'Select All Columns'}
          />
        </Dropdown.Item>
        <Dropdown.Divider />
        {/* Individual Column Toggles */}
        {columns.map(column => (
          <Dropdown.Item as='div' key={column}>
            <Checkbox
              label={columnLabels[column] || column}
              checked={visibleColumns.includes(column)}
              onChange={(e) => handleCheckboxChange(e, column)}
              style={{ marginRight: '10px' }}
              aria-label={`Toggle ${columnLabels[column] || column} Column`}
            />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

const BizopsDashboard = () => {
  
  const { displayName } = useContext(ProfileContext);
  const navigate = useNavigate();

  // State variables for counts
  const [todo, setTodo] = useState(0); // Unallocated Employees
  const [draft, setDraft] = useState(0); // Draft Employees
  const [totalemp, setTotalEmp] = useState(0); // Total Employees
  const [activeProjects, setActiveProjects] = useState(0); // Active Projects

  // Loading and error states for counts
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState(null);

  // Existing state variables for allocations
  const [currentDate, setCurrentDate] = useState('');
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // State for EmployeesTableUpload
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState([]);

  // Ref for the hidden file input
  const hiddenFileInput = useRef(null);

  // Handle file upload using ref
  const handleUploadButtonClick = () => {
    hiddenFileInput.current.click();
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
  
        // Read data with cellDates option to better handle dates
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
          dateNF: 'YYYY-MM-DD',
          cellDates: true,
        });
  
        // Convert date fields
        const processedData = jsonData.map((record) => ({
          ...record,
          AllocationStartDate: convertExcelDateToJSDate(record.AllocationStartDate),
          AllocationEndDate: convertExcelDateToJSDate(record.AllocationEndDate),
          EmployeeJoiningDate: convertExcelDateToJSDate(record.EmployeeJoiningDate),
          EmployeeEndingDate: convertExcelDateToJSDate(record.EmployeeEndingDate),
          // Add any other date fields that need conversion
        }));
  
        console.log('Processed Data:', processedData);
  
        setUploadedData(processedData);
        setIsPopupOpen(true); // Open the modal with the uploaded data
      };
      reader.readAsBinaryString(file);
      e.target.value = null;
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsPopupOpen(false);
    setUploadedData([]);
  };
  
  // New state for visible columns
  const [visibleColumns, setVisibleColumns] = useState([
    'AllocationID', 'EmployeeID', 'EmployeeName', 'EmployeeLocation',
    'ClientName', 'ProjectName', 'AllocationStatus', 'AllocationPercent',
    'AllocationTimeSheetApproverID' // Added to default visible columns
  ]);

  // All available columns
  const allColumns = [
    'AllocationID', 'EmployeeID', 'EmployeeName', 'EmployeeLocation',
    'EmployeeContractType', 'EmployeeJoiningDate', 'EmployeeEndingDate',
    'EmployeeStudio', 'EmployeeSubStudio', 'EmployeeRole', 'EmployeeTYOE',
    'EmployeeKekaStatus', 'ClientID', 'ClientName', 'ClientPartner',
    'ProjectID', 'ProjectName', 'ProjectManager', 'AllocationStatus',
    'AllocationPercent', 'AllocationBillingType', 'AllocationBilledCheck',
    'AllocationBillingRate', 'AllocationTimeSheetApprover', 'AllocationTimeSheetApproverID', // Added this field
    'AllocationStartDate',
    'AllocationEndDate', 'ModifiedBy', 'ModifiedAt'
  ];

  // Function to toggle column visibility
  const toggleColumn = (actionOrColumn) => {
    if (actionOrColumn === 'selectAll') {
      setVisibleColumns(allColumns);
    } else if (actionOrColumn === 'deselectAll') {
      setVisibleColumns([]);
    } else {
      setVisibleColumns(prev =>
        prev.includes(actionOrColumn)
          ? prev.filter(col => col !== actionOrColumn)
          : [...prev, actionOrColumn]
      );
    }
  };

  // Fetch Counts from Backend
  const fetchCounts = async () => {
    setCountsLoading(true);
    setCountsError(null);

    try {
      const response = await axios.get(`${config.azureApiUrl}/api/bizops/card`);
      const data = response.data;

      setTotalEmp(data.totalEmployees);
      setTodo(data.unallocatedEmployees);
      setDraft(data.draftEmployees);
      setActiveProjects(data.activeProjects);
      setCountsLoading(false);
    } catch (err) {
      console.error('Error fetching counts:', err);
      setCountsError('Failed to fetch counts. Please try again later.');
      setCountsLoading(false);
    }
  };

  // New state variables for date filters
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true);
  const [minEndDate, setMinEndDate] = useState('');

  // New state variables for error handling
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleChange = (e, { name, value }) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  
    if (name === 'startDate') {
      if (value) {
        setIsEndDateDisabled(false);
        setMinEndDate(value);
        setFormData(prev => ({
          ...prev,
          endDate: '', // Reset End Date when Start Date changes
        }));
        setAllocatedEmployees([]); // Optionally reset allocations when start date changes
        setFilteredEmployees([]);
      } else {
        setIsEndDateDisabled(true);
        setMinEndDate('');
        setFormData(prev => ({
          ...prev,
          endDate: '',
        }));
        setAllocatedEmployees([]); // Optionally reset allocations when start date is cleared
        setFilteredEmployees([]);
      }
    }
  
    if (name === 'endDate' && value) {
      // Optional: Validate that endDate is not before startDate
      if (formData.startDate && value < formData.startDate) {
        setError('End Date cannot be before Start Date.');
        return;
      } else {
        setError(null);
        fetchAllocations(value, formData.startDate);
      }
    }
  };

  useEffect(() => {
    const { startDate, endDate } = formData;
    if (startDate && endDate) {
      fetchAllocations(endDate, startDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startDate, formData.endDate]);

  // Modify the function signature to accept both dates
  const fetchAllocations = async (endDateValue, startDateValue) => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (startDateValue) params.startDate = startDateValue;
      if (endDateValue) params.endDate = endDateValue;

      const response = await axios.get(`${config.azureApiUrl}/api/master-allocations`, { params });
      const data = response.data.masterAllocations;

      setAllocatedEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching master allocations:', err);
      setError('Failed to fetch allocations. Please try again later.');
      setLoading(false);
    }
  };

  // Navigation Handlers
  const handleUnallocatedClick = () => {
    navigate('/allocations/employees', { state: { filter: 'unallocated' } });
  };

  const handleDraftClick = () => {
    navigate('/allocations/employees', { state: { filter: 'draft' } });
  };

  const handleEmployeeClick = () => {
    navigate('/allocations/employees', { state: { filter: 'all' } });
  };

  // Fetch counts on component mount
  useEffect(() => {
    fetchCounts();

    // Set current date
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);

    // Calculate first day of the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formattedFirstDay = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD

    // Format today's date as YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];

    // Set formData with default date range
    setFormData({
      startDate: formattedFirstDay,
      endDate: formattedToday
    });

    // Enable End Date input
    setIsEndDateDisabled(false);
    setMinEndDate(formattedFirstDay);

    // Fetch allocations for the default date range
    fetchAllocations(formattedToday, formattedFirstDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Apply filters whenever allocatedEmployees or searchTerm changes
    applyFilters(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocatedEmployees, searchTerm]);

  // Handle search
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue);
    setCurrentPage(1);
  };

  // Apply search filter
  const applyFilters = (searchValue) => {
    let filtered = allocatedEmployees.filter((employee) =>
      employee.EmployeeName.toLowerCase().includes(searchValue) ||
      (employee.Email && employee.Email.toLowerCase().includes(searchValue)) ||
      employee.EmployeeID.toString().toLowerCase().includes(searchValue)
    );
    setFilteredEmployees(filtered);
  };

  // Handle sorting
  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'ascending' ? 'descending' : 'ascending';
    const sortedData = [...filteredEmployees].sort((a, b) => {
      if (a[column] < b[column]) return direction === 'ascending' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setFilteredEmployees(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Function to render sort icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'ascending') {
      return <Icon name="sort up" />;
    } else {
      return <Icon name="sort down" />;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2') return;
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Generate pagination numbers with ellipsis
  const paginationPages = generatePageNumbers(totalPages, currentPage);

  // Get current employees
  const indexOfLastEmployee = currentPage * rowsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Download Excel
  const downloadExcel = () => {
    if (filteredEmployees.length === 0) {
      alert('No data available to download.');
      return;
    }

    // Map the data to include desired columns based on visibleColumns
    const dataToExport = filteredEmployees.map((emp) => {
      const exportedData = {};
      allColumns.forEach((column) => {
        if (visibleColumns.includes(column)) {
          let value = emp[column];
          if (column === 'AllocationBilledCheck') {
            value = emp[column] ? 'Yes' : 'No';
          } else if (column === 'ModifiedAt') {
            value = new Date(emp[column]).toLocaleString();
          } else if (['EmployeeJoiningDate', 'EmployeeEndingDate', 'AllocationStartDate', 'AllocationEndDate'].includes(column)) {
            value = new Date(emp[column]).toLocaleDateString();
          }
          exportedData[columnLabels[column] || column] = value;
        }
      });
      return exportedData;
    });

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'allocations.xlsx');
  };

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Greeting and Cards */}
        <>
          <div className='top-content'>
            <div className='greeting'>
              <h1>Hello {displayName},</h1>
              <h2>{currentDate}</h2>
            </div>
          </div>

          <div className='bottom-content-cards'>
            <div className='cards'>
              <ViewCard
                icon="fa-user-tie"
                header="Employees"
                value={countsLoading ? 'Loading...' : totalemp}
                onClick={handleEmployeeClick}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-tasks"
                header="Projects"
                value={countsLoading ? 'Loading...' : activeProjects}
                onClick={() => navigate('/allocations/projects')}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-user-clock"
                header="Unallocated"
                value={countsLoading ? 'Loading...' : todo}
                onClick={handleUnallocatedClick}
              />
            </div>
            <div className='cards'>
              <ViewCard
                icon="fa-file-alt"
                header="Drafts"
                value={countsLoading ? 'Loading...' : draft}
                onClick={handleDraftClick}
              />
            </div>
          </div>

          {/* Display error message if counts failed to load */}
          {countsError && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{countsError}</p>
            </Message>
          )}
        </>

        {/* Allocations Section */}
        <div className='last-edited'>
          <h2>Allocations</h2>

          {/* Search and Download Controls */}
          <div className='table-filter-layout'>
            {/* Date Filters and Search/Download */}
            <div className='filter-tabs'>
              {/* Start Date Input */}
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="Start Date"
                min="2020-01-01"
                max="2030-12-31"
                style={{ marginRight: '10px' }}
                aria-label="Start Date"
              />
              -
              {/* End Date Input */}
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={minEndDate}
                disabled={isEndDateDisabled}
                placeholder="End Date"
                style={{ marginLeft: '10px', marginRight: '20px' }}
                aria-label="End Date"
              />
            </div>
            <div className='search-download-container'>
              
              {/* Search Input */}
              <Input
                icon="search"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search Employees"
                style={{ marginRight: '10px', width: '300px' }}
              />
              
              {/* Download Button */}
              <Button
                icon
                labelPosition='left'
                color='blue'
                onClick={downloadExcel}
                aria-label="Download Employees as Excel"
              >
                <Icon name='download' />
                Download
              </Button>
              <ColumnToggle
                columns={allColumns}
                visibleColumns={visibleColumns}
                onToggle={toggleColumn}
              />

              {/* Upload Button */}
            <Button
              icon
              labelPosition="left"
              color="green"
              className="upload-button"
              aria-label="Upload Excel File"
              onClick={handleUploadButtonClick} // Added onClick handler
            >
              <Icon name="upload" />
              Upload
            </Button>

            {/* Hidden File Input */}
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              ref={hiddenFileInput}
              style={{ display: 'none' }}
            />

            </div>
          </div>

          {/* Allocation Table */}
          <div className='table-container'>
            {loading ? (
              <div className="loader">
                <Icon loading name='spinner' /> Loading...
              </div>
            ) : error ? (
              <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{error}</p>
              </Message>
            ) : (
              <>
                <Table celled striped sortable>
                  <Table.Header>
                    <Table.Row>
                      {visibleColumns.map(column => (
                        <Table.HeaderCell key={column} onClick={() => handleSort(column)}>
                          {columnLabels[column] || column} {renderSortIcon(column)}
                        </Table.HeaderCell>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((employee) => (
                        <Table.Row key={employee.AllocationID}>
                          {visibleColumns.map(column => (
                            <Table.Cell key={column}>
                              {column === 'AllocationBilledCheck'
                                ? (employee[column] ? 'Yes' : 'No')
                                : column === 'ModifiedAt'
                                ? new Date(employee[column]).toLocaleString()
                                : ['EmployeeJoiningDate', 'EmployeeEndingDate', 'AllocationStartDate', 'AllocationEndDate'].includes(column)
                                ? new Date(employee[column]).toLocaleDateString()  // Format date
                                : employee[column]}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={visibleColumns.length} textAlign="center">
                          No allocations found matching the criteria.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>

                {/* Custom Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-button"
                      aria-label="Previous Page"
                    >
                      Back
                    </button>

                    {paginationPages.map((page, index) => (
                      page === 'ellipsis1' || page === 'ellipsis2' ? (
                        <span key={index} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                          aria-label={`Page ${page}`}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                      aria-label="Next Page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* EmployeesTableUpload Component */}
        <AllocationsTableUpload
          open={isPopupOpen}
          onClose={handleModalClose}
          data={uploadedData}
        />
      </div>
    </div>
  );
};

export default BizopsDashboard;

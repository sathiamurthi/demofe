// src/pages/EmpPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Table, Input, Button, Icon, Message } from 'semantic-ui-react';
import './EmpPage.css';
import * as XLSX from 'xlsx';
import config from "../../Config.json";
import EmployeesTableUpload from '../../components/ExcelPreviewModal/EmployeesTableUpload'; // Adjust the path as necessary
import { convertExcelDateToJSDate } from '../../utils/dateUtils'; // Adjust the path if necessary

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

const EmpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize filter based on navigation state or default to 'all'
  const [filter, setFilter] = useState(location.state?.filter || 'all');

  // State for employee data and loading status
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null); // For API errors

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [count, setCount] = useState(0);
  const [sortColumn, setSortColumn] = useState(null); // Track the currently sorted column
  const [sortDirection, setSortDirection] = useState(null); // Track the sort direction (asc/desc)
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const rowsPerPage = 100; // Rows per page set to 100

  // State for EmployeesTableUpload
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState([]);

  // Ref for the hidden file input
  const hiddenFileInput = useRef(null);

  // Fetch data whenever the filter changes
  useEffect(() => {
    fetchDataBasedOnFilter(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchDataBasedOnFilter = async (filter) => {
    console.log(`Fetching data for filter: ${filter}`);
    setLoading(true);
    setApiError(null); // Reset API error

    try {
      let endpoint;

      switch (filter) {
        case 'unallocated':
          endpoint = `${config.azureApiUrl}/api/employees/unallocated`;
          break;
        case 'draft':
          endpoint = `${config.azureApiUrl}/api/employees/draft`;
          break;
        case 'allocated':
          endpoint = `${config.azureApiUrl}/api/employees/allocated`;
          break;
        case 'bench':
          endpoint = `${config.azureApiUrl}/api/employees/bench`;
          break;
        case 'all':
        default:
          endpoint = `${config.azureApiUrl}/api/employees`;
          break;
      }

      console.log(`API Endpoint: ${endpoint}`);

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Fetched data:', data); // Debugging
      setEmployeeData(data);
      setFilteredEmployees(data);
      setCount(data.length);
    } catch (error) {
      console.error('Fetch error:', error);
      setApiError('Failed to fetch employee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Sorting logic
  const handleSort = (column) => {
    const isAscending = sortColumn === column && sortDirection === 'ascending';
    const direction = isAscending ? 'descending' : 'ascending';

    const sortedData = [...filteredEmployees].sort((a, b) => {
      if (a[column] < b[column]) {
        return direction === 'ascending' ? -1 : 1;
      } else if (a[column] > b[column]) {
        return direction === 'ascending' ? 1 : -1;
      }
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue);
    setCurrentPage(1);
  };

  // Apply search filter
  const applyFilters = (searchValue) => {
    let filtered = employeeData.filter((employee) =>
      employee.EmployeeName.toLowerCase().includes(searchValue) ||
      (employee.Email && employee.Email.toLowerCase().includes(searchValue)) ||
      employee.EmployeeID.toString().toLowerCase().includes(searchValue)
    );
    setFilteredEmployees(filtered);
    setCount(filtered.length);
  };

  // Handle filter change via buttons
  const handleFilterChange = (value) => {
    console.log('Filter changed to:', value);
    setFilter(value); // Update filter, triggering useEffect to fetch new data
    setSearchTerm(''); // Reset search term when changing filter
  };

  // Handle navigation to individual employee details
  const handleEmployeeClick = (employee) => {
    navigate(`/employee/${employee.EmployeeID}`, {
      state: {
        employee,
        allocationPercentage: employee.Current_Allocation, // Pass the current allocation percentage
      },
    });
  };

  // Function to handle back navigation
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  // Download Excel
  const downloadExcel = async () => {
    const filters = ['all', 'unallocated', 'draft', 'allocated', 'bench'];
    const workbook = XLSX.utils.book_new();

    try {
      for (const filter of filters) {
        const endpoint = `${config.azureApiUrl}/api/employees${filter === 'all' ? '' : `/${filter}`}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filter} data`);
        }
        const data = await response.json();

        const worksheet = XLSX.utils.json_to_sheet(data.map((employee) => ({
          'Employee ID': employee.EmployeeID,
          'Employee Name': employee.EmployeeName,
          'Employee Role': employee.EmployeeRole,
          'Employee Contract Type': employee.EmployeeContractType,
          'Projects': employee.Projects.join(', '),
          'Current Allocation %': employee.Current_Allocation,
        })));

        XLSX.utils.book_append_sheet(workbook, worksheet, filter.charAt(0).toUpperCase() + filter.slice(1));
      }

      XLSX.writeFile(workbook, 'employee-data.xlsx');
      alert('Excel file downloaded successfully.');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Error downloading Excel file. Please try again later.');
    }
  };

  // Handle file upload using ref
  const handleUploadButtonClick = () => {
    hiddenFileInput.current.click();
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log('Selected file:', file); // Debugging
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          console.log('Parsed Excel data:', jsonData); // Debugging

          // Process date fields
          const processedData = jsonData.map((row) => {
            return {
              ...row,
              EmployeeJoiningDate: convertExcelDateToJSDate(row.EmployeeJoiningDate),
              EmployeeEndingDate: convertExcelDateToJSDate(row.EmployeeEndingDate),
              // If there are other date fields, process them here
              // For example:
              // EmployeeDOB: convertExcelDateToJSDate(row.EmployeeDOB),
              // EmployeeLeavingDate: convertExcelDateToJSDate(row.EmployeeLeavingDate),
            };
          });

          setUploadedData(processedData);
          setIsPopupOpen(true);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Failed to parse the Excel file. Please ensure it is correctly formatted.');
        }
      };
      reader.readAsBinaryString(file);
      // Reset the file input value
      e.target.value = null;
    }
  };
  // Handle modal close
  const handleModalClose = () => {
    setIsPopupOpen(false);
    setUploadedData([]);
    fetchDataBasedOnFilter(filter); // Refresh the employee data
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

  return (
    <div className="main-layout">
      <div className='right-content'>
        {/* Breadcrumb Section */}
        <div className='breadcrumb'>
          <h2 className="breadcrumb-text">Employees</h2>
        </div>

        <div className='table-filter-layout'>
          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`tab ${filter === 'unallocated' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unallocated')}
            >
              Unallocated
            </button>
            <button
              className={`tab ${filter === 'draft' ? 'active' : ''}`}
              onClick={() => handleFilterChange('draft')}
            >
              Draft
            </button>
            <button
              className={`tab ${filter === 'allocated' ? 'active' : ''}`}
              onClick={() => handleFilterChange('allocated')}
            >
              Allocated
            </button>
            <button
              className={`tab ${filter === 'bench' ? 'active' : ''}`}
              onClick={() => handleFilterChange('bench')}
            >
              Bench
            </button>
          </div>

          {/* Search and Upload/Download Container */}
          <div className="search-download-container">
            {/* Search Bar */}
            <Input
              icon="search"
              placeholder="Search by ID, or Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
              style={{ marginRight: '10px', width: '300px' }}
              aria-label="Search Employees"
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

            {/* Download Button */}
            <Button
              icon
              labelPosition="left"
              color="blue"
              onClick={downloadExcel}
              className="download-button"
              aria-label="Download Employees as Excel"
              style={{ marginLeft: '10px' }}
            >
              <Icon name="download" />
              Download
            </Button>
          </div>
        </div>

        {/* Display API error message if any */}
        {apiError && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{apiError}</p>
          </Message>
        )}

        <div className='table'>
          <Table celled striped sortable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeID' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeID')}
                >
                  Employee ID {renderSortIcon('EmployeeID')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeName' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeName')}
                >
                  Employee Name {renderSortIcon('EmployeeName')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeRole' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeRole')}
                >
                  Employee Role {renderSortIcon('EmployeeRole')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'EmployeeContractType' ? sortDirection : null}
                  onClick={() => handleSort('EmployeeContractType')}
                >
                  Employee Contract Type {renderSortIcon('EmployeeContractType')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Projects' ? sortDirection : null}
                  onClick={() => handleSort('Projects')}
                >
                  Projects {renderSortIcon('Projects')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={sortColumn === 'Current_Allocation' ? sortDirection : null}
                  onClick={() => handleSort('Current_Allocation')}
                >
                  Current Allocation % {renderSortIcon('Current_Allocation')}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan="6" textAlign="center">
                    <Icon loading name="spinner" /> Loading...
                  </Table.Cell>
                </Table.Row>
              ) : currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <Table.Row
                    key={employee.EmployeeID}
                    onClick={() => handleEmployeeClick(employee)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Cell>{employee.EmployeeID}</Table.Cell>
                    <Table.Cell>{employee.EmployeeName}</Table.Cell>
                    <Table.Cell>{employee.EmployeeRole}</Table.Cell>
                    <Table.Cell>{employee.EmployeeContractType}</Table.Cell>
                    <Table.Cell>{employee.Projects.join(', ')}</Table.Cell>
                    <Table.Cell>{employee.Current_Allocation}%</Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan="6" textAlign="center">
                    No employees found.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Enhanced Pagination Section */}
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

        {/* EmployeesTableUpload Component */}
        <EmployeesTableUpload
          open={isPopupOpen}
          onClose={handleModalClose}
          data={uploadedData}
        />
      </div>
    </div>
  );
};

export default EmpPage;

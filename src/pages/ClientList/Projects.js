// src/pages/Projects.js
import React, { useState, useEffect, useRef } from 'react';
import { Table, Icon, Button, Input } from 'semantic-ui-react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './Projects.css'; // Ensure this contains the updated pagination styles
import config from "../../Config.json";
import ClientsTableUpload from '../../components/ExcelPreviewModal/ClientsTableUpload'; // Adjust the path as necessary
import ProjectsTableUpload from '../../components/ExcelPreviewModal/ProjectsTableUpload'; // Adjust the path as necessary
import { convertExcelDateToJSDate } from '../../utils/dateUtils';

const Projects = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // State for client data and loading status
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search, sort, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 40; // Rows per page set to 40

  // State for file inputs and modals
  const hiddenFileInputClients = useRef(null);
  const hiddenFileInputProjects = useRef(null);
  const [isClientsPopupOpen, setIsClientsPopupOpen] = useState(false);
  const [isProjectsPopupOpen, setIsProjectsPopupOpen] = useState(false);
  const [uploadedClientsData, setUploadedClientsData] = useState([]);
  const [uploadedProjectsData, setUploadedProjectsData] = useState([]);

  // Modal Close Handlers
  const handleClientModalClose = () => {
    setIsClientsPopupOpen(false);
    setUploadedClientsData([]);
    fetchClientData(); // Refresh client data after upload
  };

  const handleProjectModalClose = () => {
    setIsProjectsPopupOpen(false);
    setUploadedProjectsData([]);
    fetchClientData(); // Refresh client data after upload (assuming projects affect clients)
  };

  // Fetch client data
  const fetchClientData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.azureApiUrl}/api/clients`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setClientData(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    applyFilters(searchValue);
  };

  // Apply search filtering
  const applyFilters = (searchTerm) => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = clientData.filter((client) => {
      const clientName = client.ClientName.toLowerCase();
      const clientId = (client.ClientID || '').toString().toLowerCase();
      const clientCountry = (client.ClientCountry || '').toLowerCase();
      const clientPartner = (client.ClientPartner || '').toLowerCase();

      return (
        clientName.includes(lowerSearchTerm) ||
        clientId.includes(lowerSearchTerm) ||
        clientCountry.includes(lowerSearchTerm) ||
        clientPartner.includes(lowerSearchTerm)
      );
    });

    setFilteredClients(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Sorting logic
  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }

    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredClients;

    return [...filteredClients].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal > bVal) return sortDirection === 'ascending' ? 1 : -1;
      if (aVal < bVal) return sortDirection === 'ascending' ? -1 : 1;
      return 0;
    });
  }, [filteredClients, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

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

  // Generate pagination numbers with ellipsis
  const paginationPages = generatePageNumbers(totalPages, currentPage);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2') return;
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Get current clients
  const indexOfLastClient = currentPage * rowsPerPage;
  const indexOfFirstClient = indexOfLastClient - rowsPerPage;
  const currentClients = sortedData.slice(indexOfFirstClient, indexOfLastClient);

  // Handle row click to navigate to client projects
  const handleRowClick = (clientId) => {
    navigate(`/client/${clientId}/projects`);
  };

  // Handle Excel download
  const downloadExcel = () => {
    const dataToExport = sortedData.map(client => ({
      'Client ID': client.ClientID,
      Company: client.ClientName,
      'No. of Projects': client.NoOfProjects,
      Country: client.ClientCountry,
      "Client Partner": client.ClientPartner,
      Headcount: client.Headcount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'clients.xlsx');
  };

  // Handle file uploads
  const handleClientsFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Process date fields if any (assuming Clients have date fields; if not, skip)
        const processedData = jsonData.map((row) => {
          // Example: If Clients have 'ClientStartDate'
          // return {
          //   ...row,
          //   ClientStartDate: convertExcelDateToJSDate(row.ClientStartDate),
          // };
          return row; // No date fields to process in Clients; adjust if necessary
        });

        setUploadedClientsData(processedData);
        setIsClientsPopupOpen(true); // Open the modal with the uploaded data
      };
      reader.readAsBinaryString(file);
      e.target.value = null; // Reset the file input
    }
  };

  const handleProjectsFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // Process date fields
          const processedData = jsonData.map((row) => {
            return {
              ...row,
              ProjectStartDate: convertExcelDateToJSDate(row.ProjectStartDate),
              ProjectEndDate: convertExcelDateToJSDate(row.ProjectEndDate),
              // Add other date fields if necessary
            };
          });

          setUploadedProjectsData(processedData);
          setIsProjectsPopupOpen(true); // Open the modal with the uploaded data
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Failed to parse the Excel file. Please ensure it is correctly formatted.');
        }
      };
      reader.readAsBinaryString(file);
      e.target.value = null; // Reset the file input
    }
  };

  return (
    <div className='main-layout'>
      <div className='right-content'>
        {/* Breadcrumb Section */}
        <div className='breadcrumb'>
          <h2 className="breadcrumb-text">Clients</h2>
        </div>

        {/* Search and Download Container */}
        <div className="controls">
          {/* Search Bar */}
          <Input
            icon="search"
            placeholder="Search Client"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-bar"
            style={{ marginRight: '10px', width: '300px' }}
          />

          {/* Download Button */}
          <Button
            icon
            labelPosition="left"
            color="blue"
            onClick={downloadExcel}
            className="download-button"
          >
            <Icon name="download" />
            Download
          </Button>
              {/* Upload Clients Button */}
              <Button
            icon
            labelPosition="left"
            color="green"
            className="upload-button"
            aria-label="Upload Clients Excel File"
            onClick={() => hiddenFileInputClients.current.click()}
          >
            <Icon name="upload" />
            Upload Clients
          </Button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleClientsFileUpload}
            ref={hiddenFileInputClients}
            style={{ display: 'none' }}
          />

          {/* Upload Projects Button */}
          <Button
            icon
            labelPosition="left"
            color="green"
            className="upload-button"
            aria-label="Upload Projects Excel File"
            onClick={() => hiddenFileInputProjects.current.click()}
          >
            <Icon name="upload" />
            Upload Projects
          </Button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleProjectsFileUpload}
            ref={hiddenFileInputProjects}
            style={{ display: 'none' }}
          />

        </div>

        {/* Table Section */}
        <div className='table'>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table celled striped selectable sortable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientID' ? sortDirection : null}
                    onClick={() => handleSort('ClientID')}
                  >
                    Client ID {sortColumn === 'ClientID' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientName' ? sortDirection : null}
                    onClick={() => handleSort('ClientName')}
                  >
                    Company {sortColumn === 'ClientName' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'NoOfProjects' ? sortDirection : null}
                    onClick={() => handleSort('NoOfProjects')}
                  >
                    No. of Projects {sortColumn === 'NoOfProjects' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientCountry' ? sortDirection : null}
                    onClick={() => handleSort('ClientCountry')}
                  >
                    Country {sortColumn === 'ClientCountry' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'ClientPartner' ? sortDirection : null}
                    onClick={() => handleSort('ClientPartner')}
                  >
                    Client Partner {sortColumn === 'ClientPartner' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={sortColumn === 'Headcount' ? sortDirection : null}
                    onClick={() => handleSort('Headcount')}
                  >
                    Headcount {sortColumn === 'Headcount' && (sortDirection === 'ascending' ? <Icon name="sort up" /> : <Icon name="sort down" />)}
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentClients.length > 0 ? (
                  currentClients.map((client) => (
                    <Table.Row
                      key={client.ClientID}
                      onClick={() => handleRowClick(client.ClientID)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>{client.ClientID}</Table.Cell>
                      <Table.Cell>
                        <Icon name="building" /> {client.ClientName}
                      </Table.Cell>
                      <Table.Cell>{client.NoOfProjects}</Table.Cell>
                      <Table.Cell>{client.ClientCountry}</Table.Cell>
                      <Table.Cell>{client.ClientPartner}</Table.Cell>
                      <Table.Cell>{client.Headcount}</Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="6" textAlign="center">
                      No matching clients found.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          )}
        </div>

        {/* Pagination Section */}
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

        {/* ClientsTableUpload Component */}
        <ClientsTableUpload
          open={isClientsPopupOpen}
          onClose={handleClientModalClose}
          data={uploadedClientsData}
        />

        {/* ProjectsTableUpload Component */}
        <ProjectsTableUpload
          open={isProjectsPopupOpen}
          onClose={handleProjectModalClose}
          data={uploadedProjectsData}
        />
      </div>
    </div>
  );
};

export default Projects;

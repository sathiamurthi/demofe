import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Table, Icon, Button, Input, Loader, Message } from 'semantic-ui-react';
import './ClientProject.css'; // Ensure your CSS includes styles for pagination
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import config from "../../Config.json";

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

const ClientProjects = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State for project data and loading status
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('in progress'); // Default to 'in progress'
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 40;

  useEffect(() => {
    // If coming from a location state with a specific filter
    if (location.state?.filter) {
      setFilter(location.state.filter);
    }
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = `${config.azureApiUrl}/api/client/${clientId}/projects`;

      // Modify endpoint based on filter
      if (filter !== 'all') {
        endpoint += `?status=${encodeURIComponent(filter)}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch project data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
    setSearchTerm(''); // Reset search when filter changes
    setCurrentPage(1); // Reset to first page
  };

  // Apply filters based on the selected status filter and search term
  const filteredProjects = projects.filter(project => {
    const term = searchTerm.toLowerCase();
    const matchesSearchTerm = (
      String(project.ProjectID).includes(term) ||
      project.ProjectName.toLowerCase().includes(term) ||
      project.ProjectStatus.toLowerCase().includes(term) ||
      project.ProjectManager.toLowerCase().includes(term)
    );

    const matchesFilter = filter === 'all' || project.ProjectStatus.toLowerCase() === filter;

    return matchesSearchTerm && matchesFilter;
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSort = (clickedColumn) => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      return;
    }
    setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
  };

  const sortedProjects = React.useMemo(() => {
    if (!sortColumn) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
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
  }, [filteredProjects, sortColumn, sortDirection]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'grey';
      case 'in progress': return 'green';
      case 'on hold': return 'yellow';
      default: return 'grey';
    }
  };

  const downloadExcel = () => {
    const data = sortedProjects.map((project) => ({
      ClientId: clientId, // Adding ClientId to each row
      ProjectID: project.ProjectID,
      ProjectName: project.ProjectName,
      ProjectStatus: project.ProjectStatus,
      ProjectManager: project.ProjectManager,
      ProjectStartDate: new Date(project.ProjectStartDate).toLocaleDateString(),
      ProjectEndDate: project.ProjectEndDate ? new Date(project.ProjectEndDate).toLocaleDateString() : 'Ongoing',
      Headcount: project.Headcount
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Projects');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Client_${clientId}_Projects.xlsx`);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/client/${clientId}/project/${projectId}`);
  };

  // Pagination Logic
  const totalPages = Math.ceil(sortedProjects.length / rowsPerPage);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2') return;
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Generate pagination numbers with ellipsis
  const paginationPages = generatePageNumbers(totalPages, currentPage);

  // Get current projects
  const indexOfLastProject = currentPage * rowsPerPage;
  const indexOfFirstProject = indexOfLastProject - rowsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstProject, indexOfLastProject);

  return (
    <div className='main-layout'>
      <div className='right-content'>
        {/* Breadcrumb Section */}
        <div className='breadcrumb'>
          <Icon 
            name="arrow left" 
            size="large" 
            className="icon"
            onClick={handleBackClick} 
            style={{ cursor: 'pointer' }}
          />
          
          <h2 
            className="breadcrumb-text" 
            onClick={() => navigate('/allocations/projects')}
            style={{ cursor: 'pointer', display: 'inline', marginLeft: '10px' }}
          >
            Clients
          </h2>
        
          <span className="breadcrumb-divider"> / </span>
          
          <h2 className="breadcrumb-text" style={{ display: 'inline' }}>
            {/* Assuming ClientName is part of the project data */}
            {projects[0]?.ClientName || 'Loading...'}
          </h2>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {/* Filter Tabs */}
          <div className="filter-tabs" style={{ display: 'flex', gap: '10px', flexGrow: 1 }}>
            <button
              className={`tab ${filter === 'in progress' ? 'active' : ''}`}
              onClick={() => handleFilterChange('in progress')}
            >
              In Progress
            </button>
            <button
              className={`tab ${filter === 'on hold' ? 'active' : ''}`}
              onClick={() => handleFilterChange('on hold')}
            >
              On Hold
            </button>
            <button
              className={`tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('completed')}
            >
              Completed
            </button>
            <button
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
          </div>
          
          {/* Search and Download */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Input
              icon="search"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
              style={{ width: '300px' }}
            />
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
          </div>
        </div>

        {/* Projects Table */}
        <div className='table'>
          {loading ? (
            <Loader active inline='centered'>Loading Projects...</Loader>
          ) : error ? (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          ) : (
            <>
              <Table celled striped selectable sortable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectID' ? sortDirection : null}
                      onClick={() => handleSort('ProjectID')}
                    >
                      Project ID
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectName' ? sortDirection : null}
                      onClick={() => handleSort('ProjectName')}
                    >
                      Project Name
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectStatus' ? sortDirection : null}
                      onClick={() => handleSort('ProjectStatus')}
                    >
                      Status
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectManager' ? sortDirection : null}
                      onClick={() => handleSort('ProjectManager')}
                    >
                      Project Manager
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectStartDate' ? sortDirection : null}
                      onClick={() => handleSort('ProjectStartDate')}
                    >
                      Start Date
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'ProjectEndDate' ? sortDirection : null}
                      onClick={() => handleSort('ProjectEndDate')}
                    >
                      End Date
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={sortColumn === 'Headcount' ? sortDirection : null}
                      onClick={() => handleSort('Headcount')}
                    >
                      Headcount
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {currentProjects.length > 0 ? (
                    currentProjects.map((project) => (
                      <Table.Row 
                        key={project.ProjectID} 
                        onClick={() => handleProjectClick(project.ProjectID)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Cell>{project.ProjectID}</Table.Cell>
                        <Table.Cell>
                          <Icon name="folder" /> {project.ProjectName}
                        </Table.Cell>
                        <Table.Cell>
                          <Icon name="circle" color={getStatusColor(project.ProjectStatus)} />
                          {project.ProjectStatus}
                        </Table.Cell>
                        <Table.Cell>{project.ProjectManager}</Table.Cell>
                        <Table.Cell>{new Date(project.ProjectStartDate).toLocaleDateString()}</Table.Cell>
                        <Table.Cell>{project.ProjectEndDate ? new Date(project.ProjectEndDate).toLocaleDateString() : 'Ongoing'}</Table.Cell>
                        <Table.Cell>{project.Headcount}</Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan="7" textAlign="center">
                        No matching projects found.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProjects;

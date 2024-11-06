// src/components/ExcelPreviewModal/ProjectsTableUpload.js
import React, { useState, useEffect} from 'react';
import { Modal, Table, Button, Icon, Message, Progress, List } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import config from "../../Config.json";

const ProjectsTableUpload = ({ open, onClose, data }) => {
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'loading', 'success', 'error', 'partial'
  const [errorMessages, setErrorMessages] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [successIDs, setSuccessIDs] = useState([]);
  const [failureDetails, setFailureDetails] = useState([]);

  useEffect(() => {
    if (!open) {
      // Reset internal states when modal is closed
      setSubmissionStatus(null);
      setErrorMessages([]);
      setSuccessCount(0);
      setSuccessIDs([]);
      setFailureDetails([]);
    }
  }, [open]);

  const requiredFields = [
    'ProjectID',
    'ProjectName',
    'ClientID',
    'ProjectStatus',
    'ProjectManagerID',
    'ProjectStartDate',
    // Add other required fields as per your database schema if any
  ];

  const handleSubmit = async () => {
    // Reset previous statuses
    setSubmissionStatus('loading');
    setErrorMessages([]);
    setSuccessCount(0);
    setSuccessIDs([]);
    setFailureDetails([]);

    // Validate fields
    if (data.length === 0) {
      setSubmissionStatus('error');
      setErrorMessages(['No data available to submit.']);
      return;
    }

    const missingFields = requiredFields.filter(field => !data[0].hasOwnProperty(field) || data[0][field] === '');
    if (missingFields.length > 0) {
      setSubmissionStatus('error');
      setErrorMessages([`Missing required fields: ${missingFields.join(', ')}`]);
      return;
    }

    try {
      const response = await fetch(`${config.azureApiUrl}/api/projects-excel/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        const { processedRecords, totalRecords, successes, failures } = responseData;

        setSuccessCount(processedRecords);
        setSuccessIDs(successes);
        setFailureDetails(failures);

        if (failures.length === 0) {
          setSubmissionStatus('success');
        } else if (processedRecords > 0 && failures.length > 0) {
          setSubmissionStatus('partial');
        } else {
          setSubmissionStatus('error');
          setErrorMessages(['All records failed to process.']);
        }
      } else {
        const errorData = await response.json();
        setSubmissionStatus('error');
        setErrorMessages([errorData.message || 'Unknown error occurred during submission.']);
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setSubmissionStatus('error');
      setErrorMessages(['Failed to submit data. Please try again later.']);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="fullscreen">
      <Modal.Header>Uploaded Projects Data</Modal.Header>
      <Modal.Content scrolling>
        {data && data.length > 0 ? (
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                {Object.keys(data[0]).map((header, index) => (
                  <Table.HeaderCell key={index}>{header}</Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.map((row, rowIndex) => (
                <Table.Row key={rowIndex}>
                  {Object.keys(row).map((cell, cellIndex) => (
                    <Table.Cell key={cellIndex}>{row[cell]}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Message warning>
            <Message.Header>No Data Available</Message.Header>
            <p>The uploaded Excel file contains no data.</p>
          </Message>
        )}

        {/* Display Progress */}
        {submissionStatus === 'loading' && (
          <Progress percent={100} active indicating>
            Submitting Data...
          </Progress>
        )}

        {/* Display Success Message */}
        {(submissionStatus === 'success' || submissionStatus === 'partial') && (
          <Message positive>
            <Message.Header>Submission Summary</Message.Header>
            <p>{successCount} out of {data.length} project records have been successfully submitted.</p>
            {successIDs.length > 0 && (
              <div>
                <strong>Successfully Submitted ProjectIDs:</strong>
                <List bulleted>
                  {successIDs.map((id, idx) => (
                    <List.Item key={idx}>{id}</List.Item>
                  ))}
                </List>
              </div>
            )}
          </Message>
        )}

        {/* Display Partial Success and Failures */}
        {submissionStatus === 'partial' && failureDetails.length > 0 && (
          <Message warning>
            <Message.Header>Failed Submissions</Message.Header>
            <p>{failureDetails.length} records failed to submit.</p>
            <List>
              {failureDetails.map((fail, idx) => (
                <List.Item key={idx}>
                  <strong>ProjectID:</strong> {fail.ProjectID} - <strong>Error:</strong> {fail.message}
                </List.Item>
              ))}
            </List>
          </Message>
        )}

        {/* Display Error Message */}
        {submissionStatus === 'error' && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <Message.List>
              {errorMessages.map((err, idx) => (
                <Message.Item key={idx}>{err}</Message.Item>
              ))}
            </Message.List>
          </Message>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button color="grey" onClick={onClose}>
          <Icon name="remove" /> Close
        </Button>
        <Button 
          color="green" 
          onClick={handleSubmit} 
          disabled={submissionStatus === 'loading' || data.length === 0}
        >
          <Icon name="checkmark" /> Submit
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

ProjectsTableUpload.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ProjectsTableUpload;

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import config from "../Config.json";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TextField,
  Button,
  FormControl,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Alert,
  IconButton,
} from "@mui/material";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import CloseIcon from "@mui/icons-material/Close";
import Hidden from "@material-ui/core/Hidden";
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import DataTable from "./DataTable";
import { Input } from "antd";
import LinearProgress from "@mui/material/LinearProgress";

function ImportTableView({ roles, title }) {
  const [data, setData] = useState("");
  const [fileName, setFileName] = useState("");
  const [inputKey, setInputKey] = useState(Date.now()); // Step 1: Add a state variable for input key
  const hasAlerted = useRef(false);
  const [submited, setSubmited] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState([]);
  const [overtime, setOvertime] = useState(false);

  const [open, setOpen] = React.useState(false);
  const [openAuthorized, setOpenAuthorized] = useState(false);
  const [message, setMessage] = useState(false);
  const [records, setRecords] = useState(0);

  const navigate = useNavigate();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseAuthorized = () => {
    setOpenAuthorized(true);
  };

  useEffect(() => {
    if (!roles.includes(title) && !hasAlerted.current) {
      setOpenAuthorized(true);
      window.location.href = "/";
      //navigate("?viewname=mytimesheet");
      hasAlerted.current = true; // Prevents further alerts during this component's lifecycle
    }
  }, [roles, title]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    setFileName(file.name);
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);
      const currentTime = Date.now();
      // Check if any required field is undefined in the item
      // Iterate over each item in sheetData
      console.log("sheetData", sheetData);
      sheetData.forEach((item) => {
        // Define required fields and normalize them to lowercase
        const requiredFields = [
          "TOTAL",
          "PROJECT",
          "Resource",
          "EMAIL",
          "STARTDATE",
          "ENDDATE",
        ].map((field) => field.toLowerCase());

        // Normalize the keys of item to lowercase
        const itemKeys = Object.keys(item).reduce((acc, key) => {
          acc[key.toLowerCase()] = item[key];
          return acc;
        }, {});

        // Check if any required field is missing
        const isInvalidItem = requiredFields.some((field) => {
          if (itemKeys[field] === undefined) {
            console.log("Missing field:", field); // Logging the missing field
          }
          return itemKeys[field] === undefined; // Return true if field is missing
        });

        if (isInvalidItem) {
          setMessage(true);
          setData("");
          setSubmit(false);
          return; // Exit the current iteration on finding an invalid item
        } else {
          setMessage(false);
          setData({ cacheNumber: currentTime, datas: sheetData });
          setInputKey(currentTime);
          setSubmit(true);
          setRecords(sheetData.length);
        }
      });
    };
    reader.readAsBinaryString(file);
  };

  const serialToDate = (serial) => {
    const baseDate = moment.utc("1899-12-30"); // December 30, 1899
    const date = baseDate.add(serial, "days"); // Adjust because Excel's base date is December 30, 1899
    // Return the date in MM/DD/YYYY format
    return date.format("MM/DD/YYYY");
  };

  const splitIntoChunks = (array, chunkSize) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  const handleSubmit = async () => {
    // User clicked "OK", proceed with submission logic
    let update = [];
    let xls_input = data.datas;
    console.log("xls_input", xls_input);
    xls_input.forEach((value, index) => {
      //console.log(index);
      let projects = [];
      // Generate next 5 days starting from STARTDATE
      const startDate = moment.utc(serialToDate(value.STARTDATE), "MM/DD/YYYY");
      for (let i = 0; i < 5; i++) {
        const nextDate = startDate.clone().add(i, "days");
        projects.push({
          name: value.PROJECT,
          hours: Math.floor(value.TOTAL / 5),
          date: nextDate.format("MM/DD/YYYY"),
        });
      }
      console.log("projects", projects);
      update.push({
        email: value.EMAIL,
        resource: value.Resource,
        startDate: serialToDate(value.STARTDATE),
        endDate: serialToDate(value.ENDDATE),
        project: projects,
      });
    });

    if (update.length > 0) {
      console.log("update", update);
      // API call to update the database
      // const response = await axios.post("/api/update", update);
      console.log(update);
      const chunks = splitIntoChunks(
        update,
        `${config.REACT_APP_API_DATA_CHUNKS}`
      );

      CallToActionSharp(chunks);
    }
    // Add your submission logic here
  };

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const CallToActionSharp = async (update) => {
    let resource = "";
    setSubmit(false);
    setLoading(true);
    setOpen(false);
    let errors = [];
    for (const value of update) {
      for (const v of value) {
        let bodyInputData = {
          email: v.email,
          startDate: v.startDate,
          endDate: v.endDate,
          projects: v.project,
        };
        resource = v.resource;
        //console.log("resource", resource);

        try {
          const response = await axios.post(
            `${config.azureApiUrl}/api/postResourceTimesheet?resource=${resource}&url=${window.location.origin}`,
            bodyInputData
          );

          if (response.data) {
            console.log("response", response.data);
            //   fetchTimeSheet(
            //     response.data.startDate,
            //     response.data.endDate,
            //     response.data.email,
            //     1
            //   );
          }
        } catch (error) {
          console.log(error);
          errors.push(error.config.url);
          // setErrorData([...errorData, error.config.url]);
        }
      }
      await delay(`${config.REACT_APP_DELAY_API_CALL}`); // 10000 milliseconds = 10 seconds
    }
    if (errors.length > 0) {
      setOvertime(true);
      setErrorData(errors);
    }
    setSubmited(true);
    setTimeout(() => {
      setSubmited(false);
    }, 5000);
    setLoading(false);
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Collapse in={message}>
          <Alert
            severity="error"
            variant="filled"
            style={{
              position: "relative",
              zIndex: 10000000,
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setMessage(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Please upload valid xls file or check with sample xls with same
            headers
          </Alert>
        </Collapse>
      </Box>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            marginTop: "10px", // Adjust this value as needed to position the dialog
          },
        }}
      >
        {/* <DialogTitle id="alert-dialog-title">{"Confirm Approval?"}</DialogTitle> */}
        <DialogContent>
          <DialogContentText id="alert-dialog-description" color="outlined">
            Are you sure you want to submit for all uploaded resource timesheet?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} autoFocus color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ width: "100%" }}>
        <Collapse in={overtime}>
          <Alert
            severity="error"
            variant="filled"
            style={{
              position: "fixed",
              top: "91px",
              left: "255px",
              zIndex: 10000000,
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOvertime(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {errorData.map((error, index) => {
              const parts = error.split("?");
              const queryParams = parts[1] || ""; // Ensure queryParams is not undefined
              const params = queryParams.split("&");
              const resourceParam = params[0]; // Assuming 'resource' parameter is always first
              const resource = resourceParam.split("=");
              const resourceName = resource[1];
              return (
                <Typography key={index} variant="body1">
                  API Failed for following resources:{resourceName}
                </Typography>
              );
            })}
          </Alert>
        </Collapse>
      </Box>
      <Box sx={{ width: "100%" }}>
        <Collapse in={submited}>
          <Alert
            severity="success"
            variant="filled"
            style={{
              position: "fixed",
              top: "70px",
              left: "15px",
              zIndex: 10000000,
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setSubmited(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Timesheet submitted successfully
          </Alert>
        </Collapse>
      </Box>

      <Box
        sx={{
          p: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#101010" : "rgb(233,233,233)",
          color: (theme) =>
            theme.palette.mode === "dark" ? "grey.300" : "grey.800",
          border: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "grey.800" : "grey.300",
          borderRadius: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          boxShadow: "0px 2px 13px -11px #000",
          border: "1px solid #d1d1d1",
          padding: "12px 6px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "flex-start",
            width: "100%",
          }}
        >
          <FormControl>
            <input
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              id="import-file"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileUpload}
              key={inputKey} // Step 3: Add the input key to the input element
            />
            <label htmlFor="import-file">
              <Button variant="contained" component="span">
                Upload File
              </Button>
            </label>
          </FormControl>
          {fileName && (
            <Typography variant="body1" sx={{ marginLeft: "20px" }}>
              {fileName}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            p: 1,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#101010" : "#fff",
            color: (theme) =>
              theme.palette.mode === "dark" ? "grey.300" : "grey.800",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "grey.800" : "grey.300",
            borderRadius: 2,
            ml: 2, // Add some margin-left for spacing between the boxes
          }}
        >
          <Button
            href="Timsheet-import.xlsx"
            variant="contained"
            target="_blank"
            color="success"
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            Sample File
          </Button>
          &nbsp;&nbsp;
          <Button
            variant="contained"
            disabled={!submit}
            color="success"
            onClick={handleClickOpen}
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            Submit{records > 0 ? ":" + records + " Records" : ""}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : data.datas && data.datas.length > 0 ? (
        <div style={{ padding: 20 }}>
          <Typography variant="h6" gutterBottom>
            Please review uploaded xls timesheet info
          </Typography>
          <DataTable data={data.datas} />
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Typography variant="h6" gutterBottom>
            {message}
          </Typography>
        </div>
      )}
      <Dialog
        open={openAuthorized}
        onClose={handleCloseAuthorized}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Unauthorized Access"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You are not authorized to view this page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ImportTableView;

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
} from "@mui/material";
import config from "../Config.json";
import CustomPagination from "./CustomPagination";
import moment from "moment";
import "./ImportTableView.css"; // Add this line to import your CSS
const DataTable = ({ data }) => {
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(
    parseInt(`${config.REACT_APP_ROWSPERPAGE}`)
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const serialToDate = (serial) => {
    const baseDate = moment.utc("1899-12-30"); // December 30, 1899
    const date = baseDate.add(serial, "days"); // Adjust because Excel's base date is December 30, 1899
    // Return the date in MM/DD/YYYY format
    //return date.toISOString();
    return date.format("MM/DD/YYYY");
  };

  function isValidExcelSerialNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 100;
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {/* Dynamically create table headers based on data keys */}
              {data.length > 0 &&
                Object.keys(data[0]).map((key) => (
                  <TableCell key={key}>{key}</TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Slice data for pagination and map to rows */}
            {data.length > 0 &&
              data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {isValidExcelSerialNumber(value)
                          ? serialToDate(value)
                          : value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination
        totalItems={data.length}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
      />
    </Paper>
  );
};

export default DataTable;

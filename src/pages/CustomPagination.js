import React from "react";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

function CustomPagination({ totalItems, page, rowsPerPage, handleChangePage }) {
  const pageCount = Math.ceil(totalItems / rowsPerPage);
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
  const displayedPages = pageNumbers.slice(page, page + 3);

  // Hide pagination controls if there's only one page worth of data
  if (pageCount <= 1) {
    return null;
  }

  return (
    <Stack
      style={styles.CustomPagination}
      direction="row"
      justifyContent="center"
      alignItems="center"
    >
      <IconButton
        onClick={() => handleChangePage(null, page - 1)}
        disabled={page === 0}
        style={styles.IconButtonLeft}
        data-cy="previous-link-cy"
      >
        <KeyboardArrowLeft />
      </IconButton>
      {displayedPages.map((pageNumber) => (
        <IconButton
          key={pageNumber}
          onClick={() => handleChangePage(null, pageNumber - 1)}
          color={page === pageNumber - 1 ? "primary" : "inherit"}
          style={styles.IconButtonPagination}
          data-cy="page-link-cy"
        >
          <span style={styles.PageNumber}>{pageNumber}</span>
        </IconButton>
      ))}
      <IconButton
        onClick={() => handleChangePage(null, page + 1)}
        disabled={page === pageCount - 1}
        style={styles.IconButtonRight}
        data-cy="next-link-cy"
      >
        <KeyboardArrowRight />
      </IconButton>
    </Stack>
  );
}

const styles = {
  IconButtonLeft: {
    fontFamily: "Satoshi', sans-serif",
  },
  IconButtonPagination: {
    fontFamily: "Satoshi', sans-serif",
  },
  IconButtonPagination: {
    fontFamily: "Satoshi', sans-serif",
  },
  CustomPagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px",
    margin: "20px 0",
    backgroundColor: "#f0f0f0",
    borderRadius: "5px",
  },
  PageNumber: {
    fontSize: "14px",
  },
};

export default CustomPagination;

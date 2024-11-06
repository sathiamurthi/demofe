// src/pages/NotAuthorized.js
import React from 'react';
import { Typography, Container } from '@mui/material';

const NotAuthorized = () => {
  return (
    <Container>
      <Typography variant="h4" color="error" align="center" sx={{ mt: 5 }}>
        403 - Not Authorized
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        You do not have permission to view this page.
      </Typography>
    </Container>
  );
};

export default NotAuthorized;

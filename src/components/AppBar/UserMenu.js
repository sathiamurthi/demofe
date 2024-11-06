import React, { useState } from "react";
import { MenuItem, Typography, Divider, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from "@mui/material";

const UserMenu = ({ profiledata, userRole, getRoleDisplayName, handleLogout }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({
    displayName: profiledata.displayName,
    userPrincipalName: profiledata.userPrincipalName,
    role: userRole,
  });

  const handleCloseUserMenu = () => {
    // Functionality to close the user menu (if needed)
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    // Save the updated profile data here
    // You can either update localStorage or make an API call to save the changes
    localStorage.setItem("profiledata", JSON.stringify(updatedProfile)); // Example of saving to localStorage
    setOpenDialog(false); // Close the dialog after saving
  };

  return (
    <div>
      <MenuItem>
        <Typography>{profiledata.displayName}</Typography>
      </MenuItem>
      <MenuItem>
        <Typography>{profiledata.userPrincipalName}</Typography>
      </MenuItem>
      {/* Display the user role */}
      {userRole && (
        <>
          <Divider />
          <MenuItem>
            <Typography>Role: {getRoleDisplayName(userRole)}</Typography>
          </MenuItem>
        </>
      )}
      <Divider />
      <MenuItem onClick={handleCloseUserMenu}>
        <a
          href="Timesheet App_UserManual.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          Help
        </a>
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <Typography textAlign="center">Logout</Typography>
      </MenuItem>

      {/* New MenuItem to trigger the profile update dialog */}
      <MenuItem onClick={handleOpenDialog}>
        <Typography textAlign="center">Edit Profile</Typography>
      </MenuItem>

      {/* Dialog for editing profile */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            type="text"
            fullWidth
            variant="outlined"
            name="displayName"
            value={updatedProfile.displayName}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="User Principal Name"
            type="email"
            fullWidth
            variant="outlined"
            name="userPrincipalName"
            value={updatedProfile.userPrincipalName}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Role"
            type="text"
            fullWidth
            variant="outlined"
            name="role"
            value={updatedProfile.role}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserMenu;

import React, { useState, useEffect, useContext } from "react";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import {
  useTheme,
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Tooltip,
  MenuItem,
  Divider,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/system";
import { NavLink, Outlet, useLocation } from "react-router-dom"; // Import necessary components
import { menuConfig } from "../../constants/menuConfig"; // Import the menu configuration
import logo from "../../assets/images/logo.png";
import { ROLES } from "../../constants/roles";
import { UserContext } from "../../context/UserContext";

import "./AppBar.css";

const drawerWidth = 240;

// Styled components for consistent theming and cleaner CSS
const MainContent = styled(Box)(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: open ? drawerWidth : 0,
  marginTop: "64px",
}));

export default function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [profiledata, setProfiledata] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  const [loader, setLoader] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({
    displayName: "",
    userPrincipalName: "",
    role: "",
  });
  const { instance } = useMsal();
  const theme = useTheme();

  // Access userRole from UserContext
  const { userRole } = useContext(UserContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let profileData = sessionStorage.getItem("profileData");
        if (!profileData) {
          const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("accesstoken")}`,
            },
          });
          profileData = response.data;
          sessionStorage.setItem("profileData", JSON.stringify(profileData));
        } else {
          profileData = JSON.parse(profileData);
        }
        setProfiledata(profileData);
        setLoader(false);
      } catch (error) {
        console.error(error);
        setLoader(false); // Stop loader even if there's an error
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    // Set updatedProfile only when profiledata and userRole are available
    if (profiledata && userRole) {
      setUpdatedProfile({
        displayName: profiledata.displayName || "",
        userPrincipalName: profiledata.userPrincipalName || "",
        role: userRole || "",
      });
    }
  }, [profiledata, userRole]); // Update whenever profiledata or userRole changes

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  // Function to get display name for the role
  const getRoleDisplayName = (roleKey) => {
    switch (roleKey) {
      case ROLES.LEADER:
        return "Leader";
      case ROLES.BIZOPS:
        return "BizOps";
      case ROLES.MANAGER:
        return "Project Manager";
      case ROLES.EMPLOYEE:
        return "Employee";
      default:
        return "User";
    }
  };

  // Get current path to determine active tab and sidebar items
  const location = useLocation();
  const currentPath = location.pathname;

  // Find the main menu item that matches the current path
  const currentMainMenu = menuConfig.find(
    (menu) =>
      currentPath === menu.path ||
      currentPath.startsWith(`${menu.path}/`)
  );

  // Instead of finding index, use the path as the value
  const currentTabValue = currentMainMenu ? currentMainMenu.path : false;

  // Filter menuConfig based on userRole
  const filteredMenuConfig = menuConfig.filter((menu) =>
    menu.allowedRoles.includes(userRole)
  );

  // Handle opening and closing of the dialog
  const handleOpenDialog = () => {
    setOpenDialog(true);  // Open the dialog when "Edit Profile" is clicked
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({ ...prev, [name]: value }));  // Update the profile data as user types
  };

  const handleSaveChanges = () => {
    // Save the updated profile data to localStorage (or you can call an API here)
    localStorage.setItem("profiledata", JSON.stringify(updatedProfile));
    setOpenDialog(false); // Close the dialog after saving
  };

  return (
    <>
      <CssBaseline />
      {/* AppBar */}
      <AppBar position="fixed">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Sidebar Toggle Button */}
            <IconButton
              color="inherit"
              onClick={handleToggleSidebar}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            {/* App Title */}
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              DemoDigital
            </Typography>

            {/* Navigation Tabs */}
            <Tabs
              value={currentTabValue}
              indicatorColor="secondary"
              textColor="inherit"
              aria-label="nav tabs"
              sx={{ flexGrow: 1, marginLeft: 2 }}
            >
              {filteredMenuConfig.map((page) => (
                <Tab
                  key={page.key}
                  label={page.label}
                  component={NavLink}
                  to={page.path}
                  value={page.path} // Set value to the route path
                  // Ensure NavLink applies active styling
                  sx={{ textTransform: "none" }}
                  // Use exact to ensure exact path matching for active Tab
                  end={page.path === "/"}
                />
              ))}
            </Tabs>

            {/* Profile and User Menu */}
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open profile">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={profiledata.displayName} src={imageUrl} />
                </IconButton>
              </Tooltip>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
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
                <MenuItem onClick={handleOpenDialog} style={{ color: "blue", cursor: "pointer" }}>
                  <Typography textAlign="center" style={{ fontWeight: "bold" }}>Edit Profile</Typography>
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
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            top: "64px", // Position the drawer below the AppBar
          },
        }}
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
      >
        <Divider />
        <List>
          {/* Logo at the top */}
          <div className="logo-container">
            <img src={logo} alt="Platform X Logo" className="navbar-logo" />
          </div>
          {/* Sidebar SubItems for the Selected Main Menu */}
          {currentMainMenu && currentMainMenu.subItems && currentMainMenu.subItems.length > 0 ? (
            currentMainMenu.subItems
              .filter((subItem) => subItem.allowedRoles.includes(userRole))
              .map((subItem) => (
                <ListItem
                  button
                  key={subItem.key}
                  component={NavLink}
                  to={subItem.path}
                  // Apply active styling
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? theme.palette.action.selected : undefined,
                  })}
                  end={false}
                  onClick={handleToggleSidebar}
                >
                  <ListItemText primary={subItem.label} />
                </ListItem>
              ))
          ) : (
            // If the selected main menu has no subItems, display it directly
            currentMainMenu && (
              <ListItem
                button
                component={NavLink}
                to={currentMainMenu.path}
                // Apply active styling
                style={({ isActive }) => ({
                  backgroundColor: isActive ? theme.palette.action.selected : undefined,
                })}
                end={currentMainMenu.path === "/"}
                onClick={handleToggleSidebar}
              >
                <ListItemText primary={currentMainMenu.label} />
              </ListItem>
            )
          )}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <MainContent open={sidebarOpen}>
        {loader ? <LinearProgress /> : <Outlet />}
      </MainContent>
    </>
  );
}

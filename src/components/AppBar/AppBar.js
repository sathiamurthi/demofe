// src/components/ResponsiveAppBar.js
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
  CssBaseline,
  Button,
  ButtonGroup,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  styled,
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { menuConfig } from "../../constants/menuConfig";
import logo from "../../assets/images/logo.png";
import { ROLES } from "../../constants/roles";
import { UserContext } from "../../context/UserContext";
import "./AppBar.css";

// Styled Components

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginTop: "64px",
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, ' +
      'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, ' +
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, ' +
      'rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      fontSize: 14,
      padding: '10px 16px',
      backgroundColor: 'white',
      color: 'black',
      '&:hover': {
        backgroundColor: 'black',
        color: 'white',
      },
      '&.active': {
        backgroundColor: 'white',
        color: 'black',
      },
    },
  },
}));

const drawerWidth = 240;

export default function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [profiledata, setProfiledata] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  const [loader, setLoader] = useState(true);
  const [menuAnchors, setMenuAnchors] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});

  const { instance } = useMsal();
  const theme = useTheme();
  const { userRole } = useContext(UserContext);
  const location = useLocation();

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
        setLoader(false);
      }
    };
    fetchProfile();
  }, []);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleOpenMenu = (event, menuId) => {
    setMenuAnchors((prev) => ({
      ...prev,
      [menuId]: event.currentTarget,
    }));
  };

  const handleCloseMenu = (menuId) => {
    setMenuAnchors((prev) => ({
      ...prev,
      [menuId]: null,
    }));
  };

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

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
      case ROLES.ADMIN:
        return "Administrator";
      default:
        return "User";
    }
  };

  const filteredMenuConfig = menuConfig.filter((menu) =>
    menu.allowedRoles.includes(userRole)
  );

  const currentPath = location.pathname;

  // Helper function to determine if a menu or any of its sub-items is active
  const isMenuActive = (menu) => {
    if (currentPath === menu.path) return true;

    // Trails 
    if (menu.key === 'allocations') {  // Assuming 'allocations' is the key for your Allocations menu
      const allocationRelatedPaths = [
        /^\/employee\/[A-Z]{3}\d+$/,  // Matches paths like /employee/INN005
        /^\/client\/\d+\/projects$/,  // Matches paths like /client/1/projects
        /^\/client\/\d+\/project\/[A-Z]{3}\d+$/  // Matches paths like /client/1/project/PJT009
      ];

      // Check if current path matches any of the allocation-related patterns
      if (allocationRelatedPaths.some(pattern => pattern.test(currentPath))) {
        return true;
      }
    }

    // Check subItems if they exist
    if (menu.subItems && menu.subItems.length > 0) {
      return menu.subItems.some(subItem => {
        // Direct subItem path match
        if (currentPath === subItem.path) return true;
        
        // Check if the current path starts with the subItem path
        // This helps with nested routes
        if (currentPath.startsWith(subItem.path)) return true;
        
        return false;
      });
    }
    return false;
  };

  // Drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle submenu toggle in Drawer
  const handleSubMenuToggle = (menuKey) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Render menu items for Drawer
  const renderDrawerMenu = () => (
    <Box
      sx={{ width: drawerWidth }}
      role="presentation"
    >
      <List>
        {filteredMenuConfig.map((menu) => (
          <React.Fragment key={menu.key}>
            {menu.subItems && menu.subItems.length > 0 ? (
              <>
                <ListItem disablePadding>
                  {/* Expand/Collapse Submenu without closing the Drawer */}
                  <ListItemButton onClick={() => handleSubMenuToggle(menu.key)}>
                    <ListItemText
                      primary={menu.label}
                      primaryTypographyProps={{
                        fontWeight: isMenuActive(menu) ? 'bold' : 'normal',
                        color: isMenuActive(menu) ? 'black' : 'inherit',
                      }}
                    />
                    {openSubMenus[menu.key] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={openSubMenus[menu.key]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {menu.subItems
                      .filter((subItem) => subItem.allowedRoles.includes(userRole))
                      .map((subItem) => (
                        <ListItem key={subItem.key} disablePadding>
                          <ListItemButton
                            component={NavLink}
                            to={subItem.path}
                            onClick={handleDrawerToggle} // Close Drawer when navigating to a sub-item
                            sx={{
                              pl: 4,
                              backgroundColor: currentPath === subItem.path ? 'rgba(0,0,0,0.1)' : 'inherit',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.2)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={subItem.label}
                              primaryTypographyProps={{
                                color: currentPath === subItem.path ? 'black' : 'inherit',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding>
                {/* Close Drawer when navigating to a main menu item */}
                <ListItemButton
                  component={NavLink}
                  to={menu.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    backgroundColor: currentPath === menu.path ? 'rgba(0,0,0,0.1)' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <ListItemText
                    primary={menu.label}
                    primaryTypographyProps={{
                      fontWeight: currentPath === menu.path ? 'bold' : 'normal',
                      color: currentPath === menu.path ? 'black' : 'inherit',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
  

  return (
    <>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'black',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Mobile: Hamburger Menu and Logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              {/* Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src={logo} alt="Platform X Logo" style={{ height: '40px' }} />
              </Box>
            </Box>

            {/* Desktop: Logo */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <img src={logo} alt="Platform X Logo" style={{ height: '40px' }} />
            </Box>

            {/* Desktop: Navigation Menu */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {filteredMenuConfig.map((menu) => (
                <Box key={menu.key} sx={{ display: 'flex', alignItems: 'center' }}>
                  {menu.subItems && menu.subItems.length > 0 ? (
                    <ButtonGroup variant="contained" disableElevation>
                      {/* Parent Button: Navigates to first sub-item */}
                      <Button
                        component={NavLink}
                        to={menu.subItems[0].path}
                        aria-controls={Boolean(menuAnchors[menu.key]) ? 'menu-appbar' : undefined}
                        aria-haspopup="true"
                        aria-expanded={Boolean(menuAnchors[menu.key]) ? 'true' : undefined}
                        onClick={(e) => handleOpenMenu(e, menu.key)}
                        sx={{
                          color: isMenuActive(menu) ? 'black' : 'inherit',
                          backgroundColor: isMenuActive(menu) ? 'white' : 'transparent',
                          textTransform: 'none',
                          fontSize: '15px',
                          '&:hover': {
                            backgroundColor: 'black',
                            color: 'white',
                          },
                          fontWeight: isMenuActive(menu) ? 'bold' : 'normal',
                          borderTopLeftRadius: 4,
                          borderBottomLeftRadius: 4,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          minWidth: '120px',
                        }}
                      >
                        {menu.label} <KeyboardArrowDownIcon />
                      </Button>

                      {/* Dropdown Arrow Button */}
                      {/* <Button
                        size="small"
                        aria-controls={Boolean(menuAnchors[menu.key]) ? 'menu-appbar' : undefined}
                        aria-haspopup="true"
                        aria-expanded={Boolean(menuAnchors[menu.key]) ? 'true' : undefined}
                        onClick={(e) => handleOpenMenu(e, menu.key)}
                        sx={{
                          color: isMenuActive(menu) ? 'black' : 'inherit',
                          backgroundColor: isMenuActive(menu) ? 'white' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'black',
                            color: 'white',
                          },
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          minWidth: '40px',
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </Button> */}
                    </ButtonGroup>
                  ) 
                  : 
                  (
                    <Button
                      component={NavLink}
                      to={menu.path}
                      sx={{
                        color: isMenuActive(menu) ? 'black' : 'inherit',
                        backgroundColor: isMenuActive(menu) ? 'white' : 'transparent',
                        textTransform: 'none',
                        fontSize: '15px',
                        '&:hover': {
                          backgroundColor: 'black',
                          color: 'white',
                        },
                        fontWeight: isMenuActive(menu) ? 'bold' : 'normal',
                      }}
                    >
                      {menu.label}
                    </Button>
                  )}

                  {/* Sub-Menu Dropdown */}
                  {menu.subItems && menu.subItems.length > 0 && (
                    <StyledMenu
                      anchorEl={menuAnchors[menu.key]}
                      open={Boolean(menuAnchors[menu.key])}
                      onClose={() => handleCloseMenu(menu.key)}
                      elevation={0}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                      }}
                    >
                      {menu.subItems
                        .filter((subItem) => subItem.allowedRoles.includes(userRole))
                        .map((subItem) => (
                          <MenuItem
                            key={subItem.key}
                            component={NavLink}
                            to={subItem.path}
                            onClick={() => handleCloseMenu(menu.key)}
                            className={currentPath === subItem.path ? 'active' : ''}
                          >
                            {subItem.label}
                          </MenuItem>
                        ))}
                    </StyledMenu>
                  )}
                </Box>
              ))}
            </Box>

            {/* Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={profiledata.displayName}
                    src={imageUrl}
                    sx={{ width: 40, height: 40 }}
                  />
                </IconButton>
              </Tooltip>
              <StyledMenu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem>
                  <Typography variant="subtitle2">{profiledata.displayName}</Typography>
                </MenuItem>
                <MenuItem>
                  <Typography variant="body2" color="text.secondary">
                    {profiledata.userPrincipalName}
                  </Typography>
                </MenuItem>
                {userRole && (
                  <>
                    <Divider />
                    <MenuItem>
                      <Typography variant="body2">
                        Role: {getRoleDisplayName(userRole)}
                      </Typography>
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
                  <Typography>Logout</Typography>
                </MenuItem>
              </StyledMenu>
            </Box>
          </Toolbar>
        </Container>

        {/* Drawer for Mobile */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {renderDrawerMenu()}
        </Drawer>
      </AppBar>

      {/* Main Content Area */}
      <MainContent>
        {loader ? <LinearProgress /> : <Outlet />}
      </MainContent>
    </>
  );
}

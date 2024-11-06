// src/constants/menuConfig.js
export const menuConfig = [
  {
    key: "home",
    label: "Home",
    path: "/",
    allowedRoles: ["leader", "bizops", "manager", "employee"], // All roles
    subItems: [],
  },
  {
    key: "mytimesheet",
    label: "My Timesheet",
    path: "/mytimesheet",
    allowedRoles: ["employee", "manager", "bizops", "leader"],
    subItems: [
      { key: "submitTimesheet", label: "Submit Timesheet", path: "/mytimesheet/submit", allowedRoles: ["employee", "manager", "bizops", "leader"] },
      // Add more sub-items with allowedRoles if needed
    ],
  },
  {
    key: "leadersview",
    label: "Leaders View",
    path: "/leadersview",
    allowedRoles: ["leader"],
    subItems: [],
  },
  {
    key: "managerview",
    label: "Manager View",
    path: "/managerview",
    allowedRoles: ["manager", "leader"],
    subItems: [
      { key: "viewTeamTimesheets", label: "View Team Timesheets", path: "/managerview/view-team-timesheets", allowedRoles: ["manager", "leader"] },
      { key: "approveTimesheets", label: "Approve Timesheets", path: "/managerview/approve-timesheets", allowedRoles: ["manager", "leader"] },
      // Add more sub-items with allowedRoles if needed
    ],
  },
  {
    key: "allocations",
    label: "Allocations",
    path: "/allocations",
    allowedRoles: ["bizops", "leader"],
    subItems: [
      { key: "bizopsdashboard", label: "Overview", path: "/allocations/bizopsdashboard", allowedRoles: ["bizops", "leader"] },
      { key: "employees", label: "Employees", path: "/allocations/employees", allowedRoles: ["bizops", "leader"] },
      { key: "projects", label: "Projects", path: "/allocations/projects", allowedRoles: ["bizops", "leader"] },
    ],
  },
  // Add more main menu items with allowedRoles as needed
];

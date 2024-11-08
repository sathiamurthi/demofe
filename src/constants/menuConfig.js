// src/constants/menuConfig.js
export const menuConfig = [
  {
    key: "home",
    label: "Home",
    path: "/",
    allowedRoles: ["leader", "bizops", "manager", "employee", "admin"], // All roles
    subItems: [],
  },
  {
    key: "mytimesheet",
    label: "My Timesheet",
    path: "/mytimesheet",
    allowedRoles: ["employee", "manager", "bizops", "leader", "admin"],
    subItems: [],
  },
  {
    key: "leadersview",
    label: "Leaders View",
    path: "/leadersview",
    allowedRoles: ["leader", "admin"],
    subItems: [],
  },
  {
    key: "managerview",
    label: "Manager View",
    path: "/managerview",
    allowedRoles: ["manager", "leader", "admin"],
    subItems: [],
  },
  {
    key: "allocations",
    label: "Allocations",
    path: "/allocations",
    allowedRoles: ["bizops", "leader", "admin"],
    subItems: [
      { key: "bizopsdashboard", label: "Overview", path: "/allocations/bizopsdashboard", allowedRoles: ["bizops", "leader", "admin"] },
      { key: "employees", label: "Employees", path: "/allocations/employees", allowedRoles: ["bizops", "leader", "admin"] },
      { key: "projects", label: "Projects", path: "/allocations/projects", allowedRoles: ["bizops", "leader", "admin"] },
    ],
  },
  // Add more main menu items with allowedRoles as needed
];

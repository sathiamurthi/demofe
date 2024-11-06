import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "./UserContext"; // Import UserContext
import { ROLES } from "../constants/roles";
import config from "../Config.json"; // Import the config file

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    displayName: config.displayName,
    userPrincipalName: config.userPrincipalName
  });  const { setUserRole } = useContext(UserContext); // Access setUserRole

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let profileData = sessionStorage.getItem(config.sessionStorageKeys.profileData);
        
        // If profile data is not available in sessionStorage, fetch it from Microsoft Graph API
        // if (!profileData) {
        //   const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
        //     headers: {
        //       Authorization: `Bearer ${sessionStorage.getItem(config.sessionStorageKeys.accessToken)}`,
        //     },
        //   });
        //   profileData = response.data;
        //   sessionStorage.setItem(config.sessionStorageKeys.profileData, JSON.stringify(profileData));
        // } else {
        //   profileData = JSON.parse(profileData);
        // }
        profileData = JSON.parse(profile);

        setProfile(profileData); // Set the profile state

        // Ensure userPrincipalName exists in profile data, otherwise use default values
        if (!profileData.userPrincipalName) {
          console.warn("UserPrincipalName is missing from profile data, using default.");
          profileData.userPrincipalName = "dnmsathia@gmail.com"; // Set a default if missing
        }

        // Fetch user role from API endpoint using userPrincipalName
        const encodedEmail = encodeURIComponent(profileData.userPrincipalName);
        const roleResponse = await axios.get(`${config.azureApiUrl}${config.apiPaths.getUserRole}${encodedEmail}`);

        // Assume `roleResponse.data.userRole` contains the role returned by the API
        const tempRole = roleResponse.data.userRole || config.defaultRole;

        // Determine user role from the API response or use default role mapping
        let userRole;
        switch (tempRole.toUpperCase()) {
          case "LEADER":
            userRole = ROLES.LEADER;
            break;
          case "BIZOPS":
            userRole = ROLES.BIZOPS;
            break;
          case "MANAGER":
            userRole = ROLES.MANAGER;
            break;
          case "EMPLOYEE":
            userRole = ROLES.EMPLOYEE;
            break;
          default:
            // If no match, use the default role from config
            userRole = ROLES[config.defaultRole] || ROLES.EMPLOYEE;
        }

        // Update userRole in UserContext
        setUserRole(userRole);

      } catch (error) {
        console.error("Error fetching profile or user role:", error);
        
        // In case of error, fallback to default role
        setUserRole(ROLES[config.defaultRole] || ROLES.EMPLOYEE);
      }
    };

    fetchProfile();
  }, [setUserRole]);

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
};

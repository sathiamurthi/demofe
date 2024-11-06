// src/App.js
import React, { useEffect } from "react";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
  useIsAuthenticated,
} from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import axios from "axios";
import "react-notifications/lib/notifications.css";
import Approute from "./AppRoute"; // Ensure correct import path
import AppSession from "./components/appsession/index"; // If you have this component
import { BaseConfig } from "./baseConfig";
import { loginRequest } from "./authConfig";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ProfileProvider } from "./context/ProfileContext"; // Import ProfileProvider
import { UserProvider } from "./context/UserContext"; // Import UserProvider

axios.defaults.headers.common["Authorization"] = `Bearer ${BaseConfig.ApiKey}`;

export default function App() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = true;
  const [theme, colorMode] = useMode();

  useEffect(() => {
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => {
        console.log("Login Redirect Error:", e);
      });
    }
    return () => {};
  }, [inProgress, isAuthenticated, instance]);

  return (
    <>
          {/* Wrap ProfileProvider inside UserProvider */}
          <UserProvider>
            <ProfileProvider>
              <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <Approute />
                </ThemeProvider>
              </ColorModeContext.Provider>
            </ProfileProvider>
          </UserProvider>
      

      
    </>
  );
}

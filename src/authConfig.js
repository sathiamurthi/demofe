/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";
import config from "./Config.json";

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */

//Entiovi Client ID: b4aef742-75b6-472e-a6e9-d4d66e570f56 -- Remember to Change HTTP
//Entiovi Tenant ID: 420fe8d6-bf12-4b0d-b544-2d446b8609de -- Remember to Change HTTP

//bpa.dev.bulkmatic.com Client ID: d061a7b7-9171-4429-95ca-82a31ba05dee -- Remember to Change HTTPS
//bpa.dev.bulkmatic.com Tenant ID: 991f4767-0fc0-45de-ad5c-67233b5e488d -- Remember to Change HTTPS

//bpa.qa.bulkmatic.com Client ID:"62b8c433-ad92-4219-b64c-161c14a73da5", -- Remember to Change HTTPS -- Supports Localhost
//bpa.qa.bulkmatic.com Tenant ID: "991f4767-0fc0-45de-ad5c-67233b5e488d", -- Remember to Change HTTPS -- Supports Localhost
let redirecturl = `http://${window.location.host}`;
if (window.location.href.includes("https")) {
  redirecturl = `https://${window.location.host}`;
}

let currentSystemEnv = config.active_directory_env;

//let currentSystemClientID = "66756483-dfcd-4152-9132-6fcab08b39d1"; //commented for debugging
//let currentSystemcAuthority = "a494276d-ad3b-44d9-83b5-4ae7a8531c92"; //commented for debugging
let currentSystemClientID = "33d5afbb-6e2a-4628-8d5f-cfcb19dea2d4"; //new client id for test Login @12June2024
let currentSystemcAuthority = "443a10a6-5d7e-4491-9e28-019184388eec"; //new tenant id for test Login @12June2024

switch (currentSystemEnv) {
  case "qa":
    currentSystemClientID = "62b8c433-ad92-4219-b64c-161c14a73da5";
    currentSystemcAuthority = "991f4767-0fc0-45de-ad5c-67233b5e488d";
    break;
  case "dev":
    currentSystemClientID = "d061a7b7-9171-4429-95ca-82a31ba05dee";
    currentSystemcAuthority = "991f4767-0fc0-45de-ad5c-67233b5e488d";
    break;
  default:
    //currentSystemClientID = "66756483-dfcd-4152-9132-6fcab08b39d1"; old client id for onmicrosfot Login
    //currentSystemcAuthority = "a494276d-ad3b-44d9-83b5-4ae7a8531c92"; old tenant id for onmicrosfot Login
    currentSystemClientID = "33d5afbb-6e2a-4628-8d5f-cfcb19dea2d4"; //new client id for test Login @12June2024
    currentSystemcAuthority = "443a10a6-5d7e-4491-9e28-019184388eec"; //new tenant id for test Login @12June2024
    break;
}

export const msalConfig = {
  auth: {
    clientId: currentSystemClientID,
    authority: "https://login.microsoftonline.com/" + currentSystemcAuthority,
    redirectUri: redirecturl,
    postLogoutRedirectUri: redirecturl,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ["User.Read"],
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

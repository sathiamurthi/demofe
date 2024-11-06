import React from "react";
import { createRoot } from 'react-dom/client'
import App from "./App.js";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";




/**
 * Initialize a PublicClientApplication instance which is provided to the MsalProvider component
 * We recommend initializing this outside of your root component to ensure it is not re-initialized on re-renders
 */

/**
 * We recommend wrapping most or all of your components in the MsalProvider component. It's best to render the MsalProvider as close to the root as possible.
 */
createRoot(document.getElementById('root')).render(
    <React.StrictMode>
            <App />
    </React.StrictMode>,
);



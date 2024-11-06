import React, { useEffect, useContext, useState, createContext } from 'react';
import { useMsal, useAccount, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication,InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../../authConfig";
import { callMsGraph } from '../../appSession'
const ContextData = createContext()
export { ContextData };
function AppSession(props) {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [userAccountData, setuserAccountData] = useState({})
  const [isUserInfoReceived, setisUserInfoReceived] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  const getUserInfoMSGraph = async function (uniqueId) {
    const uniqueid = sessionStorage.getItem('uniqueid');
    const token = sessionStorage.getItem('accesstoken');
    // if (uniqueId) {
    //   // const userId = emailAddress.toString().split("@")[0];
    //   //This Part gets the User
    //   try {
    //     const user = await getUser(uniqueId);
    //     if (user.length === 0) {
    //       const userData = await callMsGraph(token);
    //       sessionStorage.setItem("appsession", userData[0]);
    //       setuserAccountData(userData[0]);
    //       setisUserInfoReceived(false);
    //     }
    //     else {
    //       sessionStorage.setItem("appsession", user[0]);
    //       setuserAccountData(user[0]);
    //       setisUserInfoReceived(true);
    //     }
    //   }
    //   catch (error) {
    //     console.error("Throwing an error object", error);
    //   }
    // }
  }
  useEffect(() => {
    if (isAuthenticated && account) {
      instance.acquireTokenSilent({
        ...loginRequest,
        account: account
      }).then((response) => {
        sessionStorage.setItem("accesstoken", response.accessToken);
        getUserInfoMSGraph(response.uniqueId);
      }).catch((error) => {
        console.error("Throwing an error object", error);
      })
    }
  }, [isAuthenticated, account])

  useEffect(() => {
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      instance.acquireTokenRedirect({
        ...loginRequest,
        account: account
      }).then((response) => {
        sessionStorage.setItem("accesstoken", response.accessToken);
       // getUserInfoMSGraph(response.uniqueId);
      })
    }
  }, [isAuthenticated, inProgress, instance]);

  return (
    <>
      {
        userAccountData !== undefined ? (
          <ContextData.Provider value={[userAccountData, setuserAccountData]}>
            {props.children}
          </ContextData.Provider>
        ) :
          (
            <div id="wrapper">
              {/* <Header></Header>
              <AppBar></AppBar> */}
              <div class="card" style="width: 18rem;">
                <div class="card-body">
                  <h5 class="card-title">Session Error</h5>
                  <h6 class="card-subtitle mb-2 text-muted">There is no user session!</h6>
                  <p class="card-text">Either your account is not valid or your account is yet to be created. Please try refreshing the page to initiate the session. If it does not work, please contact system administrator.</p>
                </div>
              </div>
            </div>
          )
      }
    </>
  );
}
export default AppSession;
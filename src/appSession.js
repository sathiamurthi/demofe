import axios from "axios";
import { graphConfig } from "./authConfig";

/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken 
 */
export async function callMsGraph(accessToken) {

    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };
    

    try {
        const graphData = await axios.get(graphConfig.graphMeEndpoint, options);
        if(graphData){
            return graphData;
        }
    } catch (err){
        console.error(err);
    }
}

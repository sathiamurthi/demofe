const appConfig = require("./Config.json");


let environment = appConfig.environment;
let dynamoDbPrefix = "";
let ApiEndPoint = "http://localhost:4000/api";
let ApiAdminEndPoint = "http://localhost:4000/admin-api";
let ApiEndForSamsara = "http://localhost:4000/external/api";
let ApiKey = "";
let ApiExternalEndPoint = ""; // Define ApiExternalEndPoint

switch (environment.toUpperCase()) {
    case "LOCAL":
        dynamoDbPrefix = "";
        ApiEndPoint = appConfig.local.apiUrl + "/api";
        ApiAdminEndPoint = appConfig.local.apiUrl + "/admin-api";
        ApiKey = appConfig.local.key;
        break;
    case "DEV":
        dynamoDbPrefix = "";
        ApiEndPoint = appConfig.dev.apiUrl + "/api";
        ApiAdminEndPoint = appConfig.dev.apiUrl + "/admin-api";
        ApiEndForSamsara = appConfig.dev.apiUrl + "/external/api";
        ApiKey = appConfig.dev.key;
        break;
    case "QA":
        dynamoDbPrefix = "";
        ApiEndPoint = appConfig.qa.apiUrl + "/api";
        ApiAdminEndPoint = appConfig.qa.apiUrl + "/admin-api";
        ApiEndForSamsara = appConfig.qa.apiUrl + "/external/api";
        ApiKey = appConfig.qa.key;
        break;
    case "LIVE":
        dynamoDbPrefix = "";
        ApiEndPoint = appConfig.live.apiUrl + "/api";
        ApiAdminEndPoint = appConfig.live.apiUrl + "/admin-api";
        ApiEndForSamsara = appConfig.live.apiUrl + "/external/api";
        ApiKey = appConfig.live.key;
        ApiExternalEndPoint = appConfig.live.apiUrl + "/external/api"; // Define here
        break;
}

export const BaseConfig = {
    dynamoDbPrefix: dynamoDbPrefix, // Updated to use variable
    ApiEndPoint: ApiEndPoint,
    ApiAdminEndPoint: ApiAdminEndPoint,
    ApiEndForSamsara: ApiEndForSamsara,
    ApiKey: ApiKey,
    ApiExternalEndPoint: ApiExternalEndPoint // Include in export
};

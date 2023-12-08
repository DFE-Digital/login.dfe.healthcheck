const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');
const constants = require('../constants/constants');

const {
  CONFIG_DEVICES_API_KEY, PROD_URL_KEYWORDS, CONFIG_API_TYPE, CONFIG_IDENTIFYING_PARTY_SECTION,
} = constants;

function trimTrailingSlash(str) {
  return str.replace(/\/+$/, '');
}

const getApiHealthCheck = async (apiService) => {
  const url = trimTrailingSlash(apiService?.url);
  try {
    const token = await jwtStrategy(apiService).getBearerToken();
    const response = await rp({
      method: 'GET',
      uri: `${url}/healthCheck`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      json: true,
    });

    return response;
  } catch (error) {
    throw new Error(error);
  }
};

const getIdentifyingPartyHealthcheck = async (url) => {
  try {
    const response = await rp({
      method: 'GET',
      uri: `${url}/healthcheck`,
      json: true,
    });

    return response;
  } catch (error) {
    throw new Error(error);
  }
};

// TODO: remove shouldCheckDevicesApi functionality after the Devices API decommisioning
const shouldCheckDevicesApi = (key, service) => key !== CONFIG_DEVICES_API_KEY || PROD_URL_KEYWORDS.some((keyword) => service?.url.includes(keyword));

const getApiConfig = (key, value) => {
  if (value instanceof Object) {
    const { type, service } = value;

    const shouldCheckDevicesAPI = shouldCheckDevicesApi(key, service);

    if (type === CONFIG_API_TYPE && service && shouldCheckDevicesAPI) {
      return service;
    }
  }
  return null;
};

const getIdentifyingPartyConfig = (key, value) => {
  if (key === CONFIG_IDENTIFYING_PARTY_SECTION || key === constants.CONFIG_OIDC_SECTION) {
    return value;
  }
  return null;
};

module.exports = {
  getApiHealthCheck, getIdentifyingPartyHealthcheck, getApiConfig, getIdentifyingPartyConfig, trimTrailingSlash,
};

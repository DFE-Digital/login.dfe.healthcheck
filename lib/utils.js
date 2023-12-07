const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');
const constants = require('../constants/constants');

const {
  CONFIG_DEVICES_API_KEY, PROD_URL_KEYWORDS, CONFIG_API_TYPE, CONFIG_IDENTIFYING_PARTY_SECTION,
} = constants;
const getHealthcheck = async (apiService, url, authToken = false) => {
  const token = authToken ? await jwtStrategy(apiService).getBearerToken() : undefined;

  return rp({
    method: 'GET',
    uri: `${url}/healthCheck`,
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
    json: true,
  });
};

// TODO: remove shouldCheckDevicesApi functionality after the Devices API decommisioning
const shouldCheckDevicesApi = (key, service) => key !== CONFIG_DEVICES_API_KEY || PROD_URL_KEYWORDS.some((keyword) => service.url.includes(keyword));

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
  if (key === CONFIG_IDENTIFYING_PARTY_SECTION || key === 'oidc') {
    return value;
  }
  return null;
};

function trimTrailingSlash(str) {
  return str.replace(/\/+$/, '');
}
module.exports = {
  getHealthcheck, getApiConfig, getIdentifyingPartyConfig, trimTrailingSlash,
};

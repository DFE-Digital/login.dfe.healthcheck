const rp = require('login.dfe.request-promise-retry');
const constants = require('../constants/constants');

const {
  CONFIG_DEVICES_API_KEY, PROD_URL_KEYWORDS, CONFIG_API_TYPE, CONFIG_IDENTIFYING_PARTY_SECTION,
} = constants;

function trimTrailingSlash(str) {
  return str.replace(/\/+$/, '');
}

const checkDependentServiceHealth = async (url) => {
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
const shouldCheckDevicesApi = (key, service) => key !== CONFIG_DEVICES_API_KEY || PROD_URL_KEYWORDS.some((keyword) => service?.url?.includes(keyword));

const getApiUrl = (key, value) => {
  if (value instanceof Object) {
    const { type, service } = value;

    const shouldCheckDevicesAPI = shouldCheckDevicesApi(key, service);

    if (type === CONFIG_API_TYPE && service && shouldCheckDevicesAPI) {
      return service.url || null;
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
  checkDependentServiceHealth,
  getApiUrl,
  getIdentifyingPartyConfig,
  trimTrailingSlash,
  shouldCheckDevicesApi,
};

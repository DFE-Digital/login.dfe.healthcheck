const rp = require('login.dfe.request-promise-retry');
const constants = require('../constants/constants');

const {
  CONFIG_DEVICES_API_KEY, CONFIG_API_TYPE, CONFIG_IDENTIFYING_PARTY_SECTION,
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

const getApiUrl = (key, value) => {
  if (value instanceof Object) {
    const { type, service } = value;
    // TODO: remove Devices API check skip functionality after the Devices API decommisioning - DSI-6365
    if (type === CONFIG_API_TYPE && service && (key !== CONFIG_DEVICES_API_KEY)) {
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
};

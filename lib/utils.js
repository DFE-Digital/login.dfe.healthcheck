const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const getHealthcheck = async (apiService, authToken = false) => {
  const token = authToken ? await jwtStrategy(apiService).getBearerToken() : undefined;

  return rp({
    method: 'GET',
    uri: `${apiService.url}/healthCheck`,
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
    json: true,
  });
};

const getApiConfig = (value) => {
  if (!(value instanceof Object)) {
    return null;
  }
  if (value.type === 'api' && value.service) {
    return value.service;
  }
  return null;
};

const getIdentifyingPartyConfig = (key, value) => {
  if (key === 'identifyingParty') {
    return value;
  }
  return null;
};
module.exports = { getHealthcheck, getApiConfig, getIdentifyingPartyConfig };

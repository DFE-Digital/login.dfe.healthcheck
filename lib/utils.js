const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const getHealthcheck = async (apiService, authToken = false) => {
  try {
    const token = authToken
      ? await jwtStrategy(apiService).getBearerToken()
      : undefined;

    const response = await rp({
      method: 'GET',
      uri: `${apiService.url}/healthCheck`,
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
      json: true,
    });

    if (response.statusCode === 404) {
      return undefined;
    }

    return response;
  } catch (error) {
    if (error.statusCode === 404) {
      return undefined;
    }

    if (error.statusCode === 401) {
      console.error('Unauthorized:', error.message);
    } else if (error.statusCode === 403) {
      console.error('Forbidden:', error.message);
    } else if (error.statusCode >= 500 && error.statusCode < 600) {
      console.error('Server Error:', error.message);
    }
    throw error;
  }
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

const { getHealthcheck, getApiConfig } = require('./utils');
const constants = require('../constants/constants');

const apiHealthCheck = async (key, value) => {
  const apiService = getApiConfig(key, value);
  if (!apiService || !apiService.url) {
    return null;
  }

  try {
    await getHealthcheck(apiService, apiService.url, true);

    return {
      key,
      type: value.type,
      status: constants.HEALTY_STATUS_MESSAGE,
    };
  } catch (error) {
    return {
      key,
      type: value.type,
      status: error.toString(),
    };
  }
};

module.exports = apiHealthCheck;

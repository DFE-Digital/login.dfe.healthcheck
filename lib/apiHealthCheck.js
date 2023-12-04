const { getHealthcheck, getApiConfig } = require('./utils');

const apiHealthCheck = async (key, value, path) => {
  const apiService = getApiConfig(value);
  if (!apiService || !apiService.url) {
    return null;
  }

  try {
    const status = await getHealthcheck(apiService, true);
    return {
      key,
      path,
      ...status,
    };
  } catch (error) {
    return {
      key,
      path,
      status: error.message,
    };
  }
};

module.exports = apiHealthCheck;

const { getHealthcheck, getApiConfig } = require('./utils');

const apiHealthCheck = async (key, value) => {
  const apiService = getApiConfig(value);
  if (!apiService || !apiService.url) {
    return null;
  }

  try {
    await getHealthcheck(apiService, true);

    return {
      service: key,
      type: value.type,
      status: 'ok',
    };
  } catch (error) {
    return {
      service: key,
      type: value.type,
      status: error.toString(),
    };
  }
};

module.exports = apiHealthCheck;

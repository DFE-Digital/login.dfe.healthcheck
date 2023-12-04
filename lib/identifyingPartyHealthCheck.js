const { getHealthcheck, getIdentifyingPartyConfig } = require('./utils');

const identifyingPartyHealthCheck = async (key, value, path) => {
  const apiService = getIdentifyingPartyConfig(key, value);
  if (!apiService || !apiService.url) {
    return null;
  }

  try {
    const status = await getHealthcheck(apiService);
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

module.exports = identifyingPartyHealthCheck;

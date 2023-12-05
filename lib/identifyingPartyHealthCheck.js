const { getHealthcheck, getIdentifyingPartyConfig } = require('./utils');

const identifyingPartyHealthCheck = async (key, value, path) => {
  const service = getIdentifyingPartyConfig(key, value);
  if (!service || !service.url) {
    return null;
  }

  try {
    await getHealthcheck(service);
    return {
      service: key,
      path,
      status: 'ok',
    };
  } catch (error) {
    return {
      key,
      path,
      status: error.toString(),
    };
  }
};

module.exports = identifyingPartyHealthCheck;

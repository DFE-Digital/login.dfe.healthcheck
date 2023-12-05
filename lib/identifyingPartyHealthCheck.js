const { getHealthcheck, getIdentifyingPartyConfig } = require('./utils');
const constants = require('../constants/constants');

const identifyingPartyHealthCheck = async (key, value) => {
  const service = getIdentifyingPartyConfig(key, value);
  if (!service || !service.url) {
    return null;
  }

  try {
    await getHealthcheck(service);
    return {
      key,
      type: key,
      status: constants.HEALTY_STATUS_MESSAGE,
    };
  } catch (error) {
    return {
      key,
      status: error.toString(),
    };
  }
};

module.exports = identifyingPartyHealthCheck;

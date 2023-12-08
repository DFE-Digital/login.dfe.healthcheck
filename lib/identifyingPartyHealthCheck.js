const { getIdentifyingPartyHealthcheck, trimTrailingSlash, getIdentifyingPartyConfig } = require('./utils');
const constants = require('../constants/constants');

const identifyingPartyHealthCheck = async (key, value) => {
  const service = getIdentifyingPartyConfig(key, value);
  if (service && (service.url || service.interactionBaseUrl)) {
    try {
      const url = service.url || service.interactionBaseUrl;
      const safeUrl = trimTrailingSlash(url);
      await getIdentifyingPartyHealthcheck(safeUrl);
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
  } else {
    return null;
  }
};

module.exports = identifyingPartyHealthCheck;

const { trimTrailingSlash, checkDependentServiceHealth, getApiUrl } = require('./utils');
const constants = require('../constants/constants');

const apiHealthCheck = async (key, value) => {
  const url = getApiUrl(key, value);
  if (!url) {
    return null;
  }

  const safeUrl = trimTrailingSlash(url);

  try {
    await checkDependentServiceHealth(safeUrl);

    return {
      key,
      type: value.type,
      status: constants.HEALTHY_STATUS_MESSAGE,
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

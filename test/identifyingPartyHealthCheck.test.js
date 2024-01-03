const identifyingPartyHealthCheck = require('../lib/identifyingPartyHealthCheck');
const { checkDependentServiceHealth, trimTrailingSlash, getIdentifyingPartyConfig } = require('../lib/utils');
const constants = require('../constants/constants');

jest.mock('../lib/utils', () => ({
  checkDependentServiceHealth: jest.fn(),
  trimTrailingSlash: jest.fn(),
  getIdentifyingPartyConfig: jest.fn(),
}));

describe('When checking identifyingPartyHealthCheck', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const key = 'identifyingParty';

  it('should return healthy status when identifying party health check is successful and the value object has url property', async () => {
    const value = {
      url: 'http://identifyingParty-url.com',
    };

    getIdentifyingPartyConfig.mockReturnValue(value);
    trimTrailingSlash.mockImplementation((url) => url);
    checkDependentServiceHealth.mockResolvedValue();

    const result = await identifyingPartyHealthCheck(key, value);

    expect(getIdentifyingPartyConfig).toHaveBeenCalledWith(key, value);
    expect(trimTrailingSlash).toHaveBeenCalledWith(value.url);
    expect(checkDependentServiceHealth).toHaveBeenCalledWith(value.url);
    expect(result).toEqual({
      key,
      type: key,
      status: constants.HEALTHY_STATUS_MESSAGE,
    });
  });

  it('should return healthy status when identifying party health check is successful and the value object has interactionBaseUrl property', async () => {
    const value = {
      interactionBaseUrl: 'http://identifyingParty-url.com',
    };

    getIdentifyingPartyConfig.mockReturnValue(value);
    trimTrailingSlash.mockImplementation((url) => url);
    checkDependentServiceHealth.mockResolvedValue();

    const result = await identifyingPartyHealthCheck(key, value);

    expect(getIdentifyingPartyConfig).toHaveBeenCalledWith(key, value);
    expect(trimTrailingSlash).toHaveBeenCalledWith(value.interactionBaseUrl);
    expect(checkDependentServiceHealth).toHaveBeenCalledWith(value.interactionBaseUrl);
    expect(result).toEqual({
      key,
      type: key,
      status: constants.HEALTHY_STATUS_MESSAGE,
    });
  });

  it('should return error status when identifying party health check fails', async () => {
    const value = {
      url: 'http://identifyingParty-url.com',
    };
    const errorMessage = 'Error occurred during health check';

    getIdentifyingPartyConfig.mockReturnValue(value);
    trimTrailingSlash.mockImplementation((url) => url);
    checkDependentServiceHealth.mockRejectedValue(new Error(errorMessage));

    const result = await identifyingPartyHealthCheck(key, value);

    expect(getIdentifyingPartyConfig).toHaveBeenCalledWith(key, value);
    expect(trimTrailingSlash).toHaveBeenCalledWith(value.url);
    expect(checkDependentServiceHealth).toHaveBeenCalledWith(value.url);
    expect(result).toEqual({
      key,
      status: new Error(errorMessage).toString(),
    });
  });

  it('should return null when identifying party configuration is missing', async () => {
    const value = {};

    getIdentifyingPartyConfig.mockReturnValue(null);

    const result = await identifyingPartyHealthCheck(key, value);

    expect(getIdentifyingPartyConfig).toHaveBeenCalledWith(key, value);
    expect(trimTrailingSlash).not.toHaveBeenCalled();
    expect(checkDependentServiceHealth).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when identifying party configuration has no URL or interactionBaseUrl property', async () => {
    const value = { baseUrl: 'http://identifyingParty-url.com' };

    getIdentifyingPartyConfig.mockReturnValue(value);

    const result = await identifyingPartyHealthCheck(key, value);

    expect(getIdentifyingPartyConfig).toHaveBeenCalledWith(key, value);
    expect(trimTrailingSlash).not.toHaveBeenCalled();
    expect(checkDependentServiceHealth).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

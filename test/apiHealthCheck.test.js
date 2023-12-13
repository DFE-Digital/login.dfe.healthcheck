const apiHealthCheck = require('../lib/apiHealthCheck');
const { checkDependentServiceHealth, getApiUrl, trimTrailingSlash } = require('../lib/utils');
const constants = require('../constants/constants');

jest.mock('../lib/utils', () => ({
  checkDependentServiceHealth: jest.fn(),
  getApiUrl: jest.fn(),
  trimTrailingSlash: jest.fn(),
}));

describe('When checking apiHealthCheck', () => {
  const key = 'dsi-api-service';
  const value = {
    service: {
      url: 'https://dsi-api-service.com',
    },
    type: constants.CONFIG_API_TYPE,
  };
  const { service } = value;

  beforeEach(() => {
    trimTrailingSlash.mockReset().mockImplementation((url) => url);
    getApiUrl.mockReset().mockReturnValue(service.url);
  });

  it('should return healthy status when API health check is successful', async () => {
    checkDependentServiceHealth.mockResolvedValue();

    const result = await apiHealthCheck(key, value);

    expect(getApiUrl).toHaveBeenCalledWith(key, value);
    expect(checkDependentServiceHealth).toHaveBeenCalledWith(service.url);
    expect(result).toEqual({
      key,
      type: value.type,
      status: constants.HEALTY_STATUS_MESSAGE,
    });
  });

  it('should return error when API health check fails', async () => {
    const errorMessage = 'Error occurred during health check';

    checkDependentServiceHealth.mockRejectedValue(new Error(errorMessage));

    const result = await apiHealthCheck(key, value);

    expect(getApiUrl).toHaveBeenCalledWith(key, value);
    expect(checkDependentServiceHealth).toHaveBeenCalledWith(service.url);
    expect(result).toEqual({
      key,
      type: value.type,
      status: new Error(errorMessage).toString(),
    });
  });

  it('should return null when API configuration is missing', async () => {
    getApiUrl.mockReset().mockReturnValue(null);

    const result = await apiHealthCheck(key, value);

    expect(getApiUrl).toHaveBeenCalledWith(key, value);
    expect(checkDependentServiceHealth).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when API configuration has no URL', async () => {
    value.service = {};

    getApiUrl.mockReset().mockReturnValue(null);

    const result = await apiHealthCheck(key, value);

    expect(getApiUrl).toHaveBeenCalledWith(key, value);
    expect(checkDependentServiceHealth).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

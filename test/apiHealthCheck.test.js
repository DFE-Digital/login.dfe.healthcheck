const apiHealthCheck = require('../lib/apiHealthCheck');
const { getApiHealthCheck, getApiConfig } = require('../lib/utils');
const constants = require('../constants/constants');

jest.mock('../lib/utils', () => ({
  getApiHealthCheck: jest.fn(),
  getApiConfig: jest.fn(),
}));

describe('When checking apiHealthCheck', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const key = 'dsi-api-service';
  const value = {
    service: {
      url: 'https://dsi-api-service.com',
    },
    type: constants.CONFIG_API_TYPE,
  };
  const { service } = value;

  it('should return healthy status when API health check is successful', async () => {
    getApiConfig.mockReturnValue(service);
    getApiHealthCheck.mockResolvedValue();

    const result = await apiHealthCheck(key, value);

    expect(getApiConfig).toHaveBeenCalledWith(key, value);
    expect(getApiHealthCheck).toHaveBeenCalledWith(service);
    expect(result).toEqual({
      key,
      type: value.type,
      status: constants.HEALTY_STATUS_MESSAGE,
    });
  });

  it('should return error when API health check fails', async () => {
    const errorMessage = 'Error occurred during health check';

    getApiConfig.mockReturnValue(service);
    getApiHealthCheck.mockRejectedValue(new Error(errorMessage));

    const result = await apiHealthCheck(key, value);

    expect(getApiConfig).toHaveBeenCalledWith(key, value);
    expect(getApiHealthCheck).toHaveBeenCalledWith(service);
    expect(result).toEqual({
      key,
      type: value.type,
      status: new Error(errorMessage).toString(),
    });
  });

  it('should return null when API configuration is missing', async () => {
    getApiConfig.mockReturnValue(null);

    const result = await apiHealthCheck(key, value);

    expect(getApiConfig).toHaveBeenCalledWith(key, value);
    expect(getApiHealthCheck).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when API configuration has no URL', async () => {
    const apiService = {};

    getApiConfig.mockReturnValue(apiService);

    const result = await apiHealthCheck(key, value);

    expect(getApiConfig).toHaveBeenCalledWith(key, value);
    expect(getApiHealthCheck).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

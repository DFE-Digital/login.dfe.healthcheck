const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const {
  CONFIG_DEVICES_API_KEY,
  PROD_URL_KEYWORDS,
  CONFIG_API_TYPE,
  CONFIG_IDENTIFYING_PARTY_SECTION,
  CONFIG_OIDC_SECTION,
  HEALTH_STATUS_UP,
} = require('../constants/constants');
const {
  trimTrailingSlash,
  shouldCheckDevicesApi,
  getApiConfig,
  getApiHealthCheck,
  getIdentifyingPartyConfig,
  getIdentifyingPartyHealthcheck,
} = require('../lib/utils');

jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');

describe('utils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('trimTrailingSlash function', () => {
    it('should trim trailing slashes at the end', () => {
      expect(trimTrailingSlash('http://example.com/')).toBe('http://example.com');
      expect(trimTrailingSlash('http://example.com//')).toBe('http://example.com');
      expect(trimTrailingSlash('/path/')).toBe('/path');
      expect(trimTrailingSlash('/path//')).toBe('/path');
    });

    it('should not modify strings without trailing slashes', () => {
      expect(trimTrailingSlash('http://example.com')).toBe('http://example.com');
      expect(trimTrailingSlash('/path')).toBe('/path');
      expect(trimTrailingSlash('no_slashes')).toBe('no_slashes');
    });

    it('should handle empty string', () => {
      expect(trimTrailingSlash('')).toBe('');
    });

    it('should handle multiple trailing slashes', () => {
      expect(trimTrailingSlash('http://example.com///')).toBe('http://example.com');
      expect(trimTrailingSlash('/path/////')).toBe('/path');
    });
  });

  describe('shouldCheckDevicesApi function', () => {
    it(`should return true when key is not '${CONFIG_DEVICES_API_KEY}'`, () => {
      const result = shouldCheckDevicesApi('dsi-test-api', { url: 'http://dsi-test-api.com' });
      expect(result).toBe(true);
    });

    it(`should return false when key is ${CONFIG_DEVICES_API_KEY} but URL does not include '${PROD_URL_KEYWORDS.join(', ')}' keywords`, () => {
      const result = shouldCheckDevicesApi(CONFIG_DEVICES_API_KEY, { url: 'http://example.dev' });
      expect(result).toBe(false);
    });

    it(`should return true when key is ${CONFIG_DEVICES_API_KEY} and URL includes '${PROD_URL_KEYWORDS.join(', ')}' keywords`, () => {
      const result = shouldCheckDevicesApi(CONFIG_DEVICES_API_KEY, { url: 'http://p01-devices-api.com' });
      expect(result).toBe(true);
    });

    it('should return false when service is undefined', () => {
      const result = shouldCheckDevicesApi(CONFIG_DEVICES_API_KEY, undefined);
      expect(result).toBe(false);
    });

    it('should return false when service url is undefined', () => {
      const result = shouldCheckDevicesApi(CONFIG_DEVICES_API_KEY, { url: undefined });
      expect(result).toBe(false);
    });
  });

  describe('getApiConfig function', () => {
    it('should return null when value is not an object', () => {
      const value = 'string-value';
      const result = getApiConfig('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it(`should return null when type is not '${CONFIG_API_TYPE}'`, () => {
      const value = { type: 'Sequelize', service: { url: 'http://test-api-service.com' } };
      const result = getApiConfig('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it('should return null when service object is not defined', () => {
      const value = { type: CONFIG_API_TYPE };
      const result = getApiConfig('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it('should return null when shouldCheckDevicesApi is false', () => {
      const value = { type: CONFIG_API_TYPE, service: { url: 'http://test-api-service.com' } };
      const result = getApiConfig('devices', value);

      expect(result).toBe(null);
    });
    it('should return null when shouldCheckDevicesApi is true but service is not defined', () => {
      const result = getApiConfig('dsi-test-api', { type: CONFIG_API_TYPE });

      expect(result).toBe(null);
    });

    it('should return service when all conditions are met', () => {
      const result = getApiConfig('test', { type: CONFIG_API_TYPE, service: { url: 'http://dsi-test-api.com' } });
      expect(result).toEqual({ url: 'http://dsi-test-api.com' });
    });
  });

  describe('getApiHealthCheck function', () => {
    const apiService = { url: 'http://dsi-test-api.com' };
    const token = 'test-token';
    const healthCheckResponse = {
      status: 'ok',
      details: [
        {
          key: 'connectionString',
          path: 'notifications.connectionString',
          status: 'ok',
        },
      ],
    };

    it('should successfully return health check response if auth token valid', async () => {
      jwtStrategy.mockReturnValue({ getBearerToken: jest.fn().mockResolvedValue(token) });
      rp.mockResolvedValue(healthCheckResponse);

      const result = await getApiHealthCheck(apiService);

      expect(jwtStrategy).toHaveBeenCalledWith(apiService);
      expect(rp).toHaveBeenCalledWith({
        method: 'GET',
        uri: `${apiService.url}/healthcheck`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        json: true,
      });
      expect(result).toEqual(healthCheckResponse);
    });

    it('should throw an error if there is an exception', async () => {
      const expectedError = new Error('Test error').toString();
      jwtStrategy.mockReturnValue({ getBearerToken: jest.fn().mockResolvedValue(token) });
      rp.mockRejectedValue(expectedError);

      await expect(getApiHealthCheck(apiService)).rejects.toThrow(expectedError);
    });

    it('should throw an error if auth token is not valid', async () => {
      const invalidTokenError = new Error('Not authorized').toString();
      jwtStrategy.mockReturnValue({ getBearerToken: jest.fn().mockRejectedValue(invalidTokenError) });

      await expect(getApiHealthCheck(apiService)).rejects.toThrow(invalidTokenError);
    });
  });

  describe('getIdentifyingPartyConfig function', () => {
    it(`should return value when key is '${CONFIG_IDENTIFYING_PARTY_SECTION}'`, () => {
      const key = CONFIG_IDENTIFYING_PARTY_SECTION;
      const value = { url: 'http://dsi-test-api.com', clientId: 'client-id' };

      const result = getIdentifyingPartyConfig(key, value);
      expect(result).toEqual(value);
    });

    it(`should return value when key is '${CONFIG_OIDC_SECTION}'`, () => {
      const key = CONFIG_OIDC_SECTION;
      const value = { interactionBaseUrl: 'http://dsi-test-api.com', clientId: 'client-id' };

      const result = getIdentifyingPartyConfig(key, value);
      expect(result).toEqual(value);
    });

    it(`should return null when key is neither '${CONFIG_IDENTIFYING_PARTY_SECTION}' nor '${CONFIG_OIDC_SECTION}'`, () => {
      const key = 'test-key';
      const value = { url: 'http://dsi-test-api.com', clientId: 'client-id' };

      const result = getIdentifyingPartyConfig(key, value);
      expect(result).toBeNull();
    });
  });

  describe('getIdentifyingPartyHealthcheck', () => {
    it('should successfully return health check response', async () => {
      const url = 'http://dsi-test-Identifying-party.com';
      const healthCheckResponse = {
        status: HEALTH_STATUS_UP,
      };

      rp.mockResolvedValue(healthCheckResponse);

      const result = await getIdentifyingPartyHealthcheck(url);

      expect(rp).toHaveBeenCalledWith({
        method: 'GET',
        uri: `${url}/healthcheck`,
        json: true,
      });
      expect(result).toEqual(healthCheckResponse);
    });

    it('should throw an error if there is an exception', async () => {
      const url = 'http://dsi-test-Identifying-party.com';
      const expectedError = new Error('Test error').toString();

      rp.mockRejectedValue(expectedError);

      await expect(getIdentifyingPartyHealthcheck(url)).rejects.toThrow(expectedError);
    });
  });
});

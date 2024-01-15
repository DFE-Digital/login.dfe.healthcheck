const rp = require('login.dfe.request-promise-retry');

const {
  CONFIG_DEVICES_API_KEY,

  CONFIG_API_TYPE,
  CONFIG_IDENTIFYING_PARTY_SECTION,
  CONFIG_OIDC_SECTION,
  HEALTH_STATUS_UP,
} = require('../constants/constants');
const {
  trimTrailingSlash,
  getApiUrl,
  checkDependentServiceHealth,
  getIdentifyingPartyConfig,

} = require('../lib/utils');

jest.mock('login.dfe.request-promise-retry');

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

  describe('getApiUrl function', () => {
    it('should return null when value is not an object', () => {
      const value = 'string-value';
      const result = getApiUrl('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it(`should return null when type is not '${CONFIG_API_TYPE}'`, () => {
      const value = { type: 'Sequelize', service: { url: 'http://test-api-service.com' } };
      const result = getApiUrl('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it('should return null when service object is not defined', () => {
      const value = { type: CONFIG_API_TYPE };
      const result = getApiUrl('dsi-test-api', value);
      expect(result).toBe(null);
    });

    it(`should return null when key is ${CONFIG_DEVICES_API_KEY}`, () => {
      const value = { type: CONFIG_API_TYPE, service: { url: 'http://test-api-service.com' } };
      const result = getApiUrl(CONFIG_DEVICES_API_KEY, value);

      expect(result).toBe(null);
    });

    it('should return null when service type is api but  service url is missing', () => {
      const result = getApiUrl('dsi-test-api', { type: CONFIG_API_TYPE, service: {} });

      expect(result).toBe(null);
    });

    it('should return the service url when all conditions are met', () => {
      const result = getApiUrl('test', { type: CONFIG_API_TYPE, service: { url: 'http://dsi-test-api.com' } });
      expect(result).toEqual('http://dsi-test-api.com');
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

  describe('checkDependentServiceHealth', () => {
    it('should successfully return health check response', async () => {
      const url = 'http://dsi-test-Identifying-party.com';
      const healthCheckResponse = {
        status: HEALTH_STATUS_UP,
      };

      rp.mockResolvedValue(healthCheckResponse);

      const result = await checkDependentServiceHealth(url);

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

      await expect(checkDependentServiceHealth(url)).rejects.toThrow(expectedError);
    });
  });
});

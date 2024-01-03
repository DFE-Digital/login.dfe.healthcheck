const Redis = require('ioredis');
const URL = require('url');
const constants = require('../constants/constants');

const {
  CONFIG_REDIS_URL_KEY,
  HEALTHY_STATUS_MESSAGE,
  CONFIG_CONNECTION_STRING_KEY,
  CONFIG_REDIS_CONNECTION_STRING_KEY,
  REDIS_PROTOCOL,
  CONFIG_REDIS_TYPE,
  REDIS_PORT_SECURE,
} = constants;

const getConnectionString = (key, value) => {
  if (key.toLowerCase() === CONFIG_REDIS_URL_KEY) {
    return value;
  }
  if ((key.toLowerCase() === CONFIG_CONNECTION_STRING_KEY || key.toLowerCase() === CONFIG_REDIS_CONNECTION_STRING_KEY)
  && value.toString().startsWith(REDIS_PROTOCOL)) {
    return value;
  }
  if (key.toLowerCase() === CONFIG_REDIS_TYPE && value instanceof Object && value.host && value.port) {
    const auth = value.auth ? `h:${value.auth}@` : '';
    return `redis://${auth}${value.host}:${value.port}`;
  }
  if (value instanceof Object && value.type === CONFIG_REDIS_TYPE && value.params) {
    const paramValues = Object.keys(value.params)
      .filter((k) => k.toLowerCase() !== CONFIG_CONNECTION_STRING_KEY)
      .map((k) => value.params[k]);
    const connectionString = paramValues.find((v) => v.toLowerCase().startsWith(REDIS_PROTOCOL));
    if (connectionString) {
      return connectionString;
    }
  }
  return null;
};

const getConnectionStatus = async (connectionString) => new Promise((resolve) => {
  try {
    const url = URL.parse(connectionString, true);
    if (!url.query.tls) {
      if (connectionString.includes(REDIS_PORT_SECURE)) {
        url.query.tls = true;
        connectionString = url.format(url);
      }
    }

    const client = new Redis(connectionString);
    client.on('ready', () => {
      try {
        client.disconnect();
      } catch (e) {
        resolve(e.toString());
      }
      resolve(HEALTHY_STATUS_MESSAGE);
    });
    client.on('error', (e) => {
      try {
        client.disconnect();
      } catch (e) {
        // swallow this as we expect disconnects to fail if connect also failed.
      }

      resolve(e.toString());
    });
  } catch (e) {
    resolve(e.toString());
  }
});

const redisCheck = async (key, value, path) => {
  const connectionString = getConnectionString(key, value);
  if (!connectionString) {
    return null;
  }

  const status = await getConnectionStatus(connectionString);
  return {
    key,
    path,
    type: CONFIG_REDIS_TYPE,
    status,
  };
};

redisCheck.getConnectionStatus = getConnectionStatus;

module.exports = redisCheck;

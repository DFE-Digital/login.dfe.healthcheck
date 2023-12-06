const Sequelize = require('sequelize');
const constants = require('../constants/constants');

const { Op } = Sequelize;

const {
  CONFIG_CONNECTION_STRING_KEY, POSTGRES_DIALECT, CONFIG_POSTGRES_URL_KEY, POSTGRES_CONNECTION_PREFIX, CONFIG_SEQUELIZE_TYPE, CONFIG_DATABASE_KEY,
} = constants;

const createSequelizeInstance = (params) => {
  const encryptDb = params.encrypt || true;

  const dbOpts = {
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      name: 'query',
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: params.host,
    dialect: params.dialect,
    operatorsAliases: Op,
    dialectOptions: {
      encrypt: encryptDb,
    },
  };

  if (params.pool) {
    dbOpts.pool = params.pool;
  }
  return new Sequelize(params.name || POSTGRES_DIALECT, params.username, params.password, dbOpts);
};

const getConnection = (key, value) => {
  if (key.toLowerCase() === CONFIG_POSTGRES_URL_KEY || (key.toLowerCase() === CONFIG_CONNECTION_STRING_KEY && value.toString().toLowerCase().startsWith(POSTGRES_CONNECTION_PREFIX))) {
    return new Sequelize(value);
  }

  if (value instanceof Object && value.type === CONFIG_SEQUELIZE_TYPE && value.params) {
    return createSequelizeInstance(value.params);
  }

  if (value instanceof Object && value.auditDb) {
    return createSequelizeInstance(value.auditDb);
  }

  if (key === CONFIG_DATABASE_KEY) {
    return createSequelizeInstance(value);
  }

  return null;
};

const sequelizeCheck = async (key, value, path) => {
  const connection = getConnection(key, value);

  if (!connection) {
    return null;
  }

  try {
    await connection.authenticate();

    return {
      key,
      path,
      type: CONFIG_SEQUELIZE_TYPE,
      status: constants.HEALTY_STATUS_MESSAGE,
    };
  } catch (e) {
    return {
      key,
      path,
      type: CONFIG_SEQUELIZE_TYPE,
      status: e.toString(),
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

module.exports = sequelizeCheck;

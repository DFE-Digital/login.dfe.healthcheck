const Sequelize = require('sequelize');

const { Op } = Sequelize;

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

  return new Sequelize(params.name || 'postgres', params.username, params.password, dbOpts);
};

const getConnection = (key, value) => {
  if (key.toLowerCase() === 'postgresurl' || (key.toLowerCase() === 'connectionstring' && value.toString().toLowerCase().startsWith('postgres://'))) {
    return createSequelizeInstance({ host: value });
  }

  if (value instanceof Object && value.type === 'sequelize' && value.params) {
    return createSequelizeInstance(value.params);
  }

  if (value instanceof Object && value.auditDb) {
    return createSequelizeInstance(value.auditDb);
  }

  if (key === 'database') {
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
      status: 'ok',
    };
  } catch (e) {
    return {
      key,
      path,
      status: e.message,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

module.exports = sequelizeCheck;

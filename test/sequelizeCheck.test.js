jest.mock('sequelize');

const Sequelize = require('sequelize');
const sequelizeCheck = require('../lib/sequelizeCheck');
const constants = require('../constants/constants');

const { CONFIG_CONNECTION_STRING_KEY, CONFIG_POSTGRES_URL_KEY, CONFIG_SEQUELIZE_TYPE } = constants;

describe('When running redis check', () => {
  let authenticate;

  beforeEach(() => {
    authenticate = jest.fn();
    close = jest.fn();
    Sequelize.mockReset();
    Sequelize.mockImplementation(() => ({
      authenticate,
      close,
    }));
  });

  it('then it should check if key is postgresurl', async () => {
    await sequelizeCheck(CONFIG_POSTGRES_URL_KEY, 'postgres://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('postgres://localhost');
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should check if key is connectionstring and value starts with postgres://', async () => {
    await sequelizeCheck(CONFIG_CONNECTION_STRING_KEY, 'postgres://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('postgres://localhost');
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should not check if key is connectionstring but value does not starts with postgres://', async () => {
    await sequelizeCheck(CONFIG_CONNECTION_STRING_KEY, 'redis://localhost', 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(0);
    expect(authenticate.mock.calls).toHaveLength(0);
  });

  it('then it should check if value has type of sequelize and params', async () => {
    const value = {
      type: CONFIG_SEQUELIZE_TYPE,
      params: {
        name: 'testdbname',
        username: 'test',
        password: 'password123',
        host: 'localhost',
        dialect: 'mssql',
        encrypt: true,
      },
    };
    await sequelizeCheck('somekey', value, 'path.to.key');

    expect(Sequelize.mock.calls).toHaveLength(1);
    expect(Sequelize.mock.calls[0][0]).toBe('testdbname');
    expect(Sequelize.mock.calls[0][1]).toBe('test');
    expect(Sequelize.mock.calls[0][2]).toBe('password123');
    expect(Sequelize.mock.calls[0][3]).toMatchObject({
      host: 'localhost',
      dialect: 'mssql',
      dialectOptions: {
        encrypt: true,
      },
    });
    expect(authenticate.mock.calls).toHaveLength(1);
  });

  it('then it should return status of ok if connection does not error', async () => {
    const actual = await sequelizeCheck(CONFIG_POSTGRES_URL_KEY, 'postgres://localhost', 'path.to.key');

    expect(actual).toMatchObject({
      key: CONFIG_POSTGRES_URL_KEY,
      path: 'path.to.key',
      status: constants.HEALTY_STATUS_MESSAGE,
    });
  });

  it('then it should return status of error messafe if connection does error', async () => {
    authenticate.mockImplementation(() => {
      throw new Error('some error message');
    });

    const actual = await sequelizeCheck(CONFIG_POSTGRES_URL_KEY, 'postgres://localhost', 'path.to.key');

    expect(actual).toMatchObject({
      key: CONFIG_POSTGRES_URL_KEY,
      path: 'path.to.key',
      status: 'Error: some error message',
    });
  });
});

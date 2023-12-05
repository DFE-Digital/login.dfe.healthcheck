const express = require('express');
const { flattenDeep } = require('lodash');
const redisCheck = require('./redisCheck');
const sequelizeCheck = require('./sequelizeCheck');
const apiHealthCheck = require('./apiHealthCheck');
const identifyingPartyHealthCheck = require('./identifyingPartyHealthCheck');

const router = express.Router();

const defaultOptions = {
  config: {},
  checks: [
    redisCheck,
    sequelizeCheck,
    apiHealthCheck,
    identifyingPartyHealthCheck,
  ],
};

const checkSection = async (section, checks, parent = '') => {
  const keys = Object.keys(section);
  const result = await Promise.all(keys.map(async (key) => {
    const value = section[key];
    const child = parent ? `${parent}.${key}` : key;

    let checkResults = await Promise.all(checks.map(async (check) => check(key, value, child, section)));
    if (value instanceof Object) {
      const sectionResults = await checkSection(value, checks, child);
      checkResults = checkResults.concat(sectionResults);
    }

    return checkResults;
  }));
  return result;
};

const healthCheck = (options) => {
  const safeOptions = { ...defaultOptions, ...options };

  router.get('/ping', async (req, res) => res.status(200).send());

  router.get('/', async (req, res) => {
    const result = flattenDeep(await checkSection(safeOptions.config, safeOptions.checks)).filter((x) => x != null);
    const hasFailures = result.filter((x) => x.status !== 'ok');
    if (hasFailures && hasFailures.length > 0) {
      res.status(500).send({
        status: 'down',
        details: hasFailures,
      });
    } else {
      res.status(200).send({
        status: 'up',
        details: result,
        version: options.version,
      });
    }
  });

  return router;
};

healthCheck.checks = {
  redisCheck,
  sequelizeCheck,
  defaultChecks: defaultOptions.checks,
};

module.exports = healthCheck;

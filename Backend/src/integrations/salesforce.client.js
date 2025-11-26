const jsforce = require('jsforce');
const { SF_LOGIN_URL, SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN } = require('../config/env');
const { logger } = require('../utils/logger');

async function getConnection() {
  if (!SF_USERNAME || !SF_PASSWORD || !SF_SECURITY_TOKEN) {
    throw new Error('Salesforce não configurado (.env incompleto)');
  }

  const conn = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL || 'https://login.salesforce.com'
  });

  await conn.login(SF_USERNAME, SF_PASSWORD + SF_SECURITY_TOKEN);
  logger.info('[Salesforce] Login realizado com sucesso');

  return conn;
}

module.exports = {
  getConnection
};

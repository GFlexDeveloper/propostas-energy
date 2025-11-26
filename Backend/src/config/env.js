require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: required('JWT_SECRET'),

  DB_HOST: required('DB_HOST'),
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: required('DB_USER'),
  DB_PASSWORD: required('DB_PASSWORD'),
  DB_DATABASE: required('DB_DATABASE'),

  OPENAI_API_KEY: required('OPENAI_API_KEY'),

  SF_LOGIN_URL: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
  SF_USERNAME: process.env.SF_USERNAME,
  SF_PASSWORD: process.env.SF_PASSWORD,
  SF_SECURITY_TOKEN: process.env.SF_SECURITY_TOKEN
};

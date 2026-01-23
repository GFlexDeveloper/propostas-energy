
const jsforce = require('jsforce');
require('dotenv').config();

async function getSalesforceConnection() {
    console.log("🔐 [Salesforce] Iniciando autenticação...");
   const sfConfig = {
        loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
        username: process.env.SF_USERNAME,
        password: process.env.SF_PASSWORD,
        token: process.env.SF_SECURITY_TOKEN || ''
    };
    if (!sfConfig.username || !sfConfig.password) {
        throw new Error('❌ [Salesforce] Credenciais (SF_USERNAME ou SF_PASSWORD) não definidas no .env');
    }
    const conn = new jsforce.Connection({
        loginUrl: sfConfig.loginUrl
    });

    try {
           await conn.login(sfConfig.username, sfConfig.password + sfConfig.token);
        
        console.log(`✅ [Salesforce] Login realizado com sucesso!`);
        console.log(`   - Org ID: ${conn.userInfo.organizationId}`);
        console.log(`   - User ID: ${conn.userInfo.id}`);

        return conn;

    } catch (error) {
        console.error("❌ [Salesforce] Erro crítico no Login:", error.message);
        throw error;
    }
}

module.exports = { getSalesforceConnection };
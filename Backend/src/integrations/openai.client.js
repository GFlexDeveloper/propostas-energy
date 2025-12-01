<<<<<<< HEAD
const OpenAI = require('openai');
const { OPENAI_API_KEY } = require('../config/env');

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

async function gerarTexto(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}

module.exports = {
  gerarTexto
};
=======
const OpenAI = require('openai');
const { OPENAI_API_KEY } = require('../config/env');

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

async function gerarTexto(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}

module.exports = {
  gerarTexto
};
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7

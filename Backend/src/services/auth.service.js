const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');
const tokenService = require('./token.service');
const { ValidationError } = require('../utils/errors');

async function registrar({ nome, email, senha }) {
  if (!nome || !email || !senha) {
    throw new ValidationError('nome, email e senha são obrigatórios');
  }

  const existente = await usuariosRepository.buscarPorEmail(email);
  if (existente) {
    throw new ValidationError('Já existe um usuário com esse e-mail');
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await usuariosRepository.criar({ nome, email, senhaHash });

  const token = tokenService.gerarToken({ id: usuario.id, email: usuario.email });

  return {
    success: true,
    message: 'Usuário registrado com sucesso',
    token
  };
}

async function login({ email, senha }) {
  if (!email || !senha) {
    throw new ValidationError('email e senha são obrigatórios');
  }

  const usuario = await usuariosRepository.buscarPorEmail(email);
  if (!usuario) {
    throw new ValidationError('Credenciais inválidas');
  }

  const ok = await bcrypt.compare(senha, usuario.senha_hash);
  if (!ok) {
    throw new ValidationError('Credenciais inválidas');
  }

  const token = tokenService.gerarToken({ id: usuario.id, email: usuario.email });

  return {
    success: true,
    token
  };
}

module.exports = {
  registrar,
  login
};

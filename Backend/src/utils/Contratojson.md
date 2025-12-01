"serviceOrder": {
  "idSalesforce": null,

  "status": "Aguardando Aprovação",
  "nomeConta": "Empresa XYZ LTDA",
  "categoriaConta": "Pessoa Jurídica",
  "email": "joao@example.com",
  "celular": "11988887777",

  "loginCemig": "login cemig",
  "senhaCemig": "senha cemig",
  "numeroOS": "OS-12345",

  "enderecoCobranca": {
    "rua": "Rua de cobrança 123",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "cep": "30000-000",
    "pais": "Brasil"
  },

  "cotacaoRelacionadaNumero": "00015356",
  "formaPagamento": "Boleto",
  "condicaoPagamento": "30/60/90",
  "concessionariaEnergia": "Cemig",

  "responsavel": {
    "nome": "Maria Responsável",
    "categoriaConta": "Pessoa Jurídica",
    "email": "maria@example.com",
    "endereco": "Rua X, 123",
    "cep": "30000-000",
    "cidade": "Belo Horizonte",
    "estado": "MG"
  },

  "clienteFinal": {
    "nome": "Cliente Final XYZ",
    "endereco": "Rua Y, 456",
    "cidade": "Uberlândia",
    "estado": "MG",
    "cpfCnpj": "12345678900",
    "email": "cliente@example.com",
    "dataNascimento": "1985-05-20",
    "estadoCivil": "Casado",
    "celular": "31999998888"
  },

  "instalacoes": {
    "quantidadeInstalacoes": 1,
    "periodoFidelidadeMeses": 36,
    "prazoDenunciaDias": 120,
    "participacaoLocacao": 0.0,
    "observacaoDesconto": "",
    "observacoesGerais": "Observações internas"
  },

  "aprovacao": {
    "etapaAprovacao": "Aguardando Aprovação",
    "dataAdequacao": "2026-03-01",
    "flags": {
      "contratoAtivoConcorrente": false,
      "usinaPropria": false
    }
  }
}

"quote": {
  "idSalesforce": null,

  "nomeCotacao": "Cotação GD - Empresa XYZ",
  "numeroCotacao": null,
  "dataValidade": "2026-02-15",
  "status": "Aceito",
  "descricao": "Cotação para GD 75kWp",

  "consumoKWh": 15000.0,
  "concessionariaEnergia": "Cemig",
  "nomeOportunidade": "GD - Empresa XYZ",
  "nomeConta": "Empresa XYZ LTDA",

  "tempoContratoMeses": 36,
  "faturaInicial": 180.0,
  "subtotal": 180.0,
  "descontoPercentual": 0.0,
  "valorSolucao": 180.0,
  "totalAbsoluto": 180.0,

  "enderecoEntrega": {
    "nomeDestino": "Empresa XYZ LTDA",
    "complemento": "Galpão 2",
    "nomeContato": "João da Silva",
    "emailContato": "joao@example.com",
    "telefoneContato": "11988887777"
  },

  "itensCotacao": [
    {
      "faseContaLuz": "Conta Convencional",
      "consumoKWh": 15000.0,
      "valorTarifa": 0.80,
      "fatorEncargos": 0.025,
      "encargos": 0.0,
      "produto": "Energia GD",
      "energiaACompensar": 12000.0,
      "custoDisponibilidade": 0.0,
      "faturaAntiga": 5200.0,
      "novaFaturaConcessionaria": 500.0,
      "novaContaCliente": 180.0,
      "economiaMensal": 4520.0,
      "economiaAnual": 54240.0
    }
  ]
}

"opportunity": {
  "idSalesforce": null,

  "nomeOportunidade": "GD - Empresa XYZ",
  "nomeConta": "Empresa XYZ LTDA",

  "faixaConsumo": "15.000 - 30.000 kWh",
  "categoriaConta": "Pessoa Jurídica",
  "pontosConexao": 2,
  "tipoContaLuz": "Convencional",
  "dataFechamento": "2026-01-31",

  "possuiContratoConcorrente": "Não",
  "etapaContrato": "Proposta Enviada",
  "temperaturaOportunidade": "Quente",
  "fase": "Proposta",            // StageName
  "tipo": "Nova Instalação",
  "valor": 50000.00,
  "probabilidade": 70,

  "concessionariaEnergia": "Cemig",
  "consumoDeclarado_kW": 500.0,
  "consumoKWh": 15000.0,
  "origemLead": "Website",
  "descricao": "Descrição da oportunidade"
}

"contact": {
  "idSalesforce": null,

  "primeiroNome": "João",
  "sobrenome": "Silva",
  "tratamento": "Sr.",

  "email": "joao@example.com",
  "celular": "11988887777",
  "telefone": "1133334444",
  "cargo": "Diretor",
  "departamento": "Financeiro",

  "concessionariaEnergia": "Cemig",
  "contaNome": "Empresa XYZ LTDA" // ajuda o Apex a ligar Account
}

"account": {
  "idSalesforce": null,

  "nomeConta": "Empresa XYZ LTDA",
  "categoriaConta": "Pessoa Jurídica",
  "cnpj": "12345678000199",
  "possuiContratoConcorrente": "Não",
  "fimFidelidade": "2026-12-31",
  "site": "https://empresa.com",

  "concessionariaEnergia": "Cemig",
  "parceiroReferencia": "Abrasel",
  "tipoContaLuz": "Convencional",
  "setor": "Supermercado",
  "consumoKWh": 15000.0,
  "atividadeConta": "Ativa",
  "origemConta": "Website",

  "telefone": "3133334444",

  "enderecoCobranca": {
    "rua": "Rua de cobrança 123",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "cep": "30000-000",
    "pais": "Brasil"
  },

  "descricao": "Descrição da conta"
}

"lead": {
  "idSalesforce": null,

  "nomeCompleto": "João da Silva",
  "primeiroNome": "João",
  "sobrenome": "Silva",
  "tratamento": "Sr.",

  "empresa": "Empresa XYZ LTDA",
  "cargo": "Diretor",
  "telefone": "1133334444",
  "celular": "11988887777",
  "email": "joao@example.com",
  "site": "https://empresa.com",

  "setor": "Supermercado",
  "origemLead": "Website",
  "statusLead": "Aberto - Sem contato",
  "classificacao": "Quente",

  "categoriaLead": "Pessoa Juridica",
  "interesseComercial": "Venda",
  "obrigatoriedade": "Sim",
  "tipoLeadMedicoes": null,
  "tipoLeadGF2": null,

  "empresaProprietaria": "Flex Energy",
  "captador": "Franz",
  "vendedoresExternosFlexEnergy": "Gustavo Carabina",

  "cpf": "12345678901",
  "cnpj": "12345678000199",
  "temInscricaoEstadual": "Sim",
  "inscricaoEstadual": "123456789",

  "numeroInstalacao": 12345678901,
  "numeroCliente": 98765432101,
  "consumoDeclarado_kW": 500.00,
  "faturaConcessionaria": 200.00,

  "concessionariaEnergia": "Cemig",
  "parceiroReferencia": "Abrasel",
  "feiraOrigem": null,

  "endereco": {
    "rua": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01000-000",
    "pais": "Brasil",
    "numero": "123",
    "complemento": "Apto 45"
  },

  "mensagem": "Mensagem comercial curta",
  "descricao": "Descrição mais longa",
  "regiaoIBGE": "1",
  "motivoDescarte": null,
  "etapaContato": "1º Contato"
}

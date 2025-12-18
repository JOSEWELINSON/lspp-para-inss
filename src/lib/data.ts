export type Benefit = {
  id: string;
  title: string;
  category: string;
  description: string;
  requirements: string[];
};

export const benefits: Benefit[] = [
  {
    id: 'aposentadoria-idade',
    title: 'Aposentadoria por Idade',
    category: 'Aposentadorias',
    description: 'Benefício para trabalhadores que atingem a idade mínima e tempo de contribuição.',
    requirements: ['Idade mínima: 65 anos (homens) ou 62 anos (mulheres)', 'Tempo de contribuição: 15 anos', 'Carência de 180 contribuições mensais'],
  },
  {
    id: 'auxilio-doenca',
    title: 'Auxílio por Incapacidade Temporária',
    category: 'Auxílios',
    description: 'Benefício para segurados que ficam temporariamente incapacitados para o trabalho por motivo de doença ou acidente.',
    requirements: ['Incapacidade temporária para o trabalho', 'Qualidade de segurado do INSS', 'Carência de 12 contribuições mensais (exceto para acidentes)'],
  },
  {
    id: 'salario-maternidade',
    title: 'Salário-Maternidade',
    category: 'Salários',
    description: 'Benefício para pessoas que se afastam do trabalho por motivo de nascimento de filho, adoção ou guarda judicial.',
    requirements: ['Qualidade de segurado', 'Carência variável conforme o tipo de segurado'],
  },
  {
    id: 'pensao-morte',
    title: 'Pensão por Morte',
    category: 'Pensões',
    description: 'Benefício pago aos dependentes do segurado do INSS que falece.',
    requirements: ['Óbito do segurado', 'Qualidade de segurado do falecido na data do óbito', 'Qualidade de dependente'],
  },
];

export type RequestStatus = 'Em análise' | 'Exigência' | 'Deferido' | 'Indeferido' | 'Compareça presencialmente';

export type UserRequest = {
  id: string;
  protocol: string;
  benefitTitle: string;
  requestDate: string;
  status: RequestStatus;
  user: {
    name: string;
    cpf: string;
  };
  exigencia?: {
    text: string;
    createdAt: string;
    response?: {
      text: string;
      files: string[];
      respondedAt: string;
    }
  }
};

export const mockUser = {
  name: "Usuário",
  email: "usuario@example.com",
  cpf: "000.000.000-00",
  birthDate: "1990-01-01",
  phone: "(00) 00000-0000",
  address: "Endereço do usuário",
};

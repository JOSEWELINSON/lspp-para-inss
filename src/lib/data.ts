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
  }
};

export const userRequests: UserRequest[] = [
    {
        id: '1',
        protocol: '202401-001',
        benefitTitle: 'Auxílio por Incapacidade Temporária',
        requestDate: '2024-05-10',
        status: 'Em análise',
        user: {
            name: 'João da Silva',
            cpf: '123.456.789-00'
        }
    },
    {
        id: '2',
        protocol: '202401-002',
        benefitTitle: 'Aposentadoria por Idade',
        requestDate: '2024-05-08',
        status: 'Exigência',
        user: {
            name: 'Maria Oliveira',
            cpf: '987.654.321-00'
        }
    },
    {
        id: '3',
        protocol: '202401-003',
        benefitTitle: 'Salário-Maternidade',
        requestDate: '2024-04-20',
        status: 'Deferido',
        user: {
            name: 'Ana Souza',
            cpf: '111.222.333-44'
        }
    },
    {
        id: '4',
        protocol: '202401-004',
        benefitTitle: 'Pensão por Morte',
        requestDate: '2024-03-15',
        status: 'Indeferido',
        user: {
            name: 'Carlos Pereira',
            cpf: '555.666.777-88'
        }
    },
    {
        id: '5',
        protocol: '202401-005',
        benefitTitle: 'Auxílio por Incapacidade Temporária',
        requestDate: '2024-05-12',
        status: 'Compareça presencialmente',
        user: {
            name: 'Juliana Costa',
            cpf: '999.888.777-66'
        }
    }
];

export const mockUser = {
  name: "João da Silva",
  email: "joao.silva@example.com",
  cpf: "123.456.789-00",
  birthDate: "1980-01-15",
  phone: "(11) 98765-4321",
  address: "Rua das Flores, 123, São Paulo, SP",
};

export const myRequests: UserRequest[] = userRequests.filter(r => r.user.cpf === mockUser.cpf);

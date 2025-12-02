

import { DocumentMetadata, DocumentType, Qualification, User, UserRole, WorkflowStatus, Language, Project, BoxConfig } from './types';
import { FileText, DraftingCompass, HardHat, UserCheck, Shield, Users, Briefcase } from 'lucide-react';
import React from 'react';

export const MOCK_PROJECTS: Project[] = [
    { 
        id: 'proj-001', 
        name: 'Subestação Xingu 500kV', 
        code: 'TEMP-GE-VE',
        wbs: 'WBS-XINGU-001',
        substation: 'SE Xingu',
        directClient: 'Transmissora Energia',
        finalClient: 'ONS'
    },
    { 
        id: 'proj-002', 
        name: 'Linha de Transmissão Norte', 
        code: 'LT-NORTE',
        wbs: 'WBS-LT-002',
        substation: 'LT Norte Lote A',
        directClient: 'Consórcio Norte',
        finalClient: 'ANEEL'
    }
];

export const INITIAL_BOX_CONFIG: BoxConfig = {
    clientId: 'box_client_id_placeholder',
    clientSecret: '****************',
    enterpriseId: '123456789',
    publicKeyId: 'key_id_123'
};

export const MOCK_USERS: User[] = [
  { 
    id: '0', 
    email: 'admin@ge.com',
    name: 'Super Admin', 
    roles: [UserRole.ADMIN], 
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff',
    projectId: undefined // Global Access
  },
  { 
    id: '1', 
    email: 'alice@ge.com',
    name: 'Alice Silva (Líder)', 
    roles: [UserRole.TECH_LEADER], 
    avatar: 'https://picsum.photos/id/1011/200',
    projectId: 'proj-001'
  },
  { 
    id: '2', 
    email: 'bob@ge.com',
    name: 'Bob Santos', 
    roles: [UserRole.DESIGNER], 
    avatar: 'https://picsum.photos/id/1005/200',
    projectId: 'proj-001'
  },
  { 
    id: '3', 
    email: 'carol@client.com',
    name: 'Carol Client', 
    roles: [UserRole.CLIENT], 
    avatar: 'https://picsum.photos/id/1027/200',
    projectId: 'proj-001'
  },
  { 
    id: '4', 
    email: 'dave@ge.com',
    name: 'Dave Manager', 
    roles: [UserRole.READER], 
    avatar: 'https://picsum.photos/id/1012/200',
    projectId: 'proj-002' 
  },
];

export const DEFAULT_DISCIPLINES = [
  'Elétrico - EL',
  'Civil - CV',
  'Eletromecânico - EM',
  'Geral - GE',
  'Gerenciamento - MG'
];

export const DEFAULT_NATURES = [
  'Ata de Reunião - AT',
  'Backup - BK',
  'Configuração - CO',
  'Data Book - DB',
  'Diagrama Construtivo / Topográfico - DCT',
  'Diagrama de Interligação - DI',
  'Diagrama Funcional / Lógico - DFL',
  'Especificação Técnica - ET',
  'Estudo de Seletividade - ES',
  'Lista de Cabos - LC',
  'Lista de Materiais - LM',
  'Lista de Verificação - LV',
  'Manual de Instalação e Manutenção - MI',
  'Manual de Operação - MO',
  'Manual de Treinamento - MT',
  'Memorial Descritivo - MD',
  'Plano de Inspeção e Testes - PIT',
  'Plano de Qualidade - PQ',
  'Plano de Treinamento - PL',
  'Procedimento de Testes - PT',
  'Relatório de Adequação - RAD',
  'Relatório de Análise - RA',
  'Relatório dos Testes - RT'
].sort(); // Sorted alphabetically

export const DEFAULT_ISSUERS = [
    'Engenharia Interna',
    'Fornecedor A',
    'Consórcio',
    'Cliente'
];

export const INITIAL_DOCUMENTS: DocumentMetadata[] = [
  {
    id: 'doc-001',
    projectId: 'proj-001',
    code: 'GE-VE-EL-001',
    geCode: 'GE-001-X',
    title: 'Diagrama Unifilar Subestação A',
    type: DocumentType.TECHNICAL,
    discipline: 'Elétrico - EL',
    nature: 'Diagrama Funcional / Lógico - DFL',
    emitente: 'Engenharia Interna',
    currentVersion: '0A',
    currentStatus: WorkflowStatus.ANALYSIS_CLIENT,
    currentQualification: Qualification.NONE,
    lastModified: '2023-10-25T14:30:00Z',
    isLocked: true,
    forecastDate: '2023-10-30',
    versions: [
      {
        version: '0A',
        status: WorkflowStatus.ANALYSIS_CLIENT,
        qualification: Qualification.NONE,
        updatedAt: '2023-10-25T14:30:00Z',
        updatedBy: 'Alice Silva',
        updatedByRole: UserRole.TECH_LEADER,
        fileUrl: '#',
        comments: 'Emitido para aprovação do cliente. GRD-0045 gerada.'
      }
    ]
  },
  {
    id: 'doc-002',
    projectId: 'proj-001',
    code: 'GE-VE-CV-015',
    title: 'Base de Concreto Transformador T1',
    type: DocumentType.TECHNICAL,
    discipline: 'Civil - CV',
    nature: 'Diagrama Construtivo / Topográfico - DCT',
    emitente: 'Engenharia Interna',
    currentVersion: '0B',
    currentStatus: WorkflowStatus.EVALUATION_LT,
    currentQualification: Qualification.RE,
    lastModified: '2023-10-26T09:15:00Z',
    isLocked: false,
    forecastDate: '2023-10-24', // Overdue mock
    versions: [
      {
        version: '0A',
        status: WorkflowStatus.MODERATION_LT,
        qualification: Qualification.RE,
        updatedAt: '2023-10-20T10:00:00Z',
        updatedBy: 'Carol Client',
        updatedByRole: UserRole.CLIENT,
        fileUrl: '#',
        comments: 'Reforçar ferragem da sapata.'
      },
      {
        version: '0B',
        status: WorkflowStatus.EVALUATION_LT,
        qualification: Qualification.NONE,
        updatedAt: '2023-10-26T09:15:00Z',
        updatedBy: 'Bob Santos',
        updatedByRole: UserRole.DESIGNER,
        fileUrl: '#',
        comments: 'Ajustes realizados conforme solicitado.'
      }
    ]
  },
  {
    id: 'doc-003',
    projectId: 'proj-001',
    code: 'GE-VE-MC-099',
    title: 'Arranjo Mecânico Geral',
    type: DocumentType.TECHNICAL,
    discipline: 'Eletromecânico - EM',
    nature: 'Diagrama Construtivo / Topográfico - DCT',
    emitente: 'Fornecedor A',
    currentVersion: '00',
    currentStatus: WorkflowStatus.EXECUTION,
    currentQualification: Qualification.AP,
    lastModified: '2023-10-01T08:00:00Z',
    isLocked: true,
    versions: [
      {
        version: '00',
        status: WorkflowStatus.EXECUTION,
        qualification: Qualification.AP,
        updatedAt: '2023-10-01T08:00:00Z',
        updatedBy: 'Carol Client',
        updatedByRole: UserRole.CLIENT,
        fileUrl: '#',
        comments: 'Aprovado para execução.'
      }
    ]
  },
  {
    id: 'doc-004',
    projectId: 'proj-002',
    code: 'LT-NORTE-001',
    title: 'Traçado Básico LT',
    type: DocumentType.TECHNICAL,
    discipline: 'Civil - CV',
    nature: 'Diagrama Construtivo / Topográfico - DCT',
    emitente: 'Engenharia Interna',
    currentVersion: '0A',
    currentStatus: WorkflowStatus.DRAFT,
    currentQualification: Qualification.NONE,
    lastModified: '2023-10-01T08:00:00Z',
    isLocked: false,
    versions: []
  }
];

export const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  [UserRole.ADMIN]: <Shield className="w-4 h-4 text-purple-600" />,
  [UserRole.TECH_LEADER]: <UserCheck className="w-4 h-4 text-green-600" />,
  [UserRole.DESIGNER]: <DraftingCompass className="w-4 h-4 text-blue-600" />,
  [UserRole.CLIENT]: <Users className="w-4 h-4 text-orange-600" />,
  [UserRole.READER]: <FileText className="w-4 h-4 text-gray-600" />
};

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [WorkflowStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [WorkflowStatus.EVALUATION_LT]: 'bg-orange-100 text-orange-800',
  [WorkflowStatus.ANALYSIS_CLIENT]: 'bg-purple-100 text-purple-800',
  [WorkflowStatus.MODERATION_LT]: 'bg-red-100 text-red-800',
  [WorkflowStatus.EXECUTION]: 'bg-green-100 text-green-800',
  [WorkflowStatus.AS_BUILT]: 'bg-blue-100 text-blue-800',
  [WorkflowStatus.ARCHIVED]: 'bg-gray-300 text-gray-600',
  [WorkflowStatus.CANCELLED]: 'bg-red-200 text-red-900',
};

// TRANSLATION DICTIONARY
export const TRANSLATIONS: Record<Language, any> = {
  PT: {
    login: {
        title: 'Entrar no Nova Archive',
        email: 'E-mail',
        password: 'Senha',
        button: 'Acessar Sistema',
        forgot: 'Esqueceu a senha?'
    },
    nav: {
      dashboard: 'Dashboard',
      technical: 'Doc. Técnicos',
      managerial: 'Doc. Gerenciais',
      grd: 'GRD (Guias)',
      settings: 'Configurações',
      documentation: 'DOCUMENTAÇÃO',
      system: 'SISTEMA',
      switchUser: 'Alternar Usuário',
      logout: 'Sair'
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Visão geral do projeto',
      total: 'Total Documentos',
      inProgress: 'Em Andamento',
      pending: 'Pendência Cliente',
      execution: 'Liberado Obra',
      myTasks: 'Minhas Tarefas',
      overdue: 'Vencidos',
      upcoming: 'A Vencer',
      statusChart: 'Status dos Documentos',
      lifecycleChart: 'Ciclo de Vida'
    },
    list: {
      searchPlaceholder: 'Buscar por código, título...',
      filters: 'Filtros:',
      allStatus: 'Todos os Status',
      allDisciplines: 'Todas Disciplinas',
      version: 'Versão...',
      clear: 'Limpar',
      columns: 'Colunas',
      newDoc: 'Novo Documento',
      headers: {
        code: 'Código',
        title: 'Título',
        discipline: 'Disciplina',
        nature: 'Natureza',
        version: 'Versão',
        status: 'Status',
        updated: 'Última Modif.',
        action: 'Ação',
        geCode: 'Cód. GE',
        accessCode: 'Cód. Acessada',
        issuer: 'Emitente'
      },
      batch: {
        selected: 'selecionados',
        cancel: 'Cancelar',
        confirm: 'Confirmar Processamento'
      }
    },
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar'
    },
    fields: {
        title: 'Título',
        geCode: 'Código GE Vernova',
        accessCode: 'Código Acessada',
        emitente: 'Emitente',
        discipline: 'Disciplina',
        nature: 'Natureza',
        tafTac: 'TAF/TAC',
        forecastDate: 'Previsão Emissão',
        informative: 'Informativo',
        asBuilt: 'As Built'
    }
  },
  ES: {
    login: {
        title: 'Entrar en Nova Archive',
        email: 'Correo electrónico',
        password: 'Contraseña',
        button: 'Acceder al Sistema',
        forgot: '¿Olvidaste tu contraseña?'
    },
    nav: {
      dashboard: 'Tablero',
      technical: 'Doc. Técnicos',
      managerial: 'Doc. Gerenciales',
      grd: 'Guías (GRD)',
      settings: 'Configuraciones',
      documentation: 'DOCUMENTACIÓN',
      system: 'SISTEMA',
      switchUser: 'Cambiar Usuario',
      logout: 'Salir'
    },
    dashboard: {
      title: 'Tablero',
      subtitle: 'Visión general del proyecto',
      total: 'Total Documentos',
      inProgress: 'En Progreso',
      pending: 'Pendiente Cliente',
      execution: 'Liberado Obra',
      myTasks: 'Mis Tareas',
      overdue: 'Vencidos',
      upcoming: 'Por Vencer',
      statusChart: 'Estado de Documentos',
      lifecycleChart: 'Ciclo de Vida'
    },
    list: {
      searchPlaceholder: 'Buscar por código, título...',
      filters: 'Filtros:',
      allStatus: 'Todos los Estados',
      allDisciplines: 'Todas Disciplinas',
      version: 'Versión...',
      clear: 'Limpiar',
      columns: 'Columnas',
      newDoc: 'Nuevo Documento',
      headers: {
        code: 'Código',
        title: 'Título',
        discipline: 'Disciplina',
        nature: 'Naturaleza',
        version: 'Versión',
        status: 'Estado',
        updated: 'Últ. Modif.',
        action: 'Acción',
        geCode: 'Cód. GE',
        accessCode: 'Cód. Acessada',
        issuer: 'Emisor'
      },
      batch: {
        selected: 'seleccionados',
        cancel: 'Cancelar',
        confirm: 'Confirmar Procesamiento'
      }
    },
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar'
    },
    fields: {
        title: 'Título',
        geCode: 'Código GE Vernova',
        accessCode: 'Código Acessada',
        emitente: 'Emisor',
        discipline: 'Disciplina',
        nature: 'Naturaleza',
        tafTac: 'TAF/TAC',
        forecastDate: 'Previsión Emisión',
        informative: 'Informativo',
        asBuilt: 'As Built'
    }
  },
  EN: {
    login: {
        title: 'Login to Nova Archive',
        email: 'Email',
        password: 'Password',
        button: 'Access System',
        forgot: 'Forgot password?'
    },
    nav: {
      dashboard: 'Dashboard',
      technical: 'Tech Docs',
      managerial: 'Mgmt Docs',
      grd: 'Transmittals (GRD)',
      settings: 'Settings',
      documentation: 'DOCUMENTATION',
      system: 'SYSTEM',
      switchUser: 'Switch User',
      logout: 'Logout'
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Project Overview',
      total: 'Total Documents',
      inProgress: 'In Progress',
      pending: 'Client Pending',
      execution: 'Released',
      myTasks: 'My Tasks',
      overdue: 'Overdue',
      upcoming: 'Upcoming',
      statusChart: 'Document Status',
      lifecycleChart: 'Lifecycle'
    },
    list: {
      searchPlaceholder: 'Search by code, title...',
      filters: 'Filters:',
      allStatus: 'All Statuses',
      allDisciplines: 'All Disciplines',
      version: 'Version...',
      clear: 'Clear',
      columns: 'Columns',
      newDoc: 'New Document',
      headers: {
        code: 'Code',
        title: 'Title',
        discipline: 'Discipline',
        nature: 'Nature',
        version: 'Version',
        status: 'Status',
        updated: 'Last Mod.',
        action: 'Action',
        geCode: 'GE Code',
        accessCode: 'Access Code',
        issuer: 'Issuer'
      },
      batch: {
        selected: 'selected',
        cancel: 'Cancel',
        confirm: 'Confirm Processing'
      }
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm'
    },
    fields: {
        title: 'Title',
        geCode: 'GE Code',
        accessCode: 'Access Code',
        emitente: 'Issuer',
        discipline: 'Discipline',
        nature: 'Nature',
        tafTac: 'TAF/TAC',
        forecastDate: 'Forecast Date',
        informative: 'Informative',
        asBuilt: 'As Built'
    }
  }
};
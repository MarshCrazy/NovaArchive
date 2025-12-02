

export enum UserRole {
  ADMIN = 'Super Admin (Sistema)', // System Admin: Box Config, Global Projects, All Access
  TECH_LEADER = 'Líder Téc. (Admin Proj)', // Project Admin: Workflow, Project Users
  DESIGNER = 'Projetista',
  CLIENT = 'Cliente',
  READER = 'Leitor'
}

export type Language = 'PT' | 'ES' | 'EN';

export enum DocumentType {
  TECHNICAL = 'Técnico',
  MANAGERIAL = 'Gerencial',
  GRD = 'GRD'
}

export enum WorkflowStatus {
  DRAFT = 'Em Rascunho',
  IN_REVIEW = 'Em Revisão', // Internal revision
  EVALUATION_LT = 'Em Avaliação (LT)',
  ANALYSIS_CLIENT = 'Em Análise Cliente',
  MODERATION_LT = 'Em Análise LT (Moderação)',
  EXECUTION = 'Em Execução',
  AS_BUILT = 'As Built',
  ARCHIVED = 'Arquivado',
  CANCELLED = 'Cancelado'
}

export enum Qualification {
  NONE = '-',
  AP = 'AP (Aprovado)',
  AC = 'AC (Aprovado c/ Comentários)',
  RE = 'RE (Reprovado)',
  CA = 'CA (Cancelado)',
  IF = 'IF (Informativo)',
  AS = 'AS (As Built)'
}

export interface DocumentVersion {
  version: string; // 0A, 0B, 00, 01, etc.
  status: WorkflowStatus;
  qualification: Qualification;
  updatedAt: string;
  updatedBy: string; // User ID or Name
  updatedByRole?: string; // New field for role tracking
  fileUrl: string; // Mock Box Link
  comments?: string;
  attachmentName?: string; // New field for commented file
}

export interface DocumentMetadata {
  id: string;
  projectId: string; // Link to Project
  code: string;
  title: string;
  type: DocumentType;
  discipline: string;
  nature: string;
  currentVersion: string;
  currentStatus: WorkflowStatus;
  currentQualification: Qualification;
  lastModified: string;
  versions: DocumentVersion[];
  emitente: string; // Issuer
  isLocked: boolean; // Locked during review
  
  // New Fields
  geCode?: string; // Código GE Vernova
  accessCode?: string; // Código da Acessada
  
  informative?: boolean;
  asBuilt?: boolean;
  forecastDate?: string; // Used as Deadline
  tafTac?: string;
}

export interface Project {
    id: string;
    name: string;
    code: string;
    description?: string;
    // New Mandatory Fields
    wbs: string;
    substation: string; // Nome da Subestação/Lote
    directClient: string;
    finalClient: string;
}

export interface User {
  id: string;
  email: string; // Login ID
  name: string;
  roles: UserRole[]; 
  avatar: string;
  projectId?: string; // If null, can see all (Super Admin), else restricted
}

export interface DashboardStats {
  total: number;
  inProgress: number;
  clientPending: number;
  approved: number;
}

export interface BatchUpdateItem {
  id: string;
  comment: string;
  attachment?: File | string | null; 
}

export interface NewDocumentPayload {
  code: string;
  title: string;
  type: DocumentType;
  discipline: string;
  nature: string;
  emitente: string;
  file?: File | null;
  // New Fields
  geCode: string;
  accessCode: string;
  informative: boolean;
  asBuilt: boolean;
  forecastDate: string;
  tafTac: string;
}

export interface SystemConfig {
    disciplines: string[];
    natures: string[];
    issuers: string[];
}

export interface BoxConfig {
    clientId: string;
    clientSecret: string;
    enterpriseId: string;
    publicKeyId: string;
}
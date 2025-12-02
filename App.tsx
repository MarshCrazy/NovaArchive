

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DocumentList } from './components/DocumentList';
import { DocumentDetail } from './components/DocumentDetail';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { INITIAL_DOCUMENTS, MOCK_USERS, DEFAULT_DISCIPLINES, DEFAULT_NATURES, DEFAULT_ISSUERS, TRANSLATIONS, MOCK_PROJECTS } from './constants';
import { DocumentMetadata, DocumentType, Qualification, User, UserRole, WorkflowStatus, BatchUpdateItem, NewDocumentPayload, SystemConfig, Language, Project } from './types';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('PT');
  
  // Data State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project>(MOCK_PROJECTS[0]);
  
  const [documents, setDocuments] = useState<DocumentMetadata[]>(INITIAL_DOCUMENTS);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  // Config State
  const [config, setConfig] = useState<SystemConfig>({
      disciplines: DEFAULT_DISCIPLINES,
      natures: DEFAULT_NATURES,
      issuers: DEFAULT_ISSUERS
  });

  const handleLogin = (email: string) => {
      // Mock Login
      const user = users.find(u => u.email === email) || users[0];
      setCurrentUser(user);
      
      // Determine project access
      // If user has a projectId, use it. If not (Super Admin), default to first project but can switch.
      if(user.projectId) {
          const assignedProject = projects.find(p => p.id === user.projectId);
          if(assignedProject) setCurrentProject(assignedProject);
      } else {
          setCurrentProject(projects[0]);
      }
      
      setIsAuthenticated(true);
  };

  const handleSwitchProject = (projectId: string) => {
      const p = projects.find(proj => proj.id === projectId);
      if(p) {
          setCurrentProject(p);
          setSelectedDocument(null);
          setActivePage('dashboard');
      }
  };

  const handleCreateProject = (newProject: Project) => {
      setProjects(prev => [...prev, newProject]);
  };

  const handleCreateUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
  };

  // Filter Docs by Project
  const projectDocuments = documents.filter(d => d.projectId === currentProject.id);

  // ... (Keep existing GRD Generation Logic) ...
  const generateGRD = (relatedDocs: DocumentMetadata[]) => {
      const grdId = `GRD-${Math.floor(1000 + Math.random() * 9000)}`;
      const date = new Date().toISOString();
      const newGRD: DocumentMetadata = {
          id: `doc-grd-${Date.now()}`,
          projectId: currentProject.id,
          code: grdId,
          title: `Guia de Remessa - ${relatedDocs.map(d => d.code).join(', ')}`,
          type: DocumentType.GRD,
          discipline: 'Gerenciamento - MG',
          nature: 'GRD',
          currentVersion: '00',
          currentStatus: WorkflowStatus.ANALYSIS_CLIENT, 
          currentQualification: Qualification.NONE,
          lastModified: date,
          emitente: currentUser.name,
          isLocked: true,
          versions: [
              {
                  version: '00',
                  status: WorkflowStatus.ANALYSIS_CLIENT,
                  qualification: Qualification.NONE,
                  updatedAt: date,
                  updatedBy: 'Sistema (Auto)',
                  updatedByRole: UserRole.ADMIN,
                  fileUrl: '#',
                  comments: 'Gerado automaticamente.'
              }
          ]
      };
      return newGRD;
  };

  const handleCreateDocument = (data: NewDocumentPayload) => {
      const isTechnical = data.type === DocumentType.TECHNICAL;
      const initialVersion = isTechnical ? '0A' : '01';
      const newDocId = `doc-${Date.now()}`;
      const now = new Date().toISOString();

      const newDoc: DocumentMetadata = {
          id: newDocId,
          projectId: currentProject.id, // Bind to current Project
          code: data.code,
          geCode: data.geCode,
          accessCode: data.accessCode,
          title: data.title,
          type: data.type,
          discipline: data.discipline,
          nature: data.nature,
          emitente: data.emitente,
          currentVersion: initialVersion,
          currentStatus: WorkflowStatus.DRAFT,
          currentQualification: Qualification.NONE,
          lastModified: now,
          isLocked: false,
          informative: data.informative,
          asBuilt: data.asBuilt,
          forecastDate: data.forecastDate,
          tafTac: data.tafTac,
          versions: [
              {
                  version: initialVersion,
                  status: WorkflowStatus.DRAFT,
                  qualification: Qualification.NONE,
                  updatedAt: now,
                  updatedBy: currentUser.name,
                  updatedByRole: currentUser.roles[0],
                  fileUrl: '#',
                  comments: 'Documento criado no sistema.',
                  attachmentName: data.file ? data.file.name : undefined
              }
          ]
      };
      setDocuments(prev => [newDoc, ...prev]);
  };

  const handleUpdateMetadata = (docId: string, updates: Partial<DocumentMetadata>) => {
      setDocuments(prevDocs => {
          return prevDocs.map(doc => {
              if (doc.id !== docId) return doc;

              // Generate Diff String
              const changes = Object.keys(updates).map(key => {
                  const k = key as keyof DocumentMetadata;
                  const oldVal = doc[k] !== undefined ? String(doc[k]) : '(vazio)';
                  const newVal = updates[k] !== undefined ? String(updates[k]) : '(vazio)';
                  if(oldVal === newVal) return null;
                  return `${key}: "${oldVal}" -> "${newVal}"`;
              }).filter(Boolean).join('; ');

              if(!changes) return doc; // No changes detected

              const updatedDoc = { ...doc, ...updates };
              const historyLog = {
                  version: doc.currentVersion,
                  status: doc.currentStatus,
                  qualification: doc.currentQualification,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUser.name,
                  updatedByRole: currentUser.roles[0],
                  fileUrl: '#',
                  comments: `Atualização de Metadados. Alterações: [ ${changes} ]`
              };

              return {
                  ...updatedDoc,
                  lastModified: new Date().toISOString(),
                  versions: [historyLog, ...doc.versions]
              };
          });
      });
  };

  const handleUpdateStatus = (docId: string, newStatus: WorkflowStatus, qualification: Qualification, comment: string, attachment?: File | string | null) => {
    let grdGenerated = false;
    setDocuments(prevDocs => {
        const doc = prevDocs.find(d => d.id === docId);
        if (!doc) return prevDocs;
        let attachmentName = undefined;
        if (attachment) {
            if (attachment instanceof File) {
                comment += ` [Novo Anexo]`;
                attachmentName = attachment.name;
            } else {
                 comment += ` [Anexo Repassado: ${attachment}]`;
                 attachmentName = attachment; 
            }
        }
        const newHistoryEntry = {
            version: doc.currentVersion,
            status: newStatus,
            qualification: qualification,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name,
            updatedByRole: currentUser.roles[0],
            fileUrl: '#',
            comments: comment,
            attachmentName: attachmentName
        };
        const updatedDoc = {
            ...doc,
            currentStatus: newStatus,
            currentQualification: qualification,
            lastModified: new Date().toISOString(),
            versions: [newHistoryEntry, ...doc.versions]
        };
        const newDocs = prevDocs.map(d => d.id === docId ? updatedDoc : d);
        if (newStatus === WorkflowStatus.ANALYSIS_CLIENT && doc.currentStatus !== WorkflowStatus.ANALYSIS_CLIENT) {
             const newGRD = generateGRD([doc]);
             grdGenerated = true;
             return [newGRD, ...newDocs];
        }
        return newDocs;
    });
    if (grdGenerated) alert("GRD gerada automaticamente.");
  };

  const handleBatchUpdateStatus = (items: BatchUpdateItem[], action: string, newStatus?: WorkflowStatus) => {
      if (!newStatus) return;
      let grdGenerated = false;
      let movedToClientCount = 0;
      const ids = items.map(i => i.id);

      setDocuments(prevDocs => {
          let docsToUpdate = prevDocs.filter(d => ids.includes(d.id));
          let newDocsList = [...prevDocs];
          
          docsToUpdate.forEach(doc => {
              const itemData = items.find(i => i.id === doc.id);
              let finalComment = itemData?.comment || 'Atualização em lote';
              const attachment = itemData?.attachment;
              let attachmentName = undefined;

              if (attachment) {
                   if (attachment instanceof File) {
                        finalComment += ` [Anexo: ${attachment.name}]`;
                        attachmentName = attachment.name;
                   } else {
                        finalComment += ` [Anexo Repassado: ${attachment}]`;
                        attachmentName = attachment;
                   }
              }

              const updatedDoc = {
                  ...doc,
                  currentStatus: newStatus,
                  lastModified: new Date().toISOString(),
                  versions: [{
                      version: doc.currentVersion,
                      status: newStatus,
                      qualification: Qualification.NONE,
                      updatedAt: new Date().toISOString(),
                      updatedBy: currentUser.name,
                      updatedByRole: currentUser.roles[0],
                      fileUrl: '#',
                      comments: finalComment,
                      attachmentName: attachmentName
                  }, ...doc.versions]
              };
              newDocsList = newDocsList.map(d => d.id === doc.id ? updatedDoc : d);
              if (newStatus === WorkflowStatus.ANALYSIS_CLIENT && doc.currentStatus !== WorkflowStatus.ANALYSIS_CLIENT) {
                  movedToClientCount++;
              }
          });
          if (newStatus === WorkflowStatus.ANALYSIS_CLIENT && movedToClientCount > 0) {
               const newGRD = generateGRD(docsToUpdate);
               newDocsList.unshift(newGRD);
               grdGenerated = true;
          }
          return newDocsList;
      });
      if (grdGenerated) alert(`GRD única gerada para o lote.`);
  };

  const renderContent = () => {
    if (selectedDocument) {
      return (
        <DocumentDetail 
          document={selectedDocument} 
          user={currentUser}
          onBack={() => setSelectedDocument(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateMetadata={handleUpdateMetadata}
          config={config}
          lang={language}
        />
      );
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard documents={projectDocuments} user={currentUser} onViewDocument={setSelectedDocument} language={language}/>;
      case 'technical':
        return <DocumentList title={TRANSLATIONS[language].nav.technical} documents={projectDocuments.filter(d => d.type === DocumentType.TECHNICAL)} onSelectDocument={setSelectedDocument} user={currentUser} onBatchAction={handleBatchUpdateStatus} onCreateDocument={handleCreateDocument} config={config} language={language}/>;
      case 'managerial':
        return <DocumentList title={TRANSLATIONS[language].nav.managerial} documents={projectDocuments.filter(d => d.type === DocumentType.MANAGERIAL)} onSelectDocument={setSelectedDocument} user={currentUser} onBatchAction={handleBatchUpdateStatus} onCreateDocument={handleCreateDocument} config={config} language={language}/>;
      case 'grd':
        return <DocumentList title={TRANSLATIONS[language].nav.grd} documents={projectDocuments.filter(d => d.type === DocumentType.GRD || d.currentStatus === WorkflowStatus.ANALYSIS_CLIENT)} onSelectDocument={setSelectedDocument} user={currentUser} config={config} language={language}/>;
      case 'settings':
        return <Settings 
                currentUser={currentUser} 
                users={users} 
                onUpdateUser={(u) => setUsers(prev => prev.map(user => user.id === u.id ? u : user))} 
                onCreateUser={handleCreateUser}
                config={config} 
                onUpdateConfig={setConfig}
                projects={projects}
                onCreateProject={handleCreateProject}
               />;
      default:
        return <Dashboard documents={projectDocuments} user={currentUser} language={language}/>;
    }
  };

  if(!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={currentUser} 
      onNavigate={(p) => { setActivePage(p); setSelectedDocument(null); }} 
      activePage={activePage}
      availableUsers={users}
      onSwitchUser={(id) => { const u = users.find(x => x.id === id); if(u) setCurrentUser(u); }}
      language={language}
      setLanguage={setLanguage}
      projects={projects}
      currentProject={currentProject}
      onSwitchProject={handleSwitchProject}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
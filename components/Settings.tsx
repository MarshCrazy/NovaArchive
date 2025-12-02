

import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle2, AlertCircle, Box, FolderTree, Key, Shield, Folder, FileText, CornerDownRight, Users as UsersIcon, Lock, Plus, Trash2, ArrowRight, Briefcase, UserPlus, CheckSquare, Square, X, Mail } from 'lucide-react';
import { User, UserRole, SystemConfig, Project, BoxConfig } from '../types';
import { INITIAL_BOX_CONFIG, STATUS_COLORS } from '../constants';

interface SettingsProps {
    users?: User[];
    currentUser?: User;
    onUpdateUser?: (user: User) => void;
    onCreateUser?: (newUser: User) => void;
    config?: SystemConfig;
    onUpdateConfig?: (config: SystemConfig) => void;
    projects?: Project[];
    onCreateProject?: (project: Project) => void;
}

export const Settings: React.FC<SettingsProps> = ({ users = [], currentUser, onUpdateUser, onCreateUser, config, onUpdateConfig, projects = [], onCreateProject }) => {
  const [activeTab, setActiveTab] = useState('box');
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');

  // Config Local State
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config || { disciplines: [], natures: [], issuers: [] });
  const [boxConfig, setBoxConfig] = useState<BoxConfig>(INITIAL_BOX_CONFIG);
  const [newItemText, setNewItemText] = useState('');

  // New User State (Global Tab)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.READER, projectId: '' });
  
  // New Project State
  const [newProject, setNewProject] = useState({ name: '', code: '', wbs: '', substation: '', directClient: '', finalClient: '' });
  
  // Team Management State
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<Project | null>(null);
  
  // Invite User (Team Mgmt) State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const isSystemAdmin = currentUser?.roles.includes(UserRole.ADMIN);
  const isTechLeader = currentUser?.roles.includes(UserRole.TECH_LEADER);
  const canEditLists = isSystemAdmin || isTechLeader;
  const canViewPermissions = isSystemAdmin || isTechLeader;

  const handleSave = () => {
    setIsSaving(true);
    if (onUpdateConfig) onUpdateConfig(localConfig);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleTestConnection = () => {
    setConnectionStatus('checking');
    setTimeout(() => setConnectionStatus('connected'), 2000);
  };

  const handleCreateUser = () => {
      if(!onCreateUser || !newUser.name || !newUser.email) return;
      let finalProjectId = newUser.projectId;
      if (isSystemAdmin) {
          if (newUser.role === UserRole.ADMIN) {
              finalProjectId = ''; 
          }
      } else {
          finalProjectId = currentUser?.projectId || '';
      }

      const u: User = {
          id: Date.now().toString(),
          name: newUser.name,
          email: newUser.email,
          roles: [newUser.role],
          avatar: `https://ui-avatars.com/api/?name=${newUser.name}&background=random`,
          projectId: finalProjectId || undefined
      };
      onCreateUser(u);
      setNewUser({ name: '', email: '', role: UserRole.READER, projectId: '' });
  };

  const handleCreateProject = () => {
      if(!onCreateProject || !newProject.name || !newProject.code || !newProject.wbs || !newProject.substation || !newProject.directClient || !newProject.finalClient) {
          alert("Preencha todos os campos obrigatórios (*)");
          return;
      }
      const p: Project = {
          id: `proj-${Date.now()}`,
          name: newProject.name,
          code: newProject.code,
          wbs: newProject.wbs,
          substation: newProject.substation,
          directClient: newProject.directClient,
          finalClient: newProject.finalClient
      };
      onCreateProject(p);
      setNewProject({ name: '', code: '', wbs: '', substation: '', directClient: '', finalClient: '' });
  };

  const handleInviteUser = () => {
      if (!selectedProjectForTeam || !onCreateUser || !inviteName || !inviteEmail) return;
      
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      
      const u: User = {
          id: `invited-${Date.now()}`,
          name: inviteName,
          email: inviteEmail,
          roles: [UserRole.READER], // Default role for invited users
          avatar: `https://ui-avatars.com/api/?name=${inviteName}&background=random`,
          projectId: selectedProjectForTeam.id
      };
      
      onCreateUser(u);
      setInviteName('');
      setInviteEmail('');
      alert(`Usuário convidado com sucesso!\n\nEmail enviado para: ${u.email}\nSenha Provisória: ${tempPassword}\n\nO usuário deverá alterar a senha no primeiro acesso.`);
  };

  const handleToggleRole = (user: User, role: UserRole) => {
      if (!onUpdateUser) return;
      if (!isSystemAdmin && !isTechLeader) return;
      
      let newRoles = [...user.roles];
      if (newRoles.includes(role)) {
          newRoles = newRoles.filter(r => r !== role);
      } else {
          newRoles.push(role);
      }
      onUpdateUser({ ...user, roles: newRoles });
  };

  const toggleUserInProject = (user: User, projectId: string) => {
      if (!onUpdateUser) return;
      // If user is already in this project, remove them (set to empty/undefined).
      // If they are in another project or no project, set them to this project.
      const newProjectId = user.projectId === projectId ? undefined : projectId;
      onUpdateUser({ ...user, projectId: newProjectId });
  };

  const handleAddItem = (listKey: keyof SystemConfig) => {
      if (!newItemText.trim()) return;
      setLocalConfig(prev => ({
          ...prev,
          [listKey]: [...prev[listKey], newItemText.trim()]
      }));
      setNewItemText('');
  };

  const handleDeleteItem = (listKey: keyof SystemConfig, item: string) => {
      setLocalConfig(prev => ({
          ...prev,
          [listKey]: prev[listKey].filter(i => i !== item)
      }));
  };

  const inputStyle = "w-full border-2 border-gray-400 rounded-lg p-2.5 text-sm font-medium text-gray-900 focus:border-green-600 outline-none placeholder-gray-400 bg-white";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
           <p className="text-gray-500">Gerencie integrações, usuários e parâmetros globais.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2">
          <TabButton active={activeTab === 'box'} onClick={() => setActiveTab('box')} icon={<Box className="w-4 h-4" />} label="Integração Box" disabled={!isSystemAdmin} />
          <TabButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase className="w-4 h-4" />} label="Projetos" disabled={!isSystemAdmin} />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Permissões e Perfis" disabled={!canViewPermissions} />
          <TabButton active={activeTab === 'lists'} onClick={() => setActiveTab('lists')} icon={<CheckCircle2 className="w-4 h-4" />} label="Listas e Atributos" disabled={!canEditLists} />
          <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={<FolderTree className="w-4 h-4" />} label="Fluxos de Trabalho" />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[800px]">
          
          {/* --- TAB: BOX INTEGRATION --- */}
          {activeTab === 'box' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {isSystemAdmin ? (
                   <>
                       <div className="border-b border-gray-100 pb-4 flex justify-between">
                           <div>
                                <h2 className="text-lg font-semibold text-gray-900">Conexão Box Content Cloud</h2>
                                <p className="text-sm text-gray-500">Parâmetros de autenticação JWT/OAuth.</p>
                           </div>
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                                <Box className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-bold text-blue-700">Enterprise</span>
                           </div>
                       </div>
                       <div className="grid grid-cols-1 gap-4 max-w-2xl">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Client ID</label>
                               <input className={inputStyle} value={boxConfig.clientId} onChange={e => setBoxConfig({...boxConfig, clientId: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Client Secret</label>
                               <input type="password" className={inputStyle} value={boxConfig.clientSecret} onChange={e => setBoxConfig({...boxConfig, clientSecret: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Enterprise ID</label>
                               <input className={inputStyle} value={boxConfig.enterpriseId} onChange={e => setBoxConfig({...boxConfig, enterpriseId: e.target.value})} />
                           </div>
                       </div>
                       <div className={`p-4 rounded-lg border flex items-center gap-3 ${connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            {connectionStatus === 'checking' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5 text-green-600"/>}
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{connectionStatus === 'connected' ? 'Conectado' : 'Verificando...'}</p>
                            </div>
                            <button onClick={handleTestConnection} className="underline text-sm font-medium text-gray-700">Testar Conexão</button>
                       </div>
                   </>
               ) : (
                   <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200 flex items-center gap-2">
                       <Lock className="w-4 h-4"/> Acesso restrito ao Administrador do Sistema.
                   </div>
               )}
            </div>
          )}

          {/* --- TAB: PROJECTS --- */}
          {activeTab === 'projects' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {isSystemAdmin ? (
                    <>
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Projetos</h2>
                            <p className="text-sm text-gray-500">Crie novos projetos e gerencie o acesso da equipe.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><h4 className="text-sm font-bold text-green-700 uppercase mb-2">Novo Projeto</h4></div>
                            
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">WBS *</label><input className={inputStyle} placeholder="WBS-XXX-000" value={newProject.wbs} onChange={e => setNewProject({...newProject, wbs: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Subestação/Lote *</label><input className={inputStyle} placeholder="Nome da Obra" value={newProject.substation} onChange={e => setNewProject({...newProject, substation: e.target.value})} /></div>
                            
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Cliente Direto *</label><input className={inputStyle} placeholder="Cliente Contratante" value={newProject.directClient} onChange={e => setNewProject({...newProject, directClient: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Cliente Final *</label><input className={inputStyle} placeholder="Beneficiário" value={newProject.finalClient} onChange={e => setNewProject({...newProject, finalClient: e.target.value})} /></div>
                            
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Nome do Projeto *</label><input className={inputStyle} placeholder="Nome Display" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Código Pasta (Box) *</label><input className={inputStyle} placeholder="PASTA-BOX" value={newProject.code} onChange={e => setNewProject({...newProject, code: e.target.value})} /></div>
                            
                            <div className="md:col-span-2 flex justify-end mt-2">
                                <button onClick={handleCreateProject} className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-sm"><Plus className="w-4 h-4"/> Criar Projeto</button>
                            </div>
                        </div>
                    </>
                  ) : (
                      <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200 flex items-center gap-2">
                        <Lock className="w-4 h-4"/> A gestão de projetos é restrita ao Administrador do Sistema.
                      </div>
                  )}
                  <div className="grid grid-cols-1 gap-4">
                      {projects.map(p => (
                          <div key={p.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-sm bg-white">
                              <div>
                                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono border border-gray-200">{p.code}</span>
                                  <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
                                      <span>WBS: {p.wbs || '-'}</span>
                                      <span>|</span>
                                      <span>SE: {p.substation || '-'}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500 flex items-center gap-2"><Folder className="w-4 h-4" /> ID: {p.id}</span>
                                  {isSystemAdmin && (
                                      <button 
                                        onClick={() => setSelectedProjectForTeam(p)}
                                        className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-blue-100"
                                      >
                                          <UserPlus className="w-4 h-4"/> Gerenciar Equipe
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Team Management Modal */}
                  {selectedProjectForTeam && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                  <div>
                                      <h3 className="text-lg font-bold text-gray-900">Gerenciar Equipe</h3>
                                      <p className="text-sm text-gray-500">Selecionar usuários com acesso ao projeto <span className="font-bold text-black">{selectedProjectForTeam.name}</span></p>
                                  </div>
                                  <button onClick={() => setSelectedProjectForTeam(null)}><X className="w-6 h-6 text-gray-500"/></button>
                              </div>
                              
                              {/* Invite User Section */}
                              <div className="p-4 bg-green-50 border-b border-green-100">
                                  <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2"><Mail className="w-4 h-4"/> Convidar Novo Usuário</h4>
                                  <div className="flex gap-2 items-center">
                                      <input className="flex-1 border border-green-200 rounded p-2 text-sm" placeholder="Nome" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                                      <input className="flex-1 border border-green-200 rounded p-2 text-sm" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                      <button onClick={handleInviteUser} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700">Convidar</button>
                                  </div>
                              </div>

                              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase">Usuários Existentes</h4>
                                  {users.filter(u => !u.roles.includes(UserRole.ADMIN)).map(u => {
                                      const isInProject = u.projectId === selectedProjectForTeam.id;
                                      const isAssignedElsewhere = u.projectId && u.projectId !== selectedProjectForTeam.id;
                                      
                                      return (
                                          <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border ${isInProject ? 'bg-white border-green-200 shadow-sm' : 'bg-white border-gray-200'} ${isAssignedElsewhere ? 'opacity-70 grayscale' : ''}`}>
                                              <div className="flex items-center gap-3">
                                                  <img src={u.avatar} className="w-8 h-8 rounded-full"/>
                                                  <div>
                                                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                      <p className="text-xs text-gray-500">{u.email} • {u.roles.join(', ')}</p>
                                                      {isAssignedElsewhere && <p className="text-[10px] text-orange-600 font-bold">Atribuído a outro projeto</p>}
                                                  </div>
                                              </div>
                                              <button 
                                                onClick={() => toggleUserInProject(u, selectedProjectForTeam.id)}
                                                className={`p-2 rounded ${isInProject ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                                title={isInProject ? "Remover do Projeto" : "Adicionar ao Projeto"}
                                              >
                                                  {isInProject ? <CheckSquare className="w-6 h-6"/> : <Square className="w-6 h-6"/>}
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                              <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                                  <button onClick={() => setSelectedProjectForTeam(null)} className="px-5 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm">Concluído</button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* --- TAB: USERS --- */}
          {activeTab === 'users' && canViewPermissions && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
                        <p className="text-sm text-gray-500">
                           {!isSystemAdmin && !isTechLeader && <span className="text-red-500 font-bold ml-1">(Modo Leitura)</span>}
                           {isTechLeader && !isSystemAdmin && <span className="text-green-600 font-bold ml-1">(Admin de Projeto)</span>}
                           {isSystemAdmin && <span className="text-purple-600 font-bold ml-1">(Super Admin)</span>}
                        </p>
                    </div>
                  </div>
                  {(isSystemAdmin || isTechLeader) && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-700 mb-1">Nome</label><input className={inputStyle} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Nome Completo" /></div>
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label><input className={inputStyle} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@ge.com" /></div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Papel Inicial</label>
                            <select className={inputStyle} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                <option value={UserRole.READER}>Leitor</option>
                                <option value={UserRole.DESIGNER}>Projetista</option>
                                <option value={UserRole.CLIENT}>Cliente</option>
                                <option value={UserRole.TECH_LEADER}>Líder Técnico</option>
                                {isSystemAdmin && <option value={UserRole.ADMIN}>Super Admin (Sistema)</option>}
                            </select>
                        </div>
                        <div className="md:col-span-1 flex gap-2">
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Projeto</label>
                                <select className={inputStyle} value={newUser.projectId} onChange={e => setNewUser({...newUser, projectId: e.target.value})} disabled={!isSystemAdmin || newUser.role === UserRole.ADMIN}>
                                    {isSystemAdmin && newUser.role !== UserRole.ADMIN ? (<><option value="">Selecione...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</>) : (<option value={isSystemAdmin ? '' : currentUser?.projectId}>{isSystemAdmin ? 'Global (Todos)' : projects.find(p => p.id === currentUser?.projectId)?.name}</option>)}
                                </select>
                             </div>
                            <button onClick={handleCreateUser} className="bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-700 shadow-sm h-[42px] self-end"><Plus className="w-5 h-5"/></button>
                        </div>
                    </div>
                  )}
                  <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Usuário / Projeto</th>
                                  {Object.values(UserRole).map(role => (<th key={role} className="p-4 text-xs font-semibold text-gray-500 uppercase text-center w-24">{role === UserRole.TECH_LEADER ? 'Líder Téc.' : role === UserRole.ADMIN ? 'Super Admin' : role}</th>))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {users.filter(u => isSystemAdmin ? true : u.projectId === currentUser?.projectId).map(u => (
                                  <tr key={u.id} className="hover:bg-gray-50">
                                      <td className="p-4"><div className="flex items-center gap-3"><img src={u.avatar} alt="" className="w-8 h-8 rounded-full" /><div><p className="font-medium text-gray-900 text-sm">{u.name}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-400">{u.email}</span>{u.projectId ? (<span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">{projects.find(p => p.id === u.projectId)?.code || 'Unknown Project'}</span>) : (<span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">Global</span>)}</div></div></div></td>
                                      {Object.values(UserRole).map(role => {
                                          const hasRole = u.roles.includes(role);
                                          const isLocked = role === UserRole.ADMIN && !isSystemAdmin; 
                                          return (<td key={role} className="p-4 text-center"><div className="flex justify-center"><input type="checkbox" checked={hasRole} disabled={(!isSystemAdmin && !isTechLeader) || isLocked} onChange={() => handleToggleRole(u, role)} className={`w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}/></div></td>);
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* --- TAB: LISTS --- */}
          {activeTab === 'lists' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {canEditLists ? (
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <ListEditor title="Emitentes" items={localConfig.issuers} onDelete={(item) => handleDeleteItem('issuers', item)} onAdd={(text) => setLocalConfig(prev => ({...prev, issuers: [...prev.issuers, text]}))} inputStyle={inputStyle} />
                           <ListEditor title="Disciplinas" items={localConfig.disciplines} onDelete={(item) => handleDeleteItem('disciplines', item)} onAdd={(text) => setLocalConfig(prev => ({...prev, disciplines: [...prev.disciplines, text]}))} inputStyle={inputStyle} />
                           <ListEditor title="Naturezas" items={localConfig.natures} onDelete={(item) => handleDeleteItem('natures', item)} onAdd={(text) => setLocalConfig(prev => ({...prev, natures: [...prev.natures, text]}))} inputStyle={inputStyle} />
                       </div>
                  ) : (
                       <div className="p-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 border border-gray-200 rounded-xl">
                            <Lock className="w-12 h-12 mb-4 text-gray-300"/>
                            <h3 className="text-lg font-bold text-gray-600">Acesso Restrito</h3>
                            <p>Apenas Líderes Técnicos ou Administradores podem editar estas listas.</p>
                       </div>
                  )}
              </div>
          )}

           {/* --- TAB: WORKFLOW DIAGRAM --- */}
           {activeTab === 'workflow' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Fluxo de Trabalho Padrão</h2>
                        <p className="text-sm text-gray-500">Representação visual do ciclo de vida dos documentos técnicos.</p>
                   </div>
                   
                   <div className="flex flex-col items-center gap-6 p-8 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto min-w-[600px]">
                        
                        {/* Phase 1: Creation */}
                        <div className="flex gap-8 items-center">
                            <WorkflowNode label="Em Rascunho" color="bg-gray-100" borderColor="border-gray-400" />
                            <Arrow />
                            <WorkflowNode label="Em Revisão" color="bg-yellow-100" borderColor="border-yellow-400" />
                            <Arrow />
                            <WorkflowNode label="Em Avaliação (LT)" color="bg-orange-100" borderColor="border-orange-400" />
                        </div>
                        
                        <Arrow direction="down" />

                        {/* Phase 2: Client */}
                        <div className="p-6 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50 relative w-full flex justify-center">
                            <span className="absolute top-2 left-2 text-xs font-bold text-purple-600 uppercase">Ambiente Externo</span>
                            <WorkflowNode label="Em Análise Cliente" color="bg-purple-100" borderColor="border-purple-500" />
                        </div>

                        {/* Phase 3: Decision */}
                        <div className="grid grid-cols-2 gap-20 w-full">
                             {/* Path A: Approval */}
                             <div className="flex flex-col items-center gap-2">
                                 <div className="h-8 w-0.5 bg-green-500"></div>
                                 <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded border border-green-200 shadow-sm">Aprovado / As Built</span>
                                 <Arrow direction="down" />
                                 <WorkflowNode label="Em Execução / As Built" color="bg-green-100" borderColor="border-green-500" />
                             </div>

                             {/* Path B: Rejection */}
                             <div className="flex flex-col items-center gap-2">
                                 <div className="h-8 w-0.5 bg-red-500"></div>
                                 <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-200 shadow-sm">Reprovado / Comentado</span>
                                 <Arrow direction="down" />
                                 <WorkflowNode label="Em Moderação (LT)" color="bg-red-50" borderColor="border-red-400" />
                                 <Arrow direction="down" />
                                 <div className="text-xs text-gray-500 font-medium italic">Retorna para "Em Revisão"</div>
                             </div>
                        </div>
                   </div>
               </div>
           )}

        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, disabled }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-white text-green-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'
    } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
  >
    {icon}
    {label}
    {disabled && <Lock className="w-3 h-3 ml-auto text-gray-400"/>}
  </button>
);

const ListEditor = ({ title, items, onDelete, onAdd, inputStyle }: { title: string, items: string[], onDelete: (i: string) => void, onAdd: (t: string) => void, inputStyle: string }) => {
    const [val, setVal] = useState('');
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-[400px]">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> {title}
            </h3>
            <div className="flex gap-2 mb-3">
                <input className={inputStyle} placeholder="Novo item..." value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onAdd(val); setVal(''); } }} />
                <button onClick={() => { onAdd(val); setVal(''); }} className="bg-green-600 text-white px-3 rounded-lg hover:bg-green-700 shadow-sm"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 border-t border-gray-100 pt-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group hover:bg-gray-50 p-2 rounded text-sm text-gray-700 border border-transparent hover:border-gray-200">
                        <span className="truncate">{item}</span>
                        <button onClick={() => onDelete(item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Workflow Diagram Components
const WorkflowNode = ({ label, color, borderColor }: { label: string, color: string, borderColor: string }) => (
    <div className={`px-6 py-3 rounded-lg border-2 ${borderColor} ${color} shadow-sm font-bold text-sm text-gray-800 min-w-[140px] text-center`}>
        {label}
    </div>
);

const Arrow = ({ direction = 'right' }: { direction?: 'right' | 'down' }) => (
    direction === 'right' ? (
        <div className="text-gray-400"><ArrowRight className="w-5 h-5" /></div>
    ) : (
        <div className="text-gray-400 py-1"><ArrowRight className="w-5 h-5 rotate-90" /></div>
    )
);

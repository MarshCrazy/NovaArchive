

import React, { useState } from 'react';
import { DocumentMetadata, Qualification, User, UserRole, WorkflowStatus, SystemConfig } from '../types';
import { STATUS_COLORS, TRANSLATIONS } from '../constants';
import { ArrowLeft, Box, History, FileCheck, Send, AlertCircle, ShieldCheck, Ban, UploadCloud, ExternalLink, Settings, Paperclip, X, Download, RotateCcw, Edit2, Save } from 'lucide-react';

interface DocumentDetailProps {
  document: DocumentMetadata;
  user: User;
  onBack: () => void;
  onUpdateStatus: (id: string, status: WorkflowStatus, qualification: Qualification, comment: string, attachment?: File | string | null) => void;
  onUpdateMetadata?: (docId: string, updates: Partial<DocumentMetadata>) => void;
  config?: SystemConfig;
  lang?: string; // Add language support
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, user, onBack, onUpdateStatus, onUpdateMetadata, config, lang = 'PT' }) => {
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<File | string | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{status: WorkflowStatus, qual: Qualification, color: string} | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editData, setEditData] = useState<Partial<DocumentMetadata>>({});
  
  const tFields = TRANSLATIONS[lang as any].fields; // Get translations

  // Super Admin (System) OR Tech Leader (Project Admin)
  const isAdminOrLeader = user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.TECH_LEADER);

  const getActions = () => {
    const actions = [];
    if (isAdminOrLeader) {
      if (document.currentStatus === WorkflowStatus.EVALUATION_LT) {
        actions.push({ label: 'Aprovar (Emitir Cliente)', status: WorkflowStatus.ANALYSIS_CLIENT, qual: Qualification.AP, color: 'bg-green-600' });
        actions.push({ label: 'Reprovar (Devolver)', status: WorkflowStatus.IN_REVIEW, qual: Qualification.RE, color: 'bg-red-600' });
        actions.push({ label: 'Cancelar Documento', status: WorkflowStatus.CANCELLED, qual: Qualification.CA, color: 'bg-gray-800' });
      } else if (document.currentStatus === WorkflowStatus.MODERATION_LT) {
         actions.push({ label: 'Enviar p/ Revisão', status: WorkflowStatus.IN_REVIEW, qual: Qualification.NONE, color: 'bg-blue-600' });
         actions.push({ label: 'Liberar p/ Execução', status: WorkflowStatus.EXECUTION, qual: Qualification.AP, color: 'bg-green-700' });
      } else if (document.currentStatus === WorkflowStatus.DRAFT) {
        actions.push({ label: 'Enviar p/ Projetista', status: WorkflowStatus.IN_REVIEW, qual: Qualification.NONE, color: 'bg-blue-600' });
      } else if (document.currentStatus === WorkflowStatus.EXECUTION) {
        actions.push({ label: 'Retornar p/ Revisão', status: WorkflowStatus.IN_REVIEW, qual: Qualification.NONE, color: 'bg-orange-600' });
      }
    }
    if (user.roles.includes(UserRole.CLIENT) && document.currentStatus === WorkflowStatus.ANALYSIS_CLIENT) {
        actions.push({ label: 'Aprovar', status: document.currentVersion.match(/^\d+$/) ? WorkflowStatus.EXECUTION : WorkflowStatus.MODERATION_LT, qual: Qualification.AP, color: 'bg-green-600' });
        actions.push({ label: 'Aprovado c/ Comentários', status: WorkflowStatus.MODERATION_LT, qual: Qualification.AC, color: 'bg-yellow-600' });
        actions.push({ label: 'Reprovar', status: WorkflowStatus.MODERATION_LT, qual: Qualification.RE, color: 'bg-red-600' });
        if (document.currentVersion.match(/^\d+$/)) {
            actions.push({ label: 'As Built', status: WorkflowStatus.AS_BUILT, qual: Qualification.AS, color: 'bg-blue-600' });
        }
    }
    if (user.roles.includes(UserRole.DESIGNER) && (document.currentStatus === WorkflowStatus.IN_REVIEW || document.currentStatus === WorkflowStatus.DRAFT)) {
        actions.push({ label: 'Enviar p/ Avaliação LT', status: WorkflowStatus.EVALUATION_LT, qual: Qualification.NONE, color: 'bg-blue-600' });
    }
    return actions;
  };

  const handleActionClick = (action: any) => {
    // Check if previous version has attachment to preset it
    const lastAttachment = document.versions[0]?.attachmentName;
    setAttachment(lastAttachment || null);

    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  const confirmAction = () => {
    if (selectedAction) {
      onUpdateStatus(document.id, selectedAction.status, selectedAction.qual, comment, attachment);
      setIsActionModalOpen(false);
      setComment('');
      setAttachment(null);
      onBack();
    }
  };

  const startEditing = () => {
      setEditData({ ...document });
      setIsEditingMetadata(true);
  };

  const saveMetadata = () => {
      if (onUpdateMetadata) onUpdateMetadata(document.id, editData);
      setIsEditingMetadata(false);
  };

  // Logic to hide internal workflow steps from Client
  const visibleVersions = document.versions.filter(ver => {
      const isClient = user.roles.includes(UserRole.CLIENT);
      // If client, hide DRAFT, IN_REVIEW, EVALUATION_LT. 
      // EXCEPT if user is also Admin or Tech Leader, then show all.
      if (isClient && !isAdminOrLeader) {
          return ![WorkflowStatus.DRAFT, WorkflowStatus.IN_REVIEW, WorkflowStatus.EVALUATION_LT].includes(ver.status);
      }
      return true;
  });

  const inputClass = "w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm font-medium text-gray-900 bg-white focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para lista
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-700">{document.code}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[document.currentStatus]}`}>{document.currentStatus}</span>
                    {document.currentQualification !== Qualification.NONE && <span className="text-xs px-2 py-1 rounded-full border bg-white border-gray-300 text-gray-600 font-medium">{document.currentQualification}</span>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <button onClick={() => window.open('#', '_blank')} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                    <Box className="w-4 h-4" /> Abrir no Box <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                 </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {getActions().length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /> Ações de Fluxo</h3>
                    <div className="flex flex-wrap gap-3">
                        {getActions().map((action, idx) => (
                            <button key={idx} onClick={() => handleActionClick(action)} className={`${action.color} text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 flex items-center gap-2`}>
                                {action.icon}{action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><History className="w-5 h-5 text-gray-500" /> Histórico de Versões</h3>
                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:h-full before:w-0.5 before:bg-gray-200">
                    {visibleVersions.map((ver, idx) => (
                        <div key={idx} className="relative pl-10">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-xs font-bold text-green-700 z-10">{ver.version}</div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-900 text-sm">Versão {ver.version}</span>
                                        <span className="text-gray-400 mx-2">•</span>
                                        <span className="text-xs text-gray-500">{new Date(ver.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[ver.status]}`}>{ver.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2"><span className="font-medium text-gray-700">Por:</span> {ver.updatedBy} {ver.updatedByRole && <span className="text-gray-400 text-xs">/ {ver.updatedByRole}</span>}</p>
                                {ver.comments && <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600 italic whitespace-pre-wrap">"{ver.comments}"</div>}
                                {ver.attachmentName && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 w-fit cursor-pointer hover:bg-blue-100">
                                        <Paperclip className="w-3 h-3" /> {ver.attachmentName} <Download className="w-3 h-3 ml-1"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Metadados</h3>
                    {isAdminOrLeader && onUpdateMetadata && (
                         <div className="flex items-center gap-2">
                             {isEditingMetadata ? (
                                <><button onClick={() => { setIsEditingMetadata(false); setEditData({}); }} className="p-1.5 bg-gray-100 text-gray-600 rounded flex items-center gap-1 text-xs font-bold px-3">Cancelar</button>
                                <button onClick={saveMetadata} className="p-1.5 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4"/></button></>
                             ) : (
                                <button onClick={startEditing} className="p-1.5 bg-gray-100 text-gray-500 rounded"><Edit2 className="w-4 h-4" /></button>
                             )}
                         </div>
                    )}
                </div>
                
                <div className="space-y-4 text-sm">
                    {[
                        { label: tFields.title, key: 'title' },
                        { label: tFields.geCode, key: 'geCode' },
                        { label: tFields.accessCode, key: 'accessCode' },
                        { label: tFields.emitente, key: 'emitente', type: 'select', options: config?.issuers },
                        { label: tFields.discipline, key: 'discipline', type: 'select', options: config?.disciplines },
                        { label: tFields.nature, key: 'nature', type: 'select', options: config?.natures },
                        { label: tFields.tafTac, key: 'tafTac' }, // No dedicated datalist support in loop map, handled in render if needed, or plain input
                        { label: tFields.forecastDate, key: 'forecastDate', type: 'date' }
                    ].map((field: any) => (
                        <div key={field.key} className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="text-xs text-gray-500 font-medium mb-1">{field.label}</span>
                            {isEditingMetadata ? (
                                field.type === 'select' ? (
                                    <select className={inputClass} value={(editData as any)[field.key]} onChange={e => setEditData({...editData, [field.key]: e.target.value})}>
                                        {field.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : field.key === 'tafTac' ? (
                                     <>
                                        <input list="taf-tac-edit" className={inputClass} value={(editData as any)[field.key]} onChange={e => setEditData({...editData, [field.key]: e.target.value})} />
                                        <datalist id="taf-tac-edit"><option value="TAF"/><option value="TAC"/></datalist>
                                     </>
                                ) : (
                                    <input type={field.type || 'text'} className={inputClass} value={(editData as any)[field.key]} onChange={e => setEditData({...editData, [field.key]: e.target.value})} />
                                )
                            ) : (
                                <span className="text-gray-900 font-medium">{(document as any)[field.key] || '-'}</span>
                            )}
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium mb-1">{tFields.informative}</span>
                            {isEditingMetadata ? <select className={inputClass} value={editData.informative ? 'Sim' : 'Não'} onChange={e => setEditData({...editData, informative: e.target.value === 'Sim'})}><option value="Não">Não</option><option value="Sim">Sim</option></select> : <span className={`text-xs font-bold px-2 py-1 rounded w-fit ${document.informative ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>{document.informative ? 'SIM' : 'NÃO'}</span>}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium mb-1">{tFields.asBuilt}</span>
                            {isEditingMetadata ? <select className={inputClass} value={editData.asBuilt ? 'Sim' : 'Não'} onChange={e => setEditData({...editData, asBuilt: e.target.value === 'Sim'})}><option value="Não">Não</option><option value="Sim">Sim</option></select> : <span className={`text-xs font-bold px-2 py-1 rounded w-fit ${document.asBuilt ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{document.asBuilt ? 'SIM' : 'NÃO'}</span>}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {isActionModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4 text-gray-800"><AlertCircle className="w-6 h-6 text-blue-600" /><h3 className="text-lg font-bold">Confirmar Ação</h3></div>
                <div className="mb-4 space-y-3">
                    <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder="Comentários..." value={comment} onChange={e => setComment(e.target.value)} />
                    <label className="flex items-center gap-2 border border-dashed border-gray-400 p-2 rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                        <Paperclip className="w-4 h-4"/> 
                        <span className="truncate">{typeof attachment === 'string' ? `Repassar: ${attachment}` : attachment?.name || "Anexar arquivo"}</span>
                        <input type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                        {attachment && <button onClick={(e) => {e.preventDefault(); setAttachment(null);}}><X className="w-4 h-4 text-red-500"/></button>}
                    </label>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => setIsActionModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                    <button onClick={confirmAction} disabled={!comment.trim()} className={`px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 ${comment.trim() ? selectedAction.color : 'bg-gray-300'}`}><Send className="w-4 h-4" /> Confirmar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { DocumentMetadata, User, UserRole, WorkflowStatus, BatchUpdateItem, NewDocumentPayload, DocumentType, SystemConfig, Language } from '../types';
import { STATUS_COLORS, TRANSLATIONS } from '../constants';
import { Filter, ChevronRight, Check, Square, Send, Archive, ShieldAlert, X, CheckSquare as CheckSquareIcon, Paperclip, ArrowUp, ArrowDown, LayoutTemplate, Plus, UploadCloud, CheckSquare } from 'lucide-react';

interface DocumentListProps {
  documents: DocumentMetadata[];
  onSelectDocument: (doc: DocumentMetadata) => void;
  user: User;
  title?: string;
  onBatchAction?: (items: BatchUpdateItem[], action: string, status?: WorkflowStatus) => void;
  onCreateDocument?: (data: NewDocumentPayload) => void;
  config?: SystemConfig;
  language: Language;
}

type ColumnKey = 'code' | 'title' | 'discipline' | 'nature' | 'version' | 'status' | 'updated' | 'geCode' | 'accessCode' | 'emitente' | 'action';

export const DocumentList: React.FC<DocumentListProps> = ({ 
    documents, 
    onSelectDocument, 
    user, 
    title,
    onBatchAction,
    onCreateDocument,
    config,
    language
}) => {
  const t = TRANSLATIONS[language].list; 

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterVersion, setFilterVersion] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: ColumnKey, direction: 'asc' | 'desc' } | null>(null);

  // Columns & Drag/Resize State
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([
      'code', 'title', 'geCode', 'accessCode', 'emitente', 'discipline', 'nature', 'version', 'status', 'updated', 'action'
  ]);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
      code: true, title: true, discipline: true, nature: true, version: true, status: true, updated: true,
      geCode: false, accessCode: false, emitente: false, action: true
  });
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({
      code: 150, title: 250, discipline: 120, nature: 150, version: 80, status: 120, updated: 120, geCode: 120, accessCode: 120, emitente: 120, action: 80
  });

  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const resizingRef = useRef<{key: ColumnKey, startX: number, startWidth: number} | null>(null);

  // Modal States
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [pendingBatchAction, setPendingBatchAction] = useState<{label: string, status: WorkflowStatus, icon?: React.ReactNode, color?: string} | null>(null);
  const [batchData, setBatchData] = useState<Record<string, { comment: string, attachment: File | string | null }>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Form State
  const [newDocData, setNewDocData] = useState<NewDocumentPayload>({
      code: '', geCode: '', accessCode: '', title: '', type: DocumentType.TECHNICAL,
      discipline: '', nature: '', emitente: '', file: null, informative: false, asBuilt: false, forecastDate: '', tafTac: ''
  });

  useEffect(() => {
      if (isCreateModalOpen && config) {
          setNewDocData(prev => ({
              ...prev,
              discipline: prev.discipline || config.disciplines[0],
              nature: prev.nature || config.natures[0],
              emitente: prev.emitente || config.issuers[0]
          }));
      }
  }, [isCreateModalOpen, config]);

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent, key: ColumnKey) => {
      e.stopPropagation();
      e.preventDefault(); 
      resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
  };

  const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  };

  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
      if(key === 'action') { e.preventDefault(); return; }
      setDraggedColumn(key);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetKey: ColumnKey) => {
      e.preventDefault();
      if (!draggedColumn || targetKey === 'action' || draggedColumn === targetKey) return;
      
      const newOrder = [...columnOrder];
      const draggedIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetKey);
      
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);
      
      setColumnOrder(newOrder);
  };

  // --- Filter & Sort Logic ---
  let processedDocs = documents.filter(doc => {
    if (filterStatus !== 'all' && doc.currentStatus !== filterStatus) return false;
    if (filterDiscipline !== 'all' && doc.discipline !== filterDiscipline) return false;
    if (filterVersion && !doc.currentVersion.toLowerCase().includes(filterVersion.toLowerCase())) return false;
    return true;
  });

  if (sortConfig) {
      processedDocs = [...processedDocs].sort((a, b) => {
          let aValue: any = a[sortConfig.key as keyof DocumentMetadata] || '';
          let bValue: any = b[sortConfig.key as keyof DocumentMetadata] || '';
          if(sortConfig.key === 'version') { aValue = a.currentVersion; bValue = b.currentVersion; }
          if(sortConfig.key === 'status') { aValue = a.currentStatus; bValue = b.currentStatus; }
          if(sortConfig.key === 'updated') { aValue = a.lastModified; bValue = b.lastModified; }
          
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }

  // --- Selection Logic ---
  const handleSelectAll = () => {
      if (selectedIds.size === processedDocs.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(processedDocs.map(d => d.id)));
  };

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelectedIds(newSelected);
  };

  // --- Batch Logic ---
  const getContextualBatchActions = () => {
    if (selectedIds.size === 0) return [];
    const selectedDocs = documents.filter(d => selectedIds.has(d.id));
    const uniqueStatuses = Array.from(new Set(selectedDocs.map(d => d.currentStatus)));
    
    if (uniqueStatuses.length > 1) {
        return [{ label: 'Status Misturados', disabled: true, icon: <ShieldAlert className="w-4 h-4"/>, reason: 'Selecione documentos com o mesmo status.' }];
    }

    const currentStatus = uniqueStatuses[0];
    const actions = [];
    const canManageWorkflow = user.roles.includes(UserRole.TECH_LEADER) || user.roles.includes(UserRole.ADMIN);
    const isClient = user.roles.includes(UserRole.CLIENT);
    const isAdmin = user.roles.includes(UserRole.ADMIN);

    if (canManageWorkflow) {
        if (currentStatus === WorkflowStatus.EVALUATION_LT) {
            actions.push({ label: 'Aprovar (Emitir Cliente)', status: WorkflowStatus.ANALYSIS_CLIENT, icon: <Send className="w-4 h-4"/>, color: 'bg-green-600' });
            actions.push({ label: 'Reprovar (Devolver)', status: WorkflowStatus.IN_REVIEW, icon: <X className="w-4 h-4"/>, color: 'bg-red-600' });
        } else if (currentStatus === WorkflowStatus.DRAFT || currentStatus === WorkflowStatus.MODERATION_LT) {
             actions.push({ label: 'Enviar p/ Revisão', status: WorkflowStatus.IN_REVIEW, icon: <Send className="w-4 h-4"/>, color: 'bg-blue-600' });
             if (currentStatus === WorkflowStatus.MODERATION_LT) actions.push({ label: 'Liberar p/ Execução', status: WorkflowStatus.EXECUTION, icon: <Check className="w-4 h-4"/>, color: 'bg-green-700' });
        } else if (currentStatus === WorkflowStatus.EXECUTION) {
             actions.push({ label: 'Retornar p/ Revisão', status: WorkflowStatus.IN_REVIEW, icon: <Send className="w-4 h-4 rotate-180"/>, color: 'bg-orange-600' });
        }
    }
    if (isClient && currentStatus === WorkflowStatus.ANALYSIS_CLIENT) {
        actions.push({ label: 'Aprovar', status: WorkflowStatus.EXECUTION, icon: <Check className="w-4 h-4"/>, color: 'bg-green-600' });
        actions.push({ label: 'Aprovar c/ Comentários', status: WorkflowStatus.MODERATION_LT, icon: <CheckSquareIcon className="w-4 h-4"/>, color: 'bg-yellow-600' });
        actions.push({ label: 'Reprovar', status: WorkflowStatus.MODERATION_LT, icon: <X className="w-4 h-4"/>, color: 'bg-red-600' });
    }
    if (isAdmin && (currentStatus === WorkflowStatus.EXECUTION || currentStatus === WorkflowStatus.AS_BUILT)) {
         actions.push({ label: 'Arquivar', status: WorkflowStatus.ARCHIVED, icon: <Archive className="w-4 h-4"/>, color: 'bg-slate-600' });
    }
    return actions.length ? actions : [{ label: 'Sem ações', disabled: true, icon: <ShieldAlert className="w-4 h-4"/> }];
  };

  const handleConfirmBatch = () => {
      if (!pendingBatchAction || !onBatchAction) return;
      const items: BatchUpdateItem[] = (Array.from(selectedIds) as string[]).map(id => ({
          id, comment: batchData[id]?.comment || '', attachment: batchData[id]?.attachment
      }));
      onBatchAction(items, 'status', pendingBatchAction.status);
      setIsBatchModalOpen(false);
      setPendingBatchAction(null);
      setSelectedIds(new Set());
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newDocData.code || !newDocData.title) return;
      if (onCreateDocument) {
          onCreateDocument(newDocData);
          setIsCreateModalOpen(false);
          // Reset form
          setNewDocData({ 
            code: '', geCode: '', accessCode: '', title: '', type: DocumentType.TECHNICAL, 
            discipline: config?.disciplines[0] || '', nature: config?.natures[0] || '', 
            emitente: config?.issuers[0] || '', file: null, informative: false, asBuilt: false, 
            forecastDate: '', tafTac: '' 
          });
      }
  };

  // Styles
  const filterInputStyle = "w-full border-2 border-gray-400 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-gray-900 bg-white font-medium placeholder-gray-400";
  const modalInputStyle = "w-full border-2 border-gray-400 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-gray-900 bg-white font-medium placeholder-gray-400";

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
             {(user.roles.includes(UserRole.TECH_LEADER) || user.roles.includes(UserRole.ADMIN)) && onCreateDocument && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> {t.newDoc}
                </button>
            )}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm flex flex-wrap gap-4 items-center">
             <div className="flex items-center text-sm font-bold text-gray-700 gap-2"><Filter className="w-4 h-4" />{t.filters}</div>
             <select className={filterInputStyle.replace('w-full', 'w-48')} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">{t.allStatus}</option>
                {Object.values(WorkflowStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <select className={filterInputStyle.replace('w-full', 'w-48')} value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)}>
                <option value="all">{t.allDisciplines}</option>
                {config?.disciplines.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
             <div className="relative">
                {/* Fixed Search Import Conflict */}
                <input type="text" placeholder={t.version} className={`${filterInputStyle} pl-3 w-32`} value={filterVersion} onChange={(e) => setFilterVersion(e.target.value)} />
             </div>
             {/* Column Menu */}
             <div className="relative ml-auto">
                 <button onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} className="flex items-center gap-2 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm font-medium text-black hover:bg-gray-50 uppercase bg-white">
                     <LayoutTemplate className="w-4 h-4 text-black" /> {t.columns}
                 </button>
                 {isColumnMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 max-h-96 overflow-y-auto">
                         {columnOrder.map((key, index) => key !== 'action' && (
                             <div key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}>
                                 <input 
                                    type="checkbox" 
                                    checked={visibleColumns[key]} 
                                    onChange={() => {}} 
                                    className="rounded border-gray-300 text-green-600 cursor-pointer" 
                                 />
                                 <span className="text-sm font-bold text-black uppercase cursor-pointer">{(t.headers as any)[key]}</span>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
             {(filterStatus !== 'all' || filterDiscipline !== 'all' || filterVersion !== '') && (
                 <button onClick={() => { setFilterStatus('all'); setFilterDiscipline('all'); setFilterVersion(''); }} className="text-xs text-red-600 font-bold border border-red-200 px-3 py-1 rounded bg-red-50">{t.clear}</button>
             )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: Object.keys(visibleColumns).filter(k=>visibleColumns[k as ColumnKey]).reduce((acc, k) => acc + columnWidths[k as ColumnKey], 50) + 'px' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 text-center p-2"><button onClick={handleSelectAll}>{selectedIds.size === processedDocs.length ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}</button></th>
                {columnOrder.map(key => visibleColumns[key] && (
                    <th 
                        key={key} 
                        style={{ width: columnWidths[key], cursor: key !== 'action' ? 'move' : 'default' }}
                        className="relative px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider select-none hover:bg-gray-100 group border-r border-transparent hover:border-gray-200"
                        draggable={key !== 'action'}
                        onDragStart={(e) => handleDragStart(e, key)}
                        onDragOver={(e) => handleDragOver(e, key)}
                        onClick={() => setSortConfig({ key, direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                        <div className="flex items-center gap-1 truncate">
                            {(t.headers as any)[key]}
                            {sortConfig?.key === key && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-green-600"/> : <ArrowDown className="w-3 h-3 text-green-600"/>)}
                        </div>
                        {key !== 'action' && (
                            <div 
                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-green-400"
                                onMouseDown={(e) => startResizing(e, key)}
                                onClick={(e) => e.stopPropagation()} 
                            />
                        )}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedDocs.map(doc => (
                  <tr key={doc.id} onClick={() => onSelectDocument(doc)} className={`cursor-pointer ${selectedIds.has(doc.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                          <button onClick={(e) => handleSelectOne(e, doc.id)}>{selectedIds.has(doc.id) ? <CheckSquare className="w-5 h-5 text-green-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button>
                      </td>
                      {columnOrder.map(key => visibleColumns[key] && (
                          <td key={key} className="px-4 py-3 truncate" style={{ width: columnWidths[key] }}>
                              {key === 'code' && <div className="font-bold text-gray-900 text-sm">{doc.code}</div>}
                              {key === 'title' && <div className="text-gray-700 text-sm font-medium" title={doc.title}>{doc.title}</div>}
                              {key === 'status' && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[doc.currentStatus]}`}>{doc.currentStatus}</span>}
                              {key === 'version' && <span className="font-mono font-extrabold text-black bg-gray-100 px-2 py-1 rounded text-xs">{doc.currentVersion}</span>}
                              {key === 'updated' && <span className="text-gray-500 text-xs">{new Date(doc.lastModified).toLocaleDateString()}</span>}
                              {key === 'action' && <ChevronRight className="w-4 h-4 text-gray-400 ml-auto"/>}
                              {['discipline', 'nature', 'emitente', 'geCode', 'accessCode'].includes(key) && <span className="text-sm text-gray-600">{(doc as any)[key] || '-'}</span>}
                          </td>
                      ))}
                  </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Batch Toolbar */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-40 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <span className="font-bold text-green-400">{selectedIds.size} {t.batch.selected}</span>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex gap-2">
                 {getContextualBatchActions().map((action, idx) => (
                    <button key={idx} disabled={action.disabled} onClick={() => action.status && (setPendingBatchAction(action), setIsBatchModalOpen(true))} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${action.disabled ? 'bg-slate-800 text-gray-500' : `${action.color} hover:opacity-90`}`}>
                        {action.icon} {action.label}
                    </button>
                 ))}
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="ml-4 text-xs text-gray-400 hover:text-white uppercase font-bold">{t.batch.cancel}</button>
          </div>
      )}

      {/* Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
                 <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {pendingBatchAction?.icon} {t.batch.confirm}
                        <span className="text-sm bg-gray-200 px-2 py-1 rounded text-gray-600 font-normal">
                             {selectedIds.size} {t.batch.selected}
                        </span>
                    </h2>
                    <button onClick={() => setIsBatchModalOpen(false)}><X className="w-6 h-6 text-gray-500"/></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                     <div className="space-y-4">
                         {(Array.from(selectedIds) as string[]).map(id => {
                             const doc = documents.find(d => d.id === id);
                             const hasPrevAttachment = doc?.versions[0]?.attachmentName;
                             return (
                             <div key={id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col gap-3">
                                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                     <span className="font-bold text-gray-800">{doc?.code}</span>
                                     <span className="text-sm text-gray-500">{doc?.title}</span>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <input 
                                         className={modalInputStyle} 
                                         placeholder="Comentário individual..."
                                         value={batchData[id]?.comment || ''}
                                         onChange={e => setBatchData(prev => ({...prev, [id]: { ...prev[id], comment: e.target.value }}))}
                                     />
                                     <div className="flex items-center gap-2">
                                         {hasPrevAttachment && !batchData[id]?.attachment && (
                                            <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-100" onClick={() => setBatchData(prev => ({...prev, [id]: { ...prev[id], attachment: hasPrevAttachment }}))}>
                                                <Paperclip className="w-4 h-4" /> <span>Repassar: {hasPrevAttachment}</span> <Plus className="w-4 h-4 ml-auto"/>
                                            </div>
                                         )}
                                         <label className={`flex-1 flex items-center gap-2 border border-dashed border-gray-400 p-2 rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-600 ${batchData[id]?.attachment ? 'bg-green-50 border-green-400 text-green-800' : ''}`}>
                                             <Paperclip className="w-4 h-4"/> 
                                             <span className="truncate">
                                                 {typeof batchData[id]?.attachment === 'string' 
                                                    ? `Repassando: ${batchData[id]?.attachment}` 
                                                    : batchData[id]?.attachment instanceof File 
                                                        ? (batchData[id]?.attachment as File).name 
                                                        : "Anexar novo arquivo"
                                                 }
                                             </span>
                                             <input type="file" className="hidden" onChange={e => setBatchData(prev => ({...prev, [id]: { ...prev[id], attachment: e.target.files?.[0] || null }}))} />
                                             {batchData[id]?.attachment && (
                                                 <button onClick={(e) => {e.preventDefault(); setBatchData(prev => ({...prev, [id]: { ...prev[id], attachment: null }}))}}><X className="w-4 h-4 text-red-500"/></button>
                                             )}
                                         </label>
                                     </div>
                                 </div>
                             </div>
                         )})}
                     </div>
                 </div>

                 <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
                     <button onClick={() => setIsBatchModalOpen(false)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg">{t.common.cancel}</button>
                     <button onClick={handleConfirmBatch} className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-md hover:opacity-90 ${pendingBatchAction?.color || 'bg-green-600'}`}>
                         {t.common.confirm}
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Plus className="w-5 h-5 text-green-700"/> {t.newDoc}</h2>
                      <button onClick={() => setIsCreateModalOpen(false)}><X className="w-6 h-6 text-gray-500"/></button>
                  </div>
                  <form onSubmit={handleSubmitCreate} className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="block text-sm font-bold text-gray-900 mb-1">Código *</label><input required className={modalInputStyle} value={newDocData.code} onChange={e => setNewDocData({...newDocData, code: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold text-gray-900 mb-1">Título *</label><input required className={modalInputStyle} value={newDocData.title} onChange={e => setNewDocData({...newDocData, title: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold text-gray-900 mb-1">Cód. GE</label><input className={modalInputStyle} value={newDocData.geCode} onChange={e => setNewDocData({...newDocData, geCode: e.target.value})} /></div>
                          <div><label className="block text-sm font-bold text-gray-900 mb-1">Cód. Acessada</label><input className={modalInputStyle} value={newDocData.accessCode} onChange={e => setNewDocData({...newDocData, accessCode: e.target.value})} /></div>
                          <div>
                              <label className="block text-sm font-bold text-gray-900 mb-1">Emitente</label>
                              <select className={modalInputStyle} value={newDocData.emitente} onChange={e => setNewDocData({...newDocData, emitente: e.target.value})}>
                                  {config?.issuers.map(i => <option key={i} value={i}>{i}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-900 mb-1">Disciplina</label>
                              <select className={modalInputStyle} value={newDocData.discipline} onChange={e => setNewDocData({...newDocData, discipline: e.target.value})}>
                                  {config?.disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-900 mb-1">Natureza</label>
                              <select className={modalInputStyle} value={newDocData.nature} onChange={e => setNewDocData({...newDocData, nature: e.target.value})}>
                                  {config?.natures.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                          </div>
                          <div><label className="block text-sm font-bold text-gray-900 mb-1">Previsão *</label><input type="date" required className={modalInputStyle} value={newDocData.forecastDate} onChange={e => setNewDocData({...newDocData, forecastDate: e.target.value})} /></div>
                          {/* New Fields */}
                          <div>
                               <label className="block text-sm font-bold text-gray-900 mb-1">TAF/TAC</label>
                               <input className={modalInputStyle} list="taf-tac-options" value={newDocData.tafTac} onChange={e => setNewDocData({...newDocData, tafTac: e.target.value})} />
                               <datalist id="taf-tac-options">
                                   <option value="TAF" />
                                   <option value="TAC" />
                               </datalist>
                          </div>
                          <div className="flex items-center gap-6 mt-6">
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500" checked={newDocData.informative} onChange={e => setNewDocData({...newDocData, informative: e.target.checked})} />
                                   <span className="font-bold text-gray-700 text-sm">Informativo</span>
                               </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" checked={newDocData.asBuilt} onChange={e => setNewDocData({...newDocData, asBuilt: e.target.checked})} />
                                   <span className="font-bold text-gray-700 text-sm">As Built</span>
                               </label>
                          </div>
                      </div>
                      <div className="p-6 border-dashed border-2 border-gray-300 rounded-lg bg-gray-50 text-center cursor-pointer hover:border-green-500 relative">
                          <input type="file" className="absolute inset-0 opacity-0" onChange={e => setNewDocData({...newDocData, file: e.target.files?.[0]})} />
                          <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2"/>
                          <p className="text-sm font-bold text-gray-600">{newDocData.file ? newDocData.file.name : "Clique para anexar arquivo inicial"}</p>
                      </div>
                  </form>
                  <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                      <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-lg">{t.common.cancel}</button>
                      <button onClick={handleSubmitCreate} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700">{t.common.confirm}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
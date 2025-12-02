
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DocumentMetadata, User, WorkflowStatus, UserRole, Language } from '../types';
import { Clock, CheckCircle2, AlertTriangle, FileText, Calendar, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  documents: DocumentMetadata[];
  user: User;
  onViewDocument?: (doc: DocumentMetadata) => void;
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ documents, user, onViewDocument, language = 'PT' }) => {
  const [deadlineDays, setDeadlineDays] = useState(7);
  
  const t = TRANSLATIONS[language].dashboard;

  // Calculate Stats
  const total = documents.length;
  const inProgress = documents.filter(d => 
    d.currentStatus !== WorkflowStatus.AS_BUILT && 
    d.currentStatus !== WorkflowStatus.ARCHIVED && 
    d.currentStatus !== WorkflowStatus.CANCELLED
  ).length;
  const pendingClient = documents.filter(d => d.currentStatus === WorkflowStatus.ANALYSIS_CLIENT).length;
  const execution = documents.filter(d => d.currentStatus === WorkflowStatus.EXECUTION || d.currentStatus === WorkflowStatus.AS_BUILT).length;

  // --- Task Logic ---
  const getMyTasks = () => {
      const isDesigner = user.roles.includes(UserRole.DESIGNER);
      const isTechLeader = user.roles.includes(UserRole.TECH_LEADER);
      const isClient = user.roles.includes(UserRole.CLIENT);

      return documents.filter(doc => {
          if (isDesigner && (doc.currentStatus === WorkflowStatus.DRAFT || doc.currentStatus === WorkflowStatus.IN_REVIEW)) return true;
          if (isTechLeader && (doc.currentStatus === WorkflowStatus.EVALUATION_LT || doc.currentStatus === WorkflowStatus.MODERATION_LT)) return true;
          if (isClient && doc.currentStatus === WorkflowStatus.ANALYSIS_CLIENT) return true;
          return false;
      });
  };

  const tasks = getMyTasks();

  // --- Deadline Logic ---
  const today = new Date();
  today.setHours(0,0,0,0);

  const getOverdueDocs = () => {
      return documents.filter(doc => {
          if (!doc.forecastDate) return false;
          // Only check deadlines for active documents
          if (doc.currentStatus === WorkflowStatus.AS_BUILT || doc.currentStatus === WorkflowStatus.ARCHIVED || doc.currentStatus === WorkflowStatus.CANCELLED) return false;
          
          const deadline = new Date(doc.forecastDate);
          deadline.setHours(0,0,0,0);
          return deadline < today;
      });
  };

  const getUpcomingDocs = () => {
      return documents.filter(doc => {
          if (!doc.forecastDate) return false;
          if (doc.currentStatus === WorkflowStatus.AS_BUILT || doc.currentStatus === WorkflowStatus.ARCHIVED || doc.currentStatus === WorkflowStatus.CANCELLED) return false;

          const deadline = new Date(doc.forecastDate);
          deadline.setHours(0,0,0,0);
          const diffTime = deadline.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays >= 0 && diffDays <= deadlineDays;
      });
  };

  const overdueDocs = getOverdueDocs();
  const upcomingDocs = getUpcomingDocs();

  // Chart Data
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.currentStatus] = (acc[doc.currentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(statusCounts).map(status => ({
    name: status.split('(')[0].trim(), // Shorten name
    count: statusCounts[status]
  }));

  const pieData = [
    { name: t.inProgress, value: inProgress },
    { name: t.execution, value: execution },
    { name: 'Cancelado', value: documents.filter(d => d.currentStatus === WorkflowStatus.CANCELLED).length }
  ];

  const COLORS = ['#F59E0B', '#10B981', '#EF4444'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        <div className="text-sm text-gray-500">
           Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title={t.total} 
          value={total} 
          icon={<FileText className="text-blue-600" />} 
          bg="bg-blue-50"
        />
        <StatCard 
          title={t.inProgress} 
          value={inProgress} 
          icon={<Clock className="text-orange-600" />} 
          bg="bg-orange-50"
        />
        <StatCard 
          title={t.pending} 
          value={pendingClient} 
          icon={<AlertTriangle className="text-purple-600" />} 
          bg="bg-purple-50"
        />
        <StatCard 
          title={t.execution} 
          value={execution} 
          icon={<CheckCircle2 className="text-green-600" />} 
          bg="bg-green-50"
        />
      </div>

      {/* --- TASKS & DEADLINES SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* My Tasks */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {t.myTasks}
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{tasks.length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {tasks.length > 0 ? tasks.map(doc => (
                      <TaskItem key={doc.id} doc={doc} onClick={() => onViewDocument?.(doc)} type="task" />
                  )) : (
                      <div className="text-gray-400 text-sm text-center py-10">Você não possui pendências.</div>
                  )}
              </div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {t.overdue}
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{overdueDocs.length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {overdueDocs.length > 0 ? overdueDocs.map(doc => (
                      <TaskItem key={doc.id} doc={doc} onClick={() => onViewDocument?.(doc)} type="overdue" />
                  )) : (
                      <div className="text-gray-400 text-sm text-center py-10">Nenhum documento vencido.</div>
                  )}
              </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      {t.upcoming}
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{upcomingDocs.length}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{deadlineDays} dias</span>
                      <input 
                        type="range" min="1" max="30" 
                        value={deadlineDays} 
                        onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {upcomingDocs.length > 0 ? upcomingDocs.map(doc => (
                      <TaskItem key={doc.id} doc={doc} onClick={() => onViewDocument?.(doc)} type="upcoming" />
                  )) : (
                      <div className="text-gray-400 text-sm text-center py-10">Nenhum documento para vencer em {deadlineDays} dias.</div>
                  )}
              </div>
          </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.statusChart}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.lifecycleChart}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[index]}}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg }: { title: string, value: number, icon: React.ReactNode, bg: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      {icon}
    </div>
  </div>
);

interface TaskItemProps {
    doc: DocumentMetadata;
    onClick: () => void;
    type: 'task' | 'overdue' | 'upcoming';
}

const TaskItem: React.FC<TaskItemProps> = ({ doc, onClick, type }) => {
    let borderColor = 'border-l-4 border-gray-300';
    if (type === 'task') borderColor = 'border-l-4 border-green-500';
    if (type === 'overdue') borderColor = 'border-l-4 border-red-500';
    if (type === 'upcoming') borderColor = 'border-l-4 border-blue-500';

    return (
        <div 
            onClick={onClick}
            className={`bg-gray-50 p-3 rounded shadow-sm hover:bg-gray-100 cursor-pointer transition-colors ${borderColor}`}
        >
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-700">{doc.code}</span>
                <span className="text-[10px] text-gray-400">{doc.currentVersion}</span>
            </div>
            <p className="text-xs font-medium text-gray-900 truncate mt-1">{doc.title}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-gray-500">{doc.currentStatus}</span>
                {doc.forecastDate && <span className="text-[10px] text-gray-500">{new Date(doc.forecastDate).toLocaleDateString()}</span>}
            </div>
        </div>
    );
};

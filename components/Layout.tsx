
import React from 'react';
import { 
  LayoutDashboard, Settings, Menu, Bell, Search, LogOut, ChevronDown, HardHat, Briefcase, ScrollText, Folder
} from 'lucide-react';
import { Language, User, Project, UserRole } from '../types';
import { ROLE_ICONS, TRANSLATIONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onNavigate: (page: string) => void;
  activePage: string;
  availableUsers: User[];
  onSwitchUser: (userId: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  projects: Project[];
  currentProject: Project;
  onSwitchProject: (id: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, user, onNavigate, activePage, availableUsers, onSwitchUser, language, setLanguage, projects, currentProject, onSwitchProject
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const primaryRole = user.roles[0];
  const t = TRANSLATIONS[language].nav;
  const canSwitchProject = !user.projectId || user.roles.includes(UserRole.ADMIN);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {isSidebarOpen ? <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-200 truncate">Nova Archive</span> : <span className="text-xl font-bold text-green-400 mx-auto">NA</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded"><Menu className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Project Selector */}
        <div className={`px-4 py-4 border-b border-slate-800 transition-all ${!isSidebarOpen && 'hidden'}`}>
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Projeto Atual</label>
             {canSwitchProject ? (
                 <div className="relative group">
                    <select 
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white appearance-none focus:border-green-500 outline-none"
                        value={currentProject.id}
                        onChange={(e) => onSwitchProject(e.target.value)}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                 </div>
             ) : (
                 <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-gray-300 flex items-center gap-2">
                     <Folder className="w-4 h-4 text-green-500" />
                     {currentProject.code}
                 </div>
             )}
             {isSidebarOpen && <p className="text-[10px] text-gray-500 mt-1 truncate">{currentProject.name}</p>}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          <NavItem icon={<LayoutDashboard />} label={t.dashboard} isOpen={isSidebarOpen} active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
          <div className={`mt-4 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>{t.documentation}</div>
          <NavItem icon={<HardHat />} label={t.technical} isOpen={isSidebarOpen} active={activePage === 'technical'} onClick={() => onNavigate('technical')} />
          <NavItem icon={<Briefcase />} label={t.managerial} isOpen={isSidebarOpen} active={activePage === 'managerial'} onClick={() => onNavigate('managerial')} />
          <NavItem icon={<ScrollText />} label={t.grd} isOpen={isSidebarOpen} active={activePage === 'grd'} onClick={() => onNavigate('grd')} />
          <div className={`mt-4 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>{t.system}</div>
           <NavItem icon={<Settings />} label={t.settings} isOpen={isSidebarOpen} active={activePage === 'settings'} onClick={() => onNavigate('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
             <div className="relative">
                 <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-green-500" />
                 <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900"></div>
             </div>
             {isSidebarOpen && (
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium truncate">{user.name}</p>
                 <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                   {ROLE_ICONS[primaryRole]} {user.roles.length > 1 ? `${primaryRole} +${user.roles.length - 1}` : primaryRole}
                 </p>
               </div>
             )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center bg-gray-100 border-2 border-transparent focus-within:border-gray-400 rounded-lg px-3 py-2 w-96 transition-colors">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder-gray-500 font-medium" />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['PT', 'ES', 'EN'] as Language[]).map((lang) => (
                    <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === lang ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-800'}`}>{lang}</button>
                ))}
             </div>
             <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors">
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Demo</span>
                  <span className="w-px h-4 bg-gray-300 mx-1"></span> {user.name} <ChevronDown className="w-4 h-4" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase">{t.switchUser}</div>
                    {availableUsers.map(u => (
                      <button key={u.id} onClick={() => { onSwitchUser(u.id); setIsUserMenuOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${user.id === u.id ? 'bg-green-50' : ''}`}>
                        <img src={u.avatar} className="w-8 h-8 rounded-full" />
                        <div><p className="text-sm font-medium text-gray-800">{u.name}</p><p className="text-xs text-gray-500">{u.roles.join(', ')}</p></div>
                        {user.id === u.id && <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1"><button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" />{t.logout}</button></div>
                  </div>
                )}
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, isOpen, active, onClick }: { icon: React.ReactNode, label: string, isOpen: boolean, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-3 transition-colors ${active ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'}`}>
    <span className={`${active ? 'text-white' : 'text-gray-400'}`}>{icon}</span>
    {isOpen && <span className="ml-3 font-medium text-sm">{label}</span>}
    {active && isOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
  </button>
);

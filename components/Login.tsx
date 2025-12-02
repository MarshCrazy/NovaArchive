

import React, { useState } from 'react';
import { Box } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LoginProps {
    onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lang, setLang] = useState<Language>('PT');
    
    const t = TRANSLATIONS[lang].login;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock validation
        if(email && password) {
            onLogin(email);
        }
    };

    // High Contrast Input Style
    const inputStyle = "w-full border-2 border-gray-400 rounded-lg p-3 text-sm font-medium text-gray-900 bg-white focus:border-green-600 focus:ring-0 outline-none transition-all placeholder-gray-400";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
                         <span className="text-2xl font-bold text-green-400">NA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center">{t.title}</h1>
                    <p className="text-gray-500 text-sm mt-1">GE Vernova Document Management</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.email}</label>
                        <input 
                            type="email" 
                            required
                            className={inputStyle}
                            placeholder="user@ge.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.password}</label>
                        <input 
                            type="password" 
                            required
                            className={inputStyle}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        {t.button}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs">
                     <button className="text-gray-500 hover:text-green-600">{t.forgot}</button>
                     <div className="flex gap-2">
                        {(['PT', 'ES', 'EN'] as Language[]).map(l => (
                            <button 
                                key={l} 
                                onClick={() => setLang(l)} 
                                className={`font-bold ${lang === l ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {l}
                            </button>
                        ))}
                     </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <Box className="w-4 h-4" />
                    Powered by Box Content Cloud
                </div>
            </div>
        </div>
    );
};
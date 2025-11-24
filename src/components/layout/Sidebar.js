import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    Users, Briefcase, Book, LayoutDashboard, LogOut, Handshake, Lightbulb
} from 'lucide-react';

const Sidebar = ({ auth }) => {
    const location = useLocation();
    const handleLogout = () => signOut(auth);
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/partners', label: 'Parceiros', icon: Users },
        { path: '/opportunities', label: 'Oportunidades', icon: Briefcase },
        { path: '/resources', label: 'Recursos', icon: Book },
        { path: '/nurturing', label: 'Nutrição', icon: Lightbulb },
    ];

    return (
        <aside className="w-16 sm:w-64 bg-slate-800 text-white flex flex-col">
            <div className="h-16 flex items-center justify-center sm:justify-start sm:px-6 border-b border-slate-700">
                <img src="/logo-driva-negativa.png" alt="Logo Driva" className="h-8 hidden sm:block" />
                <Handshake className="h-8 w-8 text-white sm:hidden" />
            </div>
            <nav className="flex-1 mt-6">
                <ul>
                    {navItems.map(item => (
                        <li key={item.path} className="px-3 sm:px-6 py-1">
                            <Link
                                to={item.path}
                                className={`w-full flex items-center p-2 rounded-md transition-colors duration-200 ${location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/')
                                        ? 'bg-sky-500 text-white'
                                        : 'hover:bg-slate-700'
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="hidden sm:inline ml-4 font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden sm:inline ml-4 font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

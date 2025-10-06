import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';

const ActionsMenu = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (<div className="relative" ref={menuRef}><button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200"><MoreVertical size={18} /></button>{isOpen && (<div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border"><button onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Edit size={16} className="mr-2" /> Editar</button><button onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={16} className="mr-2" /> Excluir</button></div>)}</div>);
};

export default ActionsMenu;

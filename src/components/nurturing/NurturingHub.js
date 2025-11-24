import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Edit, Trash2 } from 'lucide-react';

const NurturingHub = ({ nurturingContent, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredContent = useMemo(() => {
        if (!searchTerm) return nurturingContent;
        const lowerTerm = searchTerm.toLowerCase();
        return nurturingContent.filter(item =>
            item.title.toLowerCase().includes(lowerTerm) ||
            item.content.toLowerCase().includes(lowerTerm)
        );
    }, [nurturingContent, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Conteúdos de Nutrição</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar conteúdos..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => onEdit(null)}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-2"
                >
                    <BookOpen className="h-5 w-5" />
                    Novo Conteúdo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-sky-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-sky-600" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-sky-600 transition-colors">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => onDelete('nurturing', item.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                        <p className="text-slate-600 text-sm line-clamp-4 flex-grow">{item.content}</p>
                    </div>
                ))}
                {filteredContent.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Nenhum conteúdo encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NurturingHub;

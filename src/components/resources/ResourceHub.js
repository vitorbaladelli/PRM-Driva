import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import ActionsMenu from '../common/ActionsMenu';

const ResourceHub = ({ resources, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResources = useMemo(() => {
        if (!searchTerm) return resources;
        const lowerTerm = searchTerm.toLowerCase();
        return resources.filter(r => 
            r.title.toLowerCase().includes(lowerTerm) ||
            r.description.toLowerCase().includes(lowerTerm) ||
            r.category.toLowerCase().includes(lowerTerm)
        );
    }, [resources, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Recursos</h2>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar recursos..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col relative transition-all duration-200 hover:shadow-lg">
                        <div className="absolute top-2 right-2">
                            <ActionsMenu onEdit={() => onEdit(r)} onDelete={() => onDelete('resources', r.id)} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 pr-8">{r.title}</h3>
                        <p className="text-slate-600 mt-2 flex-grow">{r.description}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full">
                                {r.category}
                            </span>
                            <a 
                                href={r.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-bold text-sky-500 hover:text-sky-600 transition-colors"
                            >
                                Aceder
                            </a>
                        </div>
                    </div>
                ))}
                {filteredResources.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">Nenhum recurso encontrado para "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceHub;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, PlusCircle, Loader2, ArrowRight, Edit2, Trash2, X } from 'lucide-react';

const Dashboard = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPartyName, setNewPartyName] = useState('');
    const [editPartyName, setEditPartyName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState(null);
    const navigate = useNavigate();

    const fetchParties = async () => {
        try {
            const res = await api.get('/api/parties');
            setParties(res.data);
        } catch (err) {
            console.error('Error fetching parties:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParties();
    }, []);

    const handleAddParty = async (e) => {
        e.preventDefault();
        if (!newPartyName.trim()) return;
        setIsAdding(true);
        try {
            await api.post('/api/parties', { name: newPartyName });
            setNewPartyName('');
            fetchParties();
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            alert('Failed to add partner: ' + msg);
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditParty = async (e) => {
        e.preventDefault();
        if (!editPartyName.trim()) return;
        setIsAdding(true);
        try {
            await api.put(`/api/parties/${selectedParty._id}`, { name: editPartyName });
            setEditModalOpen(false);
            fetchParties();
        } catch (err) {
            alert('Edit failed: ' + err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteParty = async (party) => {
        if (!window.confirm(`Delete ${party.name} and all their history?`)) return;
        try {
            await api.delete(`/api/parties/${party._id}`);
            fetchParties();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    if (loading) return (
        <div className="flex h-[70vh] items-center justify-center">
            <Loader2 className="animate-spin text-slate-400 h-10 w-10" />
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Minimalist Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-slate-900 leading-tight">Registered Parties</h2>
                    <p className="text-slate-500 font-medium">Select a partner to manage their stock balance.</p>
                </div>

                <div className="bg-white p-2 border border-slate-200 rounded-xl flex items-center shadow-sm">
                    <form onSubmit={handleAddParty} className="flex items-center space-x-2">
                        <Users className="text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Register New Party..."
                            className="bg-transparent border-none outline-none px-4 text-sm font-medium w-64"
                            value={newPartyName}
                            onChange={(e) => setNewPartyName(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={isAdding}
                            className="btn btn-primary flex items-center justify-center px-6"
                        >
                            {isAdding ? <Loader2 className="animate-spin" size={16} /> : 'ADD'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Parties Grid - Clean Minimalism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {parties.length === 0 ? (
                  <div className="col-span-full py-20 text-center card bg-slate-50/50 border-dashed">
                    <p className="text-slate-400 font-medium font-italic">No parties registered yet.</p>
                  </div>
                ) : parties.map((party) => (
                    <div
                        key={party._id}
                        onClick={() => navigate(`/party/${party.name}`)}
                        className="card group cursor-pointer hover:border-slate-400 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-[#F26622] group-hover:text-white transition-colors">
                                    {party.name[0].toUpperCase()}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800" onClick={() => navigate(`/party/${party.name}`)}>
                                    {party.name}
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedParty(party); setEditPartyName(party.name); setEditModalOpen(true); }}
                                    className="p-2 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200 rounded-lg transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteParty(party); }}
                                    className="p-2 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <ArrowRight size={18} className="text-slate-300 group-hover:text-[#F26622] group-hover:translate-x-1 transition-all ml-2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-bold">Edit Party Name</h4>
                            <button onClick={() => setEditModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleEditParty} className="space-y-4">
                            <input
                                type="text"
                                autoFocus
                                className="input-field py-3 text-lg font-bold"
                                value={editPartyName}
                                onChange={(e) => setEditPartyName(e.target.value)}
                            />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" disabled={isAdding} className="flex-2 btn btn-primary py-3 font-bold">{isAdding ? '...' : 'UPDATE'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { 
    Package, 
    ArrowLeft, 
    Plus, 
    PlusCircle,
    Minus, 
    History, 
    Loader2, 
    Search,
    Clock,
    Edit2,
    Trash2,
    X,
    Users
} from 'lucide-react';

const PartyInventory = () => {
    const { partyName } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [transactionType, setTransactionType] = useState('OUT');
    const [qty, setQty] = useState('');
    const [editName, setEditName] = useState('');
    const [newAssetName, setNewAssetName] = useState('');
    const [notes, setNotes] = useState(''); // New customer field
    const [history, setHistory] = useState([]);
    const [editingTx, setEditingTx] = useState(null); // Track which log to edit
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchPartyStock = async () => {
        try {
            const res = await api.get(`/api/party/${partyName}/stock`);
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching party stock:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartyStock();
    }, [partyName]);

    const openModal = (product, type) => {
        setSelectedProduct(product);
        setTransactionType(type);
        setQty('');
        setNotes(''); // Clear notes every time
        setModalOpen(true);
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!qty || Number(qty) <= 0) return;
        setSaving(true);
        try {
            await api.post('/api/transactions', {
                productId: selectedProduct._id,
                type: transactionType,
                quantity: qty,
                party: partyName,
                notes: notes // Send customer/note
            });
            setModalOpen(false);
            fetchPartyStock();
        } catch (err) {
            alert('Error updating stock: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product and its history?')) return;
        try {
            await api.delete(`/api/products/${id}`);
            fetchPartyStock();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return;
        setSaving(true);
        try {
            await api.put(`/api/products/${selectedProduct._id}`, { name: editName });
            setEditModalOpen(false);
            fetchPartyStock();
        } catch (err) {
            alert('Edit failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        console.log('FRONTEND Registering New Asset:', newAssetName);
        if (!newAssetName.trim()) return;
        
        // 1. Check if name ALREADY exists in our global list
        const existing = allProducts.find(p => p.name.trim().toLowerCase() === newAssetName.trim().toLowerCase());
        if (existing) {
            console.log('Item already exists globally:', existing.name);
            alert(`"${existing.name}" is already registered in the system. Use the "ADD STOCK" button on their row or search for it if hidden.`);
            setAddAssetModalOpen(false);
            setNewAssetName('');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/api/products', { 
                name: newAssetName, 
                party: partyName 
            });
            console.log('Asset registered successfully:', res.data);
            setNewAssetName('');
            setAddAssetModalOpen(false);
            fetchPartyStock();
        } catch (err) {
            console.error('Registration API Error:', err);
            const msg = err.response?.data?.error || err.message;
            alert('Registration failed: ' + msg);
        } finally {
            setSaving(false);
        }
    };

    const viewHistory = async (product) => {
        setSelectedProduct(product);
        setHistoryModalOpen(true);
        try {
            const res = await api.get(`/api/products/${product._id}/history`);
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const handleUpdateTx = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/transactions/${editingTx._id}`, {
                date: editDate,
                notes: editNotes
            });
            setEditingTx(null);
            // Refresh history
            viewHistory(selectedProduct);
        } catch (err) {
            alert('Failed to update log: ' + err.message);
        }
    };

    // Filter logic: Show if party HAS it, HAS USED it before, OR they created it, OR it belongs to no one (Old item)
    const filtered = products.filter(p => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch = p.name.trim().toLowerCase().includes(query);
        const hasBalance = p.partyBalance !== 0;
        const hasUsedIt = p.hasHistory;
        const belongsToThem = p.createdByParty && p.createdByParty.trim().toLowerCase() === partyName.trim().toLowerCase(); 
        
        // Logic: If searching, show all matches globally. If not searching, only show 'their' active assets.
        if (query) return matchesSearch;
        return hasBalance || hasUsedIt || belongsToThem;
    });

    // We also need a version for the "Add Stock" dropdown that shows ALL products
    const allProducts = products;

    if (loading) return (
        <div className="flex h-[70vh] items-center justify-center">
            <Loader2 className="animate-spin text-slate-400 h-10 w-10" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div className="space-y-1">
                    <Link to="/" className="flex items-center text-slate-400 hover:text-slate-600 text-sm font-medium">
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">Stock: {partyName}</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setAddAssetModalOpen(true)} className="btn btn-secondary text-sm flex items-center space-x-2">
                        <PlusCircle size={18} /> <span>REGISTER NEW ITEM</span>
                    </button>
                </div>
            </div>

            <div className="card bg-white p-2 border-slate-200 shadow-sm flex items-center group focus-within:border-slate-400 transition-colors mb-6">
                <Search className="ml-3 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search stock list..."
                    className="bg-transparent border-none outline-none px-4 py-2.5 text-sm font-medium w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Simple Table */}
            <div className="card overflow-hidden p-0 border border-slate-200">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th>Stock Description</th>
                            <th className="text-center">Party Balance</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-12 text-slate-400">No stock found.</td></tr>
                        ) : filtered.map(product => (
                            <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                                <td className="font-bold text-slate-800">{product.name}</td>
                                <td className="text-center text-xl font-bold text-[#F26622]">
                                    {product.partyBalance} <span className="text-[10px] text-slate-400">{product.unit || 'uds'}</span>
                                </td>
                                <td>
                                    <div className="flex justify-end gap-2 px-4">
                                        <button onClick={() => { setSelectedProduct(product); setEditName(product.name); setEditModalOpen(true); }} className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteProduct(product._id)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                                        <button onClick={() => viewHistory(product)} className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"><History size={16} /></button>
                                        <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center"></div>
                                        <button onClick={() => openModal(product, 'OUT')} className="btn btn-outline text-xs px-4 font-bold">ADD STOCK</button>
                                        <button onClick={() => openModal(product, 'IN')} className="btn btn-secondary text-xs px-4 font-bold">MINUS STOCK</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modals */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className="text-xl font-bold mb-6">{transactionType === 'OUT' ? 'Add Party Stock' : 'Minus Party Stock'}</h4>
                        <form onSubmit={handleTransaction} className="space-y-6">
                            {allProducts.length > 1 && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400">Select Product</label>
                                    <select 
                                        value={selectedProduct?._id}
                                        onChange={(e) => setSelectedProduct(allProducts.find(p => p._id === e.target.value))}
                                        className="input-field"
                                    >
                                        {allProducts.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">Quantity</label>
                                <input type="number" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} className="input-field text-2xl font-bold py-4 text-center" placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">Customer / Notes</label>
                                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field py-3" placeholder="Reference Name..." />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-2 btn btn-primary py-3 font-bold">{saving ? '...' : 'CONFIRM'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {addAssetModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className="text-xl font-bold mb-6">Register New Asset</h4>
                        <form onSubmit={handleAddAsset} className="space-y-4">
                            <input type="text" autoFocus className="input-field py-3 text-lg font-bold" placeholder="Asset Name..." value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setAddAssetModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-2 btn btn-primary py-3 font-bold">SAVE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 className="text-xl font-bold mb-6">Edit Asset Name</h4>
                        <form onSubmit={handleEditProduct} className="space-y-4">
                            <input type="text" autoFocus className="input-field py-3 text-lg font-bold" value={editName} onChange={(e) => setEditName(e.target.value)} />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-2 btn btn-primary py-3 font-bold">UPDATE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {historyModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-2xl h-[70vh] flex flex-col p-0">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold uppercase tracking-tight">{selectedProduct?.name} History</h3>
                            <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900"><X /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {history.length === 0 ? <p className="text-center py-10 text-slate-300">No logs found.</p> : history.map((tx) => (
                                <div key={tx._id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                       <div className="flex items-center space-x-3">
                                           <div className={`p-2 rounded font-bold text-[10px] ${tx.type === 'OUT' ? 'bg-orange-100 text-[#F26622]' : 'bg-lime-100 text-lime-700'}`}>{tx.type === 'OUT' ? 'ADD' : 'MINUS'}</div>
                                           <div>
                                               <div className="text-sm font-bold text-slate-800">{new Date(tx.date).toLocaleDateString()}</div>
                                               <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Target: {tx.party || 'General'}</div>
                                           </div>
                                       </div>
                                       <div className="flex items-center space-x-4">
                                           <div className={`text-xl font-bold ${tx.type === 'OUT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                               {tx.type === 'OUT' ? '+' : '-'}{tx.quantity}
                                           </div>
                                           <button 
                                              onClick={() => { setEditingTx(tx); setEditDate(tx.date.split('T')[0]); setEditNotes(tx.notes || ''); }}
                                              className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                                           >
                                              <Edit2 size={14} />
                                           </button>
                                       </div>
                                    </div>
                                    
                                    {editingTx?._id === tx._id ? (
                                        <form onSubmit={handleUpdateTx} className="p-4 bg-slate-900 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                                           <div className="grid grid-cols-2 gap-3">
                                               <div className="space-y-1">
                                                   <label className="text-[9px] font-black text-slate-500 uppercase">Edit Date</label>
                                                   <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-white/10 border-none text-white text-xs p-2 rounded" />
                                               </div>
                                               <div className="space-y-1">
                                                   <label className="text-[9px] font-black text-slate-500 uppercase">Edit Notes</label>
                                                   <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full bg-white/10 border-none text-white text-xs p-2 rounded" placeholder="Customer name..." />
                                               </div>
                                           </div>
                                           <div className="flex gap-2">
                                               <button type="button" onClick={() => setEditingTx(null)} className="flex-1 text-[10px] text-slate-400 font-bold">CANCEL</button>
                                               <button type="submit" className="flex-1 text-[10px] bg-white text-slate-900 py-2 rounded font-black">SAVE CHANGE</button>
                                           </div>
                                        </form>
                                    ) : (
                                        tx.notes && (
                                            <div className="text-[11px] font-medium text-slate-500 border-t border-slate-50 pt-2 flex items-center">
                                                <Users size={12} className="mr-2 opacity-30" /> REF: {tx.notes}
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartyInventory;

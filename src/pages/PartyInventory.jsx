import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
    Users,
    Download,
    Calendar
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
    const [notes, setNotes] = useState('');
    const [chipLayout, setChipLayout] = useState('');
    const [qtyOfSheet, setQtyOfSheet] = useState('');
    const [keyEncoding, setKeyEncoding] = useState('');
    const [designParty, setDesignParty] = useState('');
    const [txDate, setTxDate] = useState('');
    const [store, setStore] = useState('');
    const [history, setHistory] = useState([]);
    const [editingTx, setEditingTx] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editDesignParty, setEditDesignParty] = useState('');
    const [editChipLayout, setEditChipLayout] = useState('');
    const [editQtyOfSheet, setEditQtyOfSheet] = useState('');
    const [editKeyEncoding, setEditKeyEncoding] = useState('');
    const [editStore, setEditStore] = useState('');
    const [saving, setSaving] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const todayStr = () => new Date().toISOString().split('T')[0];

    const exportAllToExcel = () => {
        const rows = filtered.map((product, idx) => {
            const totalBalance = product.breakdown && product.breakdown.length > 0
                ? product.breakdown.reduce((sum, b) => sum + b.balance, 0)
                : product.partyBalance;

            let totalUnit = 0;
            let totalOffice = 0;

            if (product.breakdown) {
                product.breakdown.forEach(b => {
                    const isUnit = b.store && b.store.toLowerCase() === 'unit';
                    const isOffice = b.store && b.store.toLowerCase() === 'office';
                    const qty = b.balance;
                    if (isUnit) totalUnit += qty;
                    if (isOffice) totalOffice += qty;
                });
            }

            return {
                '#': idx + 1,
                'Stock Description': product.name,
                'Unit Balance': totalUnit,
                'Office Balance': totalOffice,
                'Total Balance': totalBalance
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [5, 40, 15, 15, 15].map(w => ({ wch: w }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory Overview');
        XLSX.writeFile(wb, `${partyName}_Inventory_Overview.xlsx`);
    };

    // Auto-calculate Cards Qty = Chip Layout × Qnty of Sheet
    useEffect(() => {
        if (transactionType !== 'IN') return; // Only auto-calculate for MINUS STOCK

        const layout = Number(chipLayout);
        const sheets = Number(qtyOfSheet);
        if (layout > 0 && sheets > 0) {
            setQty(String(layout * sheets));
        } else {
            setQty('');
        }
    }, [chipLayout, qtyOfSheet, transactionType]);

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
        setNotes('');
        setChipLayout('');
        setQtyOfSheet('');
        setKeyEncoding('');
        setDesignParty('');
        setTxDate(todayStr());
        setStore('');
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
                quantity: qtyOfSheet && chipLayout ? Number(qtyOfSheet) * Number(chipLayout) : qty,
                party: partyName,
                notes,
                chipLayout: chipLayout || undefined,
                qtyOfSheet: transactionType === 'IN' ? qtyOfSheet : qty,
                keyEncoding: transactionType === 'IN' ? keyEncoding : undefined,
                designParty: transactionType === 'IN' ? designParty : undefined,
                store: store || undefined,
                date: txDate || undefined
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

    const openEditTx = (tx) => {
        setEditingTx(tx);
        setEditDate(tx.date ? new Date(tx.date).toISOString().split('T')[0] : '');
        setEditNotes(tx.notes || '');
        setEditDesignParty(tx.designParty || tx.party || '');
        setEditChipLayout(tx.chipLayout || '');
        setEditQtyOfSheet(tx.qtyOfSheet || '');
        setEditKeyEncoding(tx.keyEncoding || '');
        setEditStore(tx.store || '');
    };

    const handleUpdateTx = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/transactions/${editingTx._id}`, {
                date: editDate,
                notes: editNotes,
                designParty: editDesignParty,
                chipLayout: editChipLayout,
                qtyOfSheet: editQtyOfSheet,
                keyEncoding: editKeyEncoding,
                store: editStore
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
                    <button onClick={exportAllToExcel} className="btn bg-[#16a34a] hover:bg-[#15803d] text-white text-sm flex items-center space-x-2 border-none">
                        <Download size={18} /> <span>EXPORT TO EXCEL</span>
                    </button>
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
                            <th className="text-center">Unit Balance</th>
                            <th className="text-center">Office Balance</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-12 text-slate-400">No stock found.</td></tr>
                        ) : filtered.map(product => {
                            const unitBreakdown = product.breakdown ? product.breakdown.filter(b => b.store && b.store.toLowerCase() === 'unit' && b.balance !== 0) : [];
                            const officeBreakdown = product.breakdown ? product.breakdown.filter(b => b.store && b.store.toLowerCase() === 'office' && b.balance !== 0) : [];

                            return (
                                <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="font-bold text-slate-800">{product.name}</td>
                                    <td className="text-center py-3">
                                        <div className="text-xl font-bold text-[#F26622]">
                                            {product.breakdown && product.breakdown.length > 0
                                                ? product.breakdown.reduce((sum, b) => sum + b.balance, 0)
                                                : product.partyBalance} <span className="text-[10px] text-slate-400">TOTAL</span>
                                        </div>
                                    </td>
                                    <td className="text-center py-3">
                                        {unitBreakdown.length > 0 ? (
                                            <div className="flex flex-col items-center gap-1 w-full max-w-[200px] mx-auto">
                                                {unitBreakdown.map((b, i) => (
                                                    <div key={i} className="flex justify-between w-full bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        <span>{b.layout === 'N/A' ? 'NO LAYOUT' : `Layout-${b.layout}`}</span>
                                                        <span className="text-slate-800 ml-3">x{b.layout !== 'N/A' ? b.balance / Number(b.layout) : b.balance} = {b.balance}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <span className="text-slate-300 text-sm">—</span>}
                                    </td>
                                    <td className="text-center py-3">
                                        {officeBreakdown.length > 0 ? (
                                            <div className="flex flex-col items-center gap-1 w-full max-w-[200px] mx-auto">
                                                {officeBreakdown.map((b, i) => (
                                                    <div key={i} className="flex justify-between w-full bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        <span>{b.layout === 'N/A' ? 'NO LAYOUT' : `Layout-${b.layout}`}</span>
                                                        <span className="text-slate-800 ml-3">x{b.layout !== 'N/A' ? b.balance / Number(b.layout) : b.balance} = {b.balance}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <span className="text-slate-300 text-sm">—</span>}
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-2 px-4">
                                            <button onClick={() => { setSelectedProduct(product); setEditName(product.name); setEditModalOpen(true); }} className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteProduct(product._id)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                                                <button onClick={() => viewHistory(product)} className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg" title="History"><History size={16} /></button>
                                            <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center"></div>
                                            <button onClick={() => openModal(product, 'OUT')} className="btn btn-outline text-xs px-4 font-bold">ADD STOCK</button>
                                            <button onClick={() => openModal(product, 'IN')} className="btn btn-secondary text-xs px-4 font-bold">MINUS STOCK</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Transaction Modals */}
            {modalOpen && transactionType === 'OUT' && (
                // ADD STOCK — form with date + store
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ background: '#1e293b', margin: '-1.5rem -1.5rem 1.5rem -1.5rem', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '1rem 1rem 0 0' }}>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>STOCK INTAKE ENTRY</div>
                                <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{selectedProduct?.name}</h4>
                            </div>
                            <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.6rem', padding: '0.4rem', color: 'white', cursor: 'pointer', lineHeight: 0 }}>
                                <X size={18} />
                            </button>
                        </div>
                        {selectedProduct && (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {(selectedProduct.breakdown || []).filter(b => b.balance > 0).map((b, i) => (
                                    <div key={i} style={{ background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 700 }}>
                                        <span style={{ color: '#64748b' }}>Layout-{b.layout} x {b.layout !== 'N/A' ? b.balance / Number(b.layout) : b.balance}</span> = <span style={{ color: '#F26622' }}>{b.balance.toLocaleString()}</span>
                                    </div>
                                ))}
                                {(selectedProduct.breakdown || []).filter(b => b.balance > 0).length === 0 && <span style={{ fontSize: '12px', color: '#cbd5e1' }}>No current stock available</span>}
                            </div>
                        )}
                        <form onSubmit={handleTransaction} className="space-y-4">
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                                    <input
                                        type="date"
                                        value={txDate}
                                        onChange={e => setTxDate(e.target.value)}
                                        className="input-field py-2.5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layout Quantity</label>
                                    <input type="number" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} className="input-field text-xl font-bold py-2.5 text-center" placeholder="0" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chip Layout</label>
                                    <select value={chipLayout} onChange={e => {
                                        const val = e.target.value;
                                        setChipLayout(val);
                                        if (val === '24') setStore('Unit');
                                        else if (val === '10') setStore('Office');
                                    }} className="input-field py-2.5">
                                        <option value="">-- Select --</option>
                                        <option value="24">24</option>
                                        <option value="10">10</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store</label>
                                    {chipLayout === '24' || chipLayout === '10' ? (
                                        <div className="input-field py-2.5 bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed flex items-center">
                                            {chipLayout === '24' ? 'Unit' : (chipLayout === '10' ? 'Office' : '')}
                                        </div>
                                    ) : (
                                        <select value={store} onChange={e => setStore(e.target.value)} className="input-field py-2.5">
                                            <option value="">-- Select Store --</option>
                                            <option value="Office">Office</option>
                                            <option value="Unit">Unit</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            {chipLayout && qty && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total (Qty × Layout)</label>
                                    <div className="text-xl font-black text-[#F26622]">
                                        {(Number(qty) * Number(chipLayout)).toLocaleString()}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field py-2.5" placeholder="Reference..." />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-2 btn btn-primary py-3 font-bold">{saving ? '...' : 'CONFIRM ADD'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalOpen && transactionType === 'IN' && (
                // MINUS STOCK — detailed spreadsheet-style form
                <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2rem', overflowY: 'auto' }}>
                    <div className="modal-content" style={{ maxWidth: '680px', width: '100%', borderRadius: '1.5rem', padding: 0, overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>STOCK DEDUCTION ENTRY</div>
                                <h4 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{selectedProduct?.name}</h4>
                            </div>
                            <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.75rem', padding: '0.5rem', color: 'white', cursor: 'pointer', lineHeight: 0 }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Spreadsheet-style row label bar */}
                        <div style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', padding: '0.5rem 0', textAlign: 'center' }}>
                            {['Date', 'Design / Party', 'Chip Layout', 'Qnty of Sheet', 'Key / Encoding', 'Store'].map(col => (
                                <div key={col} style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 0.5rem' }}>{col}</div>
                            ))}
                        </div>

                        {selectedProduct && (
                            <div style={{ background: '#fef2f2', padding: '1rem 2rem', borderBottom: '1px solid #fee2e2', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#991b1b', textTransform: 'uppercase', alignSelf: 'center', marginRight: '0.5rem' }}>Current Balance:</span>
                                {(selectedProduct.breakdown || []).filter(b => b.balance > 0).map((b, i) => (
                                    <div key={i} style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '11px', fontWeight: 700 }}>
                                        <span style={{ color: '#991b1b' }}>Layout-{b.layout} x {b.layout !== 'N/A' ? b.balance / Number(b.layout) : b.balance}</span> = <span style={{ color: '#ef4444' }}>{b.balance.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleTransaction} style={{ padding: '1.5rem 2rem', background: 'white' }}>
                            {/* Row 1: Date | Design/Party | Chip Layout | Qnty of Sheet | Key/Encoding | Store */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Date</label>
                                    <input
                                        type="date"
                                        value={txDate}
                                        onChange={e => setTxDate(e.target.value)}
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Design / Party</label>
                                    <input
                                        type="text"
                                        value={designParty}
                                        onChange={e => setDesignParty(e.target.value)}
                                        placeholder="Enter design or party..."
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', background: 'white', color: '#1e293b', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Chip Layout</label>
                                    <select
                                        value={chipLayout}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setChipLayout(val);
                                            if (val === '24') setStore('Unit');
                                            else if (val === '10') setStore('Office');
                                        }}
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="24">24</option>
                                        <option value="10">10</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Qnty of Sheet</label>
                                    <input
                                        type="number"
                                        value={qtyOfSheet}
                                        onChange={e => setQtyOfSheet(e.target.value)}
                                        placeholder="0"
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Key / Encoding</label>
                                    <input
                                        type="text"
                                        value={keyEncoding}
                                        onChange={e => setKeyEncoding(e.target.value)}
                                        placeholder="e.g. MIFARE"
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Store</label>
                                    {chipLayout === '24' || chipLayout === '10' ? (
                                        <div style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', boxSizing: 'border-box', height: '36px', display: 'flex', alignItems: 'center' }}>
                                            {chipLayout === '24' ? 'Unit' : 'Office'}
                                        </div>
                                    ) : (
                                        <select
                                            value={store}
                                            onChange={e => setStore(e.target.value)}
                                            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}
                                            required
                                        >
                                            <option value="">-- Select Store --</option>
                                            <option value="Office">Office</option>
                                            <option value="Unit">Unit</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: '#e2e8f0', margin: '1rem 0' }} />

                            {/* Row 2: Cards Qty (auto) | Remarks */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#dc2626', marginBottom: '4px', textTransform: 'uppercase' }}>Used Chips (Layout × Sheets)</label>
                                    <div style={{ border: '2px solid #dc2626', borderRadius: '8px', padding: '8px 6px', fontSize: '22px', fontWeight: 900, textAlign: 'center', color: qty ? '#dc2626' : '#cbd5e1', background: '#fef2f2', boxSizing: 'border-box', minHeight: '44px' }}>
                                        {qty || '—'}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Remarks</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Optional notes..."
                                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '0.875rem', fontWeight: 700, fontSize: '13px', background: '#f1f5f9', border: 'none', borderRadius: '0.75rem', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.875rem', fontWeight: 900, fontSize: '13px', background: saving ? '#94a3b8' : '#F26622', border: 'none', borderRadius: '0.75rem', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    {saving ? 'SAVING...' : 'CONFIRM DEDUCTION'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingTx && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h4 className="text-xl font-bold mb-4">Edit Transaction</h4>
                        <form onSubmit={handleUpdateTx} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400">Date</label>
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="input-field py-2" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">Design / Party</label>
                                <input type="text" value={editDesignParty} onChange={e => setEditDesignParty(e.target.value)} className="input-field py-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Chip Layout</label>
                                    <select value={editChipLayout} onChange={e => {
                                        const val = e.target.value;
                                        setEditChipLayout(val);
                                        if (val === '10') setEditStore('Unit');
                                        else if (val === '24') setEditStore('Office');
                                    }} className="input-field py-2">
                                        <option value="">-- Select --</option>
                                        <option value="24">24</option>
                                        <option value="12">12</option>
                                        <option value="10">10</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Qnty of Sheet</label>
                                    <input type="number" value={editQtyOfSheet} onChange={e => setEditQtyOfSheet(e.target.value)} className="input-field py-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Key / Encoding</label>
                                    <input type="text" value={editKeyEncoding} onChange={e => setEditKeyEncoding(e.target.value)} className="input-field py-2" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Store</label>
                                    {editChipLayout === '10' || editChipLayout === '24' ? (
                                        <div className="input-field py-2 bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed flex items-center">
                                            {editChipLayout === '10' ? 'Unit' : 'Office'}
                                        </div>
                                    ) : (
                                        <select value={editStore} onChange={e => setEditStore(e.target.value)} className="input-field py-2">
                                            <option value="">-- Select --</option>
                                            <option value="Office">Office</option>
                                            <option value="Unit">Unit</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">Remarks</label>
                                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="input-field py-2" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingTx(null)} className="flex-1 font-bold text-slate-400">Cancel</button>
                                <button type="submit" className="flex-2 btn btn-primary py-3 font-bold">SAVE CHANGES</button>
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

            {historyModalOpen && (() => {
                const filteredHistory = history.filter(tx => {
                    const d = new Date(tx.date);
                    if (dateFrom && d < new Date(dateFrom)) return false;
                    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
                    return true;
                });

                // make exportToExcel use filteredHistory via closure
                let totalUnit = 0;
                let totalOffice = 0;
                if (selectedProduct?.breakdown) {
                    selectedProduct.breakdown.forEach(b => {
                        const isUnit = b.store && b.store.toLowerCase() === 'unit';
                        const isOffice = b.store && b.store.toLowerCase() === 'office';
                        const qty = b.balance;
                        if (isUnit) totalUnit += qty;
                        if (isOffice) totalOffice += qty;
                    });
                }
                const totalBalance = selectedProduct?.breakdown && selectedProduct.breakdown.length > 0
                    ? selectedProduct.breakdown.reduce((sum, b) => sum + b.balance, 0)
                    : (selectedProduct?.partyBalance || 0);

                // make exportToExcel use filteredHistory via closure
                const handleExport = () => {
                    // 1. Get all history for this party and sort OLDEST first to calculate running balance
                    const fullHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
                    let runningBal = 0;
                    const historyWithBal = fullHistory.map(tx => {
                        // Formula: Remaining Chip = (Chip Layout × Input Sheet) − Used Chips
                        const chipL = Number(tx.chipLayout || 0);
                        const sheets = Number(tx.qtyOfSheet || 0);
                        const calculatedQty = (chipL > 0 && sheets > 0)
                            ? chipL * sheets
                            : (sheets > 0 ? sheets : (tx.quantity || 0));
                        if (tx.type === 'OUT') runningBal += calculatedQty;  // Chip Stock IN
                        else runningBal -= calculatedQty;                     // Used Chips
                        return { ...tx, runningBalance: runningBal, calculatedQty };
                    });

                    // 2. Filter by date if needed and sort NEWEST first for display
                    const exportData = historyWithBal
                        .filter(tx => {
                            const d = new Date(tx.date);
                            const from = dateFrom ? new Date(dateFrom) : null;
                            const to = dateTo ? new Date(dateTo) : null;
                            if (from && d < from) return false;
                            if (to && d > to) return false;
                            return true;
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date));

                    const rows = exportData.map(tx => ({
                        'Date': new Date(tx.date).toLocaleDateString('en-GB'),
                        'Design / Party': tx.designParty || tx.party || '',
                        'Chip Layout': tx.chipLayout || '',
                        'Qnty of Sheet': tx.qtyOfSheet || '',
                        'Chip Stock IN': tx.type === 'OUT' ? `${tx.chipLayout || 'N/A'} x ${tx.qtyOfSheet || 0} = ${tx.calculatedQty?.toLocaleString() ?? 0}` : '',
                        'Chip Stock OUT': tx.type === 'IN' ? `${tx.chipLayout || 'N/A'} x ${tx.qtyOfSheet || 0} = ${tx.calculatedQty?.toLocaleString() ?? 0}` : '',
                        'Remaining Chip': tx.runningBalance,
                        'Key / Encoding': tx.keyEncoding || '',
                        'Remarks': tx.notes || ''
                    }));

                    rows.push({});
                    rows.push({ 'Date': 'SUMMARY OF CURRENT STOCK' });
                    rows.push({ 'Date': 'UNIT BALANCE', 'Design / Party': totalUnit || 0 });
                    rows.push({ 'Date': 'OFFICE BALANCE', 'Design / Party': totalOffice || 0 });
                    rows.push({ 'Date': 'TOTAL BALANCE', 'Design / Party': totalBalance || 0 });

                    const ws = XLSX.utils.json_to_sheet(rows);
                    ws['!cols'] = [8, 14, 22, 14, 16, 12, 15, 15, 15, 12, 12, 12, 18, 18, 22, 10].map(w => ({ wch: w }));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, selectedProduct?.name?.slice(0, 31) || 'History');
                    const fromLabel = dateFrom || 'all';
                    const toLabel = dateTo || 'all';
                    XLSX.writeFile(wb, `${selectedProduct?.name}_${fromLabel}_to_${toLabel}.xlsx`);
                };

                return (
                    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2rem', overflowY: 'auto' }}>
                        <div style={{ background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '1200px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
                            {/* Header */}
                            <div style={{ background: '#1e293b', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>TRANSACTION LOG</div>
                                    <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{selectedProduct?.name}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>UNIT BAL</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#CBDB3A' }}>{totalUnit.toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>OFFICE BAL</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#CBDB3A' }}>{totalOffice.toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', background: 'rgba(242,102,34,0.1)', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', border: '1px solid rgba(242,102,34,0.2)' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#F26622', textTransform: 'uppercase' }}>TOTAL BAL</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F26622' }}>{totalBalance.toLocaleString()}</div>
                                    </div>
                                    <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.75rem', padding: '0.5rem', color: 'white', cursor: 'pointer', lineHeight: 0, marginLeft: '1rem' }}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={14} style={{ color: '#94a3b8' }} />
                                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', outline: 'none' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>TO</span>
                                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', outline: 'none' }} />
                                </div>
                                <button onClick={handleExport} disabled={filteredHistory.length === 0} style={{ padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                                    <Download size={14} /> EXPORT TO EXCEL
                                </button>
                            </div>

                            {/* History Table */}
                            <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                                            {['Date', 'Design/ Party', 'Chip Layout', 'Qnty of Sheet', 'Chip Stock IN', 'Chip Stock OUT'].map(col => (
                                                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{col}</th>
                                            ))}
                                            <th title="Formula: (Chip Layout × Input Sheet) − Used Chips" style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                Remaining Chip
                                            </th>
                                            {['Key/ Encoding', 'Remarks', 'Actions'].map(col => (
                                                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // Remaining Chip = (Chip Layout × Input Sheet) − Used Chips
                                            const sortedChron = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
                                            let currentRunningBal = 0;
                                            const withBal = sortedChron.map(tx => {
                                                const chipL = Number(tx.chipLayout || 0);
                                                const sheets = Number(tx.qtyOfSheet || 0);
                                                const calculatedQty = (chipL > 0 && sheets > 0)
                                                    ? chipL * sheets
                                                    : (sheets > 0 ? sheets : (tx.quantity || 0));
                                                if (tx.type === 'OUT') currentRunningBal += calculatedQty;  // Chip Stock IN
                                                else currentRunningBal -= calculatedQty;                     // Used Chips
                                                return { ...tx, runningBalance: currentRunningBal, calculatedQty };
                                            });

                                            // Filter and show newest first
                                            return withBal
                                                .filter(tx => {
                                                    const d = new Date(tx.date);
                                                    const from = dateFrom ? new Date(dateFrom) : null;
                                                    const to = dateTo ? new Date(dateTo) : null;
                                                    if (from && d < from) return false;
                                                    if (to && d > to) return false;
                                                    return true;
                                                })
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map((tx, idx) => (
                                                    <tr key={tx._id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                                        <td style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                                                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{tx.designParty || tx.party || '—'}</td>
                                                        <td style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>{tx.chipLayout}</td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{tx.qtyOfSheet}</td>
                                                        <td style={{ padding: '10px 14px', fontWeight: 900, color: '#F26622', textAlign: 'center', background: tx.type === 'OUT' ? '#fff7ed' : 'transparent' }}>
                                                            {tx.type === 'OUT' ? (
                                                                <span title={`${tx.chipLayout} × ${tx.qtyOfSheet} = ${tx.calculatedQty?.toLocaleString()}`}>
                                                                    {tx.calculatedQty?.toLocaleString() ?? '—'}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', fontWeight: 900, color: '#dc2626', textAlign: 'center', background: tx.type === 'IN' ? '#fef2f2' : 'transparent' }}>
                                                            {tx.type === 'IN' ? (
                                                                <span title={`${tx.chipLayout} × ${tx.qtyOfSheet} = ${tx.calculatedQty?.toLocaleString()}`}>
                                                                    {tx.calculatedQty?.toLocaleString() ?? '—'}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', fontWeight: 900, background: tx.runningBalance >= 0 ? '#f0fdf4' : '#fef2f2', textAlign: 'center', fontSize: '14px', color: tx.runningBalance >= 0 ? '#16a34a' : '#dc2626', borderLeft: '2px solid', borderLeftColor: tx.runningBalance >= 0 ? '#bbf7d0' : '#fecaca' }}>
                                                            {tx.runningBalance.toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '10px 14px' }}>{tx.keyEncoding || '—'}</td>
                                                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{tx.notes || '—'}</td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            <button onClick={() => openEditTx(tx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px' }}><Edit2 size={12} /></button>
                                                        </td>
                                                    </tr>
                                                ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                                <button onClick={() => setHistoryModalOpen(false)} style={{ padding: '0.75rem 2rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default PartyInventory;


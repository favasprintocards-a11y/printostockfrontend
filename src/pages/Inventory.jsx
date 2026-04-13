import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Package, 
    Plus, 
    PlusCircle,
    Loader2, 
    Search,
    ShoppingBag,
    History,
    X,
    TrendingUp,
    Box,
    Layers,
    ArrowRightLeft,
    Clock
} from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [qty, setQty] = useState('');
    const [transactionType, setTransactionType] = useState('IN');
    const [history, setHistory] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProductName.trim()) return;
        setSaving(true);
        try {
            await api.post('/api/products', { name: newProductName });
            setNewProductName('');
            setAddModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert('Error adding product: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const openStockModal = (product, type) => {
        setSelectedProduct(product);
        setTransactionType(type);
        setQty('');
        setStockModalOpen(true);
    };

    const handleStockAdjustment = async (e) => {
        e.preventDefault();
        if (!qty || Number(qty) <= 0) return;
        setSaving(true);
        try {
            await api.post('/api/transactions', {
                productId: selectedProduct._id,
                type: transactionType,
                quantity: qty,
                party: 'General'
            });
            setStockModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert('Error updating warehouse: ' + err.message);
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

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-[70vh] items-center justify-center">
            <Loader2 className="animate-spin text-[#F26622] h-12 w-12" />
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Ultra Modern Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                         <div className="w-1.5 h-6 bg-[#CBDB3A] rounded-full"></div>
                         <span className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">Global Infrastructure</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none italic">
                        Warehouse <span className="text-white bg-[#F26622] px-4 py-1 rounded-3xl -rotate-1 inline-block">Stock</span>
                    </h2>
                    <p className="text-slate-500 font-bold max-w-xl text-lg opacity-80 leading-snug">
                        Real-time synchronization of asset quantum and warehouse logistics.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass p-2 bg-white flex items-center group focus-within:scale-[1.02] transition-all duration-300 w-[300px]">
                        <Search className="ml-3 text-slate-200 group-focus-within:text-[#F26622] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Quantum Search..."
                            className="bg-transparent border-none outline-none px-4 py-3 text-sm font-black w-full text-slate-800 placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setAddModalOpen(true)}
                        className="btn-primary flex items-center justify-center !p-4 !rounded-2xl"
                        title="New Asset Configuration"
                    >
                        <PlusCircle size={28} />
                    </button>
                </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass p-8 group hover:border-[#F26622]/20 relative overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 p-8 scale-150 opacity-5 group-hover:opacity-10 group-hover:-rotate-12 transition-all">
                        <Box size={80} />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4">ASSET REGISTRY</div>
                    <div className="text-5xl font-black text-slate-900 flex items-end">
                        {products.length} <span className="text-xs font-black text-[#F26622] ml-4 pb-2">ENTRIES</span>
                    </div>
                </div>
                <div className="glass p-8 group hover:border-[#CBDB3A]/20 relative overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 p-8 scale-150 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all">
                        <Layers size={80} />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4">TOTAL QUANTUM</div>
                    <div className="text-5xl font-black text-slate-900 flex items-end">
                        {products.reduce((acc, p) => acc + (p.totalStock || 0), 0)} <span className="text-xs font-black text-[#CBDB3A] ml-4 pb-2">UNITS</span>
                    </div>
                </div>
                <div className="glass p-8 bg-slate-900 text-white relative overflow-hidden border-none shadow-2xl">
                    <div className="absolute top-0 right-10 p-8 scale-150 opacity-10 rotate-12">
                         <TrendingUp size={80} />
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4 text-white/40">SYSTEM HEALTH</div>
                    <div className="text-2xl font-black text-[#CBDB3A] flex items-center leading-none mt-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></span> OPERATIONAL
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase mt-4 tracking-widest">LIVE SYNC ENABLED</p>
                </div>
            </div>

            {/* Warehouse Matrix View */}
            <div className="desktop-table glass overflow-hidden border-white bg-white shadow-xl">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/70">
                            <th className="px-10 py-6">Asset Descriptor</th>
                            <th className="px-10 py-6 text-center">Warehouse Quantum</th>
                            <th className="px-10 py-6 text-right">Workflow Matrix</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan="3" className="px-10 py-24 text-center text-slate-300 font-black uppercase text-xl italic tracking-tighter opacity-50">Zero Assets detected. Register to begin matrix sync.</td></tr>
                        ) : filtered.map(product => (
                            <tr key={product._id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                <td className="px-10 py-8">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-[#F26622] group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                            <Package size={24} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-800 text-xl block group-hover:text-slate-900 transition-colors uppercase tracking-tight">{product.name}</span>
                                            <span className="text-[10px] font-black text-slate-300 group-hover:text-[#CBDB3A] uppercase tracking-[3px] transition-colors">ID: {product._id.slice(-8)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <div className={`
                                        inline-flex items-center justify-center px-8 py-4 rounded-[2rem] font-black text-3xl border transition-all duration-500
                                        ${product.totalStock > 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-lg shadow-emerald-50' : 
                                          product.totalStock > 0 ? 'bg-orange-50 text-[#F26622] border-orange-100 shadow-lg shadow-orange-50' : 
                                          'bg-rose-50 text-rose-500 border-rose-100 shadow-lg shadow-rose-50'}
                                    `}>
                                        {product.totalStock} <span className="text-[10px] font-black uppercase ml-3 opacity-40">{product.unit || 'uds'}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end items-center gap-3">
                                        <button 
                                            onClick={() => openStockModal(product, 'IN')}
                                            className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 hover:-translate-y-1 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                            title="Warehouse Intake"
                                        >
                                            <Plus size={20} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => openStockModal(product, 'OUT')}
                                            className="p-4 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 hover:-translate-y-1 transition-all shadow-lg shadow-rose-100 active:scale-95"
                                            title="Warehouse Issue"
                                        >
                                            <Plus className="rotate-45" size={20} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => viewHistory(product)}
                                            className="p-4 glass bg-white hover:bg-slate-900 hover:text-white transition-all text-slate-400 rounded-2xl active:scale-95"
                                            title="Matrix History"
                                        >
                                            <History size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Warehouse Card Grid (Mobile) */}
            <div className="mobile-cards">
                {filtered.map(product => (
                    <div key={product._id} className="glass p-8 space-y-6 bg-white border-white shadow-2xl shadow-slate-100 italic relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rotate-45 translate-x-12 -translate-y-12"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <h3 className="font-black text-3xl text-slate-800 tracking-tighter uppercase">{product.name}</h3>
                                <div className="text-[10px] font-black text-[#F26622] uppercase tracking-[3px]">Quantum ID: {product._id.slice(-8)}</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-6 border-y border-slate-50 relative z-10">
                            <div className="text-5xl font-black text-slate-900 leading-none">
                                {product.totalStock} <span className="text-[10px] font-black text-slate-300 uppercase block tracking-widest mt-1">Units available</span>
                            </div>
                            <div className={`p-4 rounded-3xl ${product.totalStock > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                <Box size={32} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 relative z-10 pt-2">
                             <button onClick={() => openStockModal(product, 'IN')} className="py-5 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg active:scale-95"><Plus size={24} strokeWidth={4}/></button>
                             <button onClick={() => openStockModal(product, 'OUT')} className="py-5 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg active:scale-95"><Plus size={24} strokeWidth={4} className="rotate-45"/></button>
                             <button onClick={() => viewHistory(product)} className="py-5 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-lg active:scale-95"><History size={24} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Asset Configuration Modal (Add Product) */}
            {addModalOpen && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 duration-500">
                        <div className="h-4 w-full bg-slate-900" />
                        <div className="p-12 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                     <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">Asset <span className="text-[#CBDB3A]">Config</span></h3>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registering unique entry point</p>
                                </div>
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-[#F26622] animate-bounce-slow">
                                     <PlusCircle size={32} strokeWidth={3} />
                                </div>
                            </div>
                            <form onSubmit={handleAddProduct} className="space-y-8">
                                <div className="space-y-4">
                                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] px-2">DESCRIPTOR NAME</label>
                                     <input 
                                        type="text" 
                                        autoFocus
                                        className="w-full text-3xl font-black p-8 bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-slate-900/5 outline-none rounded-[2.5rem] tracking-tighter placeholder:text-slate-200"
                                        placeholder="e.g. ULTRA GLOSS PVC"
                                        value={newProductName}
                                        onChange={(e) => setNewProductName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setAddModalOpen(false)} type="button" className="py-6 font-black text-slate-400 uppercase tracking-widest text-[11px] rounded-[2rem] hover:bg-slate-50 transition-colors">Abort</button>
                                    <button type="submit" disabled={saving} className="py-6 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-[2rem] shadow-2xl active:scale-95 transition-all">
                                        {saving ? 'CONFIGURING...' : 'INITIALIZE ASSET'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Quantum Modal (Add/Subtract Stock) */}
            {stockModalOpen && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] w-full max-w-sm overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 duration-500">
                        <div className={`h-4 w-full ${transactionType === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="p-10 space-y-8 text-center">
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-[4px]">{transactionType} FLOW</h4>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{selectedProduct?.name}</p>
                            </div>
                            <form onSubmit={handleStockAdjustment} className="space-y-8">
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full text-7xl font-black text-center p-8 bg-slate-50 border-none ring-1 ring-slate-100 rounded-[3rem] tracking-tighter"
                                    placeholder="00"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setStockModalOpen(false)} className="flex-1 font-black text-slate-300 text-[11px] uppercase tracking-widest">CANCEL</button>
                                    <button type="submit" className={`flex-2 py-6 rounded-[2rem] font-black text-white text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${transactionType === 'IN' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
                                        {saving ? '...' : `LOG ${transactionType}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Quantum Log Modal (History) */}
            {historyModalOpen && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-white/95 rounded-[4rem] w-full max-w-3xl h-[85vh] flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150"><Clock size={100} /></div>
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-4xl font-black italic tracking-tighter">{selectedProduct?.name} <span className="text-[#CBDB3A]">Archival Matrix</span></h3>
                                <div className="flex items-center space-x-3 text-[10px] font-black text-white/40 uppercase tracking-[4px]">
                                     <ArrowRightLeft size={14} /> <span>Transaction Sequential Log</span>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} className="relative z-10 p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-[1.5rem] transition-all">
                                <X size={28} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-4 no-scrollbar bg-slate-50/50">
                            {history.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-200 font-black flex-col italic uppercase tracking-tighter">
                                    <Clock size={80} className="mb-6 opacity-5" />
                                    No archive entries detected.
                                </div>
                            ) : history.map((tx) => (
                                <div key={tx._id} className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] hover:shadow-xl transition-all border border-slate-100 group">
                                    <div className="flex items-center space-x-6">
                                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:scale-105 ${tx.type === 'OUT' ? 'bg-[#F26622] text-white rotate-2' : 'bg-[#CBDB3A] text-slate-800 -rotate-2'}`}>
                                            {tx.type === 'OUT' ? <Plus className="rotate-45" size={24} /> : <Plus size={24} />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-black text-slate-800 text-lg uppercase tracking-tight">
                                                {tx.type === 'IN' ? 'Warehouse Inbound' : 'Warehouse Outbound'} 
                                            </div>
                                            <div className="flex items-center gap-3">
                                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</span>
                                                 <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                 <span className="text-[10px] font-black text-[#F26622] uppercase tracking-widest">Party: {tx.party || 'Global'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-5xl font-black ${tx.type === 'OUT' ? 'text-rose-500' : 'text-emerald-500'} tracking-tighter`}>
                                        {tx.type === 'OUT' ? '-' : '+'}{tx.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;

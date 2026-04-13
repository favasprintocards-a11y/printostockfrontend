import React, { useState } from 'react';
import { Menu, X, UserCheck, Package, LayoutDashboard } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Parties', path: '/', icon: <UserCheck size={20} /> },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/10 z-[100] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 z-[101] bg-white border-r border-slate-200 transition-all
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                md:sticky md:top-0 md:h-screen md:flex flex-col
            `}>
                <div className="p-6">
                    <Link to="/" className="flex items-center space-x-2">
                       <div className="w-8 h-8 rounded-lg bg-[#F26622] flex items-center justify-center text-white">
                         <Package size={20} />
                       </div>
                       <h2 className="text-xl font-bold text-slate-800 tracking-tight">Printo Stock</h2>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${isActive ? 'bg-slate-100 text-[#F26622]' : 'text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100 italic text-[10px] text-slate-400 font-medium">
                    STOCK MGT v1.2.0
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col bg-[#fcfcfc]">
                <header className="h-16 flex items-center px-6 border-b border-slate-200 bg-white md:justify-end">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                    <div className="hidden sm:flex items-center space-x-3">
                         <span className="text-sm font-bold text-slate-700">Admin Account</span>
                         <div className="w-8 h-8 rounded-lg bg-[#CBDB3A] flex items-center justify-center font-bold text-xs">AD</div>
                    </div>
                </header>

                <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Search, 
  X, 
  FileText, 
  MapPin, 
  RefreshCw,
  LogOut,
  Sliders,
  Award,
  Eye,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Deal, User as UserType } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  activeUser: UserType | null;
  onLogout: () => void;
  viewMode: 'crm' | 'admin';
  setViewMode: (mode: 'crm' | 'admin') => void;
  onSelectDeal: (deal: Deal | null) => void;
  allDeals: Deal[];
  onRefreshDeals: () => Promise<void> | void;
}

// Compact deterministic gradient avatar generator
const UserAvatar = ({ name }: { name: string }) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';
  const gradients = [
    'from-blue-500 to-cyan-400 text-slate-950',
    'from-emerald-500 to-teal-400 text-slate-950',
    'from-violet-500 to-purple-400 text-white',
    'from-amber-500 to-orange-400 text-slate-950',
    'from-rose-500 to-pink-500 text-white',
    'from-[#58cca8] to-blue-400 text-slate-950'
  ];
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const selectedGradient = gradients[charCodeSum % gradients.length];
  
  return (
    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${selectedGradient} flex items-center justify-center font-black text-xs shadow-md shadow-black/20 border border-white/5 select-none shrink-0 font-mono`}>
      {firstLetter}
    </div>
  );
};

export default function AdminDashboard({
  activeUser,
  onLogout,
  viewMode,
  setViewMode,
  onSelectDeal,
  allDeals,
  onRefreshDeals
}: Props) {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Fetch all users and their metrics
  const fetchAdminUsers = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/admin/users?user_id=${activeUser.id}`);
      setAdminUsers(data);
      
      // If a user was selected, update their details in-place
      if (selectedUser) {
        const updated = data.find((u: any) => u.id === selectedUser.id);
        if (updated) {
          setSelectedUser(updated);
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, [activeUser, allDeals]);

  // Update deal status directly from admin view
  const handleDealStatusChange = async (dealId: number, nextStatus: string) => {
    try {
      await axios.put(`${BACKEND_URL}/deals/${dealId}/status`, { status: nextStatus });
      await onRefreshDeals();
      await fetchAdminUsers();
    } catch (err) {
      console.error('Failed to update deal status', err);
    }
  };

  // Format money helper
  const formatMoney = (amount: number | undefined) => {
    if (amount === undefined) return '0 Kč';
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);
  };

  // Calculate platform totals
  const totalPlatformUsers = adminUsers.length;
  const totalDealsCount = adminUsers.reduce((sum, u) => sum + (u.deal_count || 0), 0);
  const totalDealsValue = adminUsers.reduce((sum, u) => sum + (u.total_deal_value || 0), 0);
  const totalCommissionsValue = adminUsers.reduce((sum, u) => sum + (u.total_commission || 0), 0);

  // Recharts Chart Data
  const chartData = adminUsers
    .filter(u => u.deal_count > 0)
    .map(u => ({
      name: u.username,
      'Obrát': Math.round((u.total_deal_value || 0) / 1000), // in thousands
      'Provize': u.total_commission || 0
    }));

  // Filtering users
  const filteredUsers = adminUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.partner_name && u.partner_name.toLowerCase().includes(q)) ||
      u.tier.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#060b18] flex flex-col text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Background neon elements & Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#58cca8]/5 blur-[130px] pointer-events-none" />

      {/* Grid Overlay background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-45" />

      {/* 1. TOP HEADER BAR */}
      <header className="px-8 py-3 bg-slate-955/80 border-b border-slate-900/60 flex justify-between items-center relative z-10 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-7 w-auto filter brightness-0 invert" />
          <div className="h-6 w-[1px] bg-slate-800 mx-2" />
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#58cca8] animate-pulse" /> B2B Administrační Hub
            </h1>
            <span className="text-[10px] text-treetino-light font-bold uppercase tracking-widest font-mono">Platform Management</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <div className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Award className="w-3.5 h-3.5 text-rose-450 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono text-slate-500 uppercase leading-none">Administrátor</span>
              <span className="text-xs font-bold text-white leading-tight mt-0.5">{activeUser?.username}</span>
            </div>
          </div>

          <button
            onClick={() => setViewMode('crm')}
            className="bg-gradient-to-r from-blue-600 to-[#3ec19b] hover:from-blue-500 hover:to-[#58cca8] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(88,204,168,0.1)] hover:-translate-y-0.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Klientská Sekce (CRM)
          </button>

          <button
            onClick={onLogout}
            title="Odhlásit se"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-400 hover:text-rose-450 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. VIEWPORT-FITTED MAIN CONTENT */}
      <div className="flex-1 p-6 flex flex-col gap-5 overflow-hidden relative z-10 max-w-7xl mx-auto w-full">
        
        {/* A. KPI overview cards (Horizontal layout at top, takes up minimal vertical space) */}
        <section className="grid grid-cols-4 gap-4 shrink-0">
          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex items-center justify-between shadow-lg backdrop-blur-md">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">B2B Partneři</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">{totalPlatformUsers}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-450">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex items-center justify-between shadow-lg backdrop-blur-md">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Celkem Obchodů</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">{totalDealsCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-450">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex items-center justify-between shadow-lg backdrop-blur-md">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Obrát Pipeline</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">{formatMoney(totalDealsValue)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-[#58cca8]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex items-center justify-between shadow-lg backdrop-blur-md">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Provize Celkem</span>
              <div className="text-xl font-bold text-treetino-light font-mono mt-0.5">{formatMoney(totalCommissionsValue)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-450">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* B. Split content section (Spreadsheet list on left, performance chart on right) */}
        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden min-h-0">
          
          {/* Left: User spreadsheet table container (flex column, table scrolls internally) */}
          <section className="col-span-2 flex flex-col bg-slate-900/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Table Action Bar */}
            <div className="px-5 py-3.5 border-b border-slate-900 bg-slate-950/40 flex justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-treetino-light rounded-sm inline-block" />
                <h2 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                  Správa Sales Teamu
                </h2>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Vyhledat prodejce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 text-xs rounded-xl py-1.5 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Flat Table Layout with custom vertical scroll */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Activity className="w-6 h-6 text-treetino-light animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/60 bg-slate-950/20 text-slate-450 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                      <th className="py-3 px-5">Uživatelské jméno</th>
                      <th className="py-3 px-5">Tier</th>
                      <th className="py-3 px-5">Organizace</th>
                      <th className="py-3 px-5 text-center">Obchody</th>
                      <th className="py-3 px-5 text-right">Celkový Obrát</th>
                      <th className="py-3 px-5 text-right">Provize</th>
                      <th className="py-3 px-5 text-center">Smlouvy</th>
                      <th className="py-3 px-5 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/80 font-mono">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500 font-sans italic">
                          Žádné shody nenalezeny.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const getTierStyles = (tier: string, isSuper: number) => {
                          if (isSuper) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          if (tier === 'Platinum') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                          if (tier === 'Gold') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          return 'bg-slate-500/10 text-slate-400 border-slate-700';
                        };

                        return (
                          <tr 
                            key={u.id} 
                            className="hover:bg-slate-900/40 border-l border-l-transparent hover:border-l-treetino-light transition-all"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={u.username} />
                                <span className="font-sans font-bold text-white">{u.username}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getTierStyles(u.tier, u.is_superadmin)}`}>
                                {u.is_superadmin ? 'ADMIN' : u.tier.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-sans text-slate-350">{u.partner_name || 'Nezávislý Partner'}</td>
                            <td className="py-3.5 px-5 text-center text-white font-bold">{u.deal_count}</td>
                            <td className="py-3.5 px-5 text-right text-white font-semibold">{formatMoney(u.total_deal_value)}</td>
                            <td className="py-3.5 px-5 text-right text-treetino-light font-semibold">{formatMoney(u.total_commission)}</td>
                            <td className="py-3.5 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {u.nda_signed ? (
                                  <span className="text-[8px] text-emerald-450 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md select-none" title={`NDA podepsáno: ${u.nda_signed_at}`}>
                                    NDA ✓
                                  </span>
                                ) : (
                                  <span className="text-[8px] text-rose-450 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md select-none">
                                    NDA ✗
                                  </span>
                                )}

                                {u.mediation_signed ? (
                                  <span className="text-[8px] text-emerald-450 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md select-none" title={`Smlouva podepsána: ${u.mediation_signed_at}`}>
                                    Smlouva ✓
                                  </span>
                                ) : (
                                  <span className="text-[8px] text-rose-450 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md select-none">
                                    Smlouva ✗
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="text-treetino-light hover:text-[#58cca8] hover:underline font-sans font-bold text-xs transition-colors pr-2"
                              >
                                Zobrazit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Right: Compact stats chart panel (fits perfectly alongside left table) */}
          <section className="col-span-1 flex flex-col bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 shadow-2xl gap-4">
            <div className="shrink-0">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">// Prodejní Výkonnost</h3>
              <span className="text-[8px] text-slate-500 block">Distribuce provizí (Kč) dle prodejců</span>
            </div>

            {chartData.length > 0 ? (
              <div className="flex-1 min-h-0 min-w-0 select-none relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#58cca8" stopOpacity={0.95}/>
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.25}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/20" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} width={30} />
                    <Tooltip 
                      contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }} 
                      labelStyle={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }} 
                      itemStyle={{ fontSize: '9px' }}
                    />
                    <Bar dataKey="Provize" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 italic text-xs">
                Žádná data pro graf.
              </div>
            )}
          </section>

        </div>

      </div>

      {/* 4. EXPANDED SALESPERSON DETAIL DRAWERS MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl relative"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedUser.username} />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-white">{selectedUser.username}</h2>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                        selectedUser.is_superadmin ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        selectedUser.tier === 'Platinum' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        selectedUser.tier === 'Gold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-700'
                      }`}>
                        {selectedUser.is_superadmin ? 'SUPERADMIN' : selectedUser.tier}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-sans mt-1">
                      {selectedUser.partner_name || 'Nezávislý Partner'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body (Scrollable list of salesperson deals) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Aggregate details summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-2xl text-center shadow-sm">
                    <span className="text-[8px] text-slate-500 uppercase font-semibold font-sans">Počet Nabídek</span>
                    <div className="text-base font-bold text-white font-mono mt-0.5">{selectedUser.deal_count}</div>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-2xl text-center shadow-sm">
                    <span className="text-[8px] text-slate-500 uppercase font-semibold font-sans">Celkový Obrat</span>
                    <div className="text-[11px] font-bold text-white font-mono mt-1 leading-tight">{formatMoney(selectedUser.total_deal_value)}</div>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-2xl text-center shadow-sm">
                    <span className="text-[8px] text-slate-500 uppercase font-semibold font-sans">Provize</span>
                    <div className="text-[11px] font-bold text-treetino-light font-mono mt-1 leading-tight">{formatMoney(selectedUser.total_commission)}</div>
                  </div>
                </div>

                {/* NDA Signature Details */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Dohoda o Mlčenlivosti (NDA)</span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                      selectedUser.nda_signed 
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                    }`}>
                      {selectedUser.nda_signed ? 'PODEPSÁNO' : 'NEPODEPSÁNO'}
                    </span>
                  </div>
                  
                  {selectedUser.nda_signed ? (
                    <div className="text-[11px] space-y-3 font-mono text-slate-300 bg-slate-950/30 p-3.5 rounded-2xl border border-slate-900/60">
                      <div className="grid grid-cols-2 gap-2 text-[10px] pb-2 border-b border-slate-900">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Firma / Jméno</span>
                          <span className="text-white font-bold">{selectedUser.nda_company || 'Neuvedeno'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">IČO / Datum nar.</span>
                          <span className="text-white font-bold">{selectedUser.nda_ico_dob || 'Neuvedeno'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Sídlo / Bydliště</span>
                          <span className="text-white font-bold">{selectedUser.nda_address || 'Neuvedeno'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Jednající osoba</span>
                          <span className="text-white font-bold">{selectedUser.nda_representative || 'Neuvedeno'}</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px]">
                        Podepsáno dne: <strong className="text-white">{selectedUser.nda_signed_at || 'Neuvedeno'}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-2 border border-slate-850 rounded-xl bg-slate-950/40 text-center">
                          <span className="text-[7px] text-slate-500 uppercase font-mono block">Za Treetino corp s.r.o.</span>
                          <span className="text-[8px] text-slate-450 font-mono block mt-0.5">V Praze dne: {selectedUser.nda_signed_at ? new Date(selectedUser.nda_signed_at).toLocaleDateString('cs-CZ') : 'Neuvedeno'}</span>
                          <div className="h-10 flex items-center justify-center mt-1">
                            <img src="/branding/signature_masek_2.png" alt="Dominik Masek Signature" className="h-8 object-contain filter invert opacity-80 pointer-events-none" />
                          </div>
                        </div>

                        <div className="p-2 border border-slate-850 rounded-xl bg-slate-950/40 text-center">
                          <span className="text-[7px] text-slate-500 uppercase font-mono block">Za Partnera (Podpis)</span>
                          <span className="text-[8px] text-slate-450 font-mono block mt-0.5">V {selectedUser.nda_location || '__________'} dne: {selectedUser.nda_signed_at ? new Date(selectedUser.nda_signed_at).toLocaleDateString('cs-CZ') : 'Neuvedeno'}</span>
                          <div className="h-10 flex items-center justify-center mt-1 text-treetino-light">
                            {selectedUser.nda_signature ? (
                              <div 
                                className="w-full h-full max-h-8 flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: selectedUser.nda_signature }} 
                              />
                            ) : (
                              <span className="text-[9px] text-slate-600 italic">Podpis chybí</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-2 text-center font-sans">
                        <span className="text-[9px] text-slate-500">
                          Kryptografický otisk podpisu ověřen a zanesen do archivu.
                        </span>
                        <div className="flex justify-center mt-1">
                          <a
                            href={`${BACKEND_URL}/users/${selectedUser.id}/nda/download`}
                            download={`NDA_Treetino_${selectedUser.username}.pdf`}
                            className="bg-treetino-light/10 hover:bg-treetino-light/20 text-treetino-light border border-treetino-light/20 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            Stáhnout podepsanou dohodu (PDF)
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Partner dosud nepodepsal dohodu o mlčenlivosti (NDA). Přístup k exportům a klientským detailům bude zablokován, dokud dohodu nepotvrdí.
                    </p>
                  )}
                </div>

                {/* Mediation Signature Details */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Smlouva o Zprostředkování</span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                      selectedUser.mediation_signed 
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                    }`}>
                      {selectedUser.mediation_signed ? 'PODEPSÁNO' : 'NEPODEPSÁNO'}
                    </span>
                  </div>
                  
                  {selectedUser.mediation_signed ? (
                    <div className="text-[11px] space-y-3 font-mono text-slate-300 bg-slate-950/30 p-3.5 rounded-2xl border border-slate-900/60">
                      <div className="grid grid-cols-2 gap-2 text-[10px] pb-2 border-b border-slate-900">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Firma / Jméno</span>
                          <span className="text-white font-bold">{selectedUser.mediation_company || 'Neuvedeno'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">IČO / Datum nar.</span>
                          <span className="text-white font-bold">{selectedUser.mediation_ico_dob || 'Neuvedeno'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Sídlo / Bydliště</span>
                          <span className="text-white font-bold">{selectedUser.mediation_address || 'Neuvedeno'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Zástupce</span>
                          <span className="text-white font-bold">{selectedUser.mediation_representative || 'Neuvedeno'}</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px]">
                        Podepsáno dne: <strong className="text-white">{selectedUser.mediation_signed_at || 'Neuvedeno'}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-2 border border-slate-850 rounded-xl bg-slate-950/40 text-center">
                          <span className="text-[7px] text-slate-500 uppercase font-mono block">Za Treetino corp s.r.o.</span>
                          <span className="text-[8px] text-slate-450 font-mono block mt-0.5">V Praze dne: {selectedUser.mediation_signed_at ? new Date(selectedUser.mediation_signed_at).toLocaleDateString('cs-CZ') : 'Neuvedeno'}</span>
                          <div className="h-10 flex items-center justify-center mt-1">
                            <img src="/branding/signature_masek_2.png" alt="Dominik Masek Signature" className="h-8 object-contain filter invert opacity-80 pointer-events-none" />
                          </div>
                        </div>

                        <div className="p-2 border border-slate-850 rounded-xl bg-slate-950/40 text-center">
                          <span className="text-[7px] text-slate-500 uppercase font-mono block">Za Zprostředkovatele</span>
                          <span className="text-[8px] text-slate-450 font-mono block mt-0.5">V {selectedUser.mediation_location || '__________'} dne: {selectedUser.mediation_signed_at ? new Date(selectedUser.mediation_signed_at).toLocaleDateString('cs-CZ') : 'Neuvedeno'}</span>
                          <div className="h-10 flex items-center justify-center mt-1 text-treetino-light">
                            {selectedUser.mediation_signature ? (
                              <div 
                                className="w-full h-full max-h-8 flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: selectedUser.mediation_signature }} 
                              />
                            ) : (
                              <span className="text-[9px] text-slate-600 italic">Podpis chybí</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-2 flex flex-col gap-2 text-center font-sans">
                        <span className="text-[9px] text-slate-500">
                          Kryptografický otisk podpisu ověřen a zanesen do archivu.
                        </span>
                        <div className="flex justify-center mt-1">
                          <a
                            href={`${BACKEND_URL}/users/${selectedUser.id}/mediation/download`}
                            download={`Smlouva_Zprostredkovani_Treetino_${selectedUser.username}.pdf`}
                            className="bg-treetino-light/10 hover:bg-treetino-light/20 text-treetino-light border border-treetino-light/20 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            Stáhnout podepsanou smlouvu (PDF)
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Partner dosud nepodepsal smlouvu o zprostředkování. Přístup k exportům a klientským detailům bude zablokován, dokud dohodu nepotvrdí.
                    </p>
                  )}
                </div>

                {/* Deal List */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                    Obchody Prodejce ({selectedUser.deals.length})
                  </h3>

                  {selectedUser.deals.length === 0 ? (
                    <div className="text-center py-12 text-slate-650 italic text-xs font-sans">
                      Tento partner dosud nevytvořil žádné nabídky.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.deals.map((deal: any) => {
                        const statusColors = {
                          Won: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                          Rejected: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
                          Lost: 'text-slate-400 border-slate-700 bg-slate-800/10',
                          Prepared: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
                          'In Progress': 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
                          Stuck: 'text-orange-400 border-orange-500/20 bg-orange-500/5'
                        };

                        // Find config if populated in parent deals prop
                        const parentDeal = allDeals.find(d => d.id === deal.id);
                        const hasConfig = !!parentDeal?.config;
                        const totalPrice = parentDeal?.config?.total_price;
                        const commForecast = parentDeal?.config?.commission_forecast;

                        return (
                          <div 
                            key={deal.id}
                            className="p-4 bg-slate-950/45 border border-slate-850 rounded-2xl flex flex-col gap-3 group transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-xs text-white leading-tight">{deal.client_name}</h4>
                                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                                  ID: #{deal.id} • Vytvořeno: {new Date(deal.created_at).toLocaleDateString('cs-CZ')}
                                </span>
                              </div>
                              
                              <select
                                value={deal.status}
                                onChange={(e) => handleDealStatusChange(deal.id, e.target.value)}
                                className="text-[9px] font-bold py-1 px-2.5 rounded-full bg-slate-950 border border-slate-700 cursor-pointer focus:outline-none text-slate-200"
                              >
                                <option value="Prepared">Příprava</option>
                                <option value="In Progress">V jednání</option>
                                <option value="Stuck">Zaseknuto</option>
                                <option value="Rejected">Zamítnuto</option>
                                <option value="Won">Vyhráno</option>
                                <option value="Lost">Prohráno</option>
                              </select>
                            </div>

                            {/* Aggregated values from parent deals if available */}
                            {hasConfig && (
                              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-900 font-mono">
                                <div>
                                  <span className="text-slate-500 block">Cena Nabídky</span>
                                  <span className="text-white font-bold">{formatMoney(totalPrice)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Provize Partnera</span>
                                  <span className="text-treetino-light font-bold">{formatMoney(commForecast)}</span>
                                </div>
                              </div>
                            )}

                            {/* Actions (Load to map / Download PDF) */}
                            <div className="flex items-center justify-between border-t border-slate-900 pt-2.5 mt-0.5">
                              {parentDeal?.pdf_path ? (
                                <a 
                                  href={`${BACKEND_URL}${parentDeal.pdf_path}`} 
                                  download
                                  className="text-[9px] text-treetino-light hover:underline font-bold flex items-center gap-1 font-sans"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Stáhnout Nabídku
                                </a>
                              ) : (
                                <span className="text-[9px] text-slate-650 italic font-sans font-medium">Bez PDF dokumentu</span>
                              )}

                              <button
                                onClick={() => {
                                  if (parentDeal) {
                                    onSelectDeal(parentDeal);
                                    setViewMode('crm');
                                    setSelectedUser(null);
                                  }
                                }}
                                className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 font-sans"
                              >
                                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                Načíst na mapu
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

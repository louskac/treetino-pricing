import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, User, ArrowRight, Loader2, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import type { Partner, User as UserType } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  onLogin: (user: UserType, rememberMe: boolean) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // Credentials States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [tier, setTier] = useState<'Silver' | 'Gold' | 'Platinum'>('Silver');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingPartners, setFetchingPartners] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch partners for registration select dropdown
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await axios.get<Partner[]>(`${BACKEND_URL}/partners`);
        setPartners(data);
        if (data.length > 0) {
          setSelectedPartnerId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load partners', err);
      } finally {
        setFetchingPartners(false);
      }
    };
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vyplňte prosím uživatelské jméno a heslo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // 1. Register
        await axios.post(`${BACKEND_URL}/register`, {
          username: username.trim(),
          password: password.trim(),
          tier,
          partner_id: selectedPartnerId ? Number(selectedPartnerId) : null
        });
      }

      // 2. Authenticate
      const { data } = await axios.post<UserType>(`${BACKEND_URL}/login`, {
        username: username.trim(),
        password: password.trim()
      });

      onLogin(data, rememberMe);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Přihlášení nebo registrace selhala. Zkontrolujte prosím údaje.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 backdrop-blur-sm overflow-hidden">
      
      {/* Immersive Cyberpunk HUD Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
        
        {/* Vignette Tech Shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
        
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#58cca8]/5 blur-[150px]" />
        
        {/* Dynamic Vertical Console Ruler */}
        <div className="absolute right-8 top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-slate-800/20 to-transparent flex flex-col justify-between items-center text-[7px] font-mono text-slate-700 tracking-widest select-none">
          <span className="transform rotate-90 translate-x-2">SYS_01</span>
          <span className="transform rotate-90 translate-x-2">SYS_02</span>
          <span className="transform rotate-90 translate-x-2">SYS_03</span>
        </div>

        {/* Left Treetino Schematic HUD (Abstract Energy Tree) */}
        <div className="absolute top-1/2 left-[4%] xl:left-[10%] -translate-y-1/2 w-[480px] h-[480px] opacity-[0.07] text-blue-500 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.2)] select-none">
          <svg viewBox="0 0 400 400" width="100%" height="100%">
            <g stroke="currentColor" strokeWidth="1.2" fill="none">
              {/* Central Trunk */}
              <line x1="200" y1="350" x2="200" y2="120" />
              <line x1="200" y1="350" x2="200" y2="385" strokeDasharray="3,3" />
              
              {/* Branching structures */}
              <path d="M 200 290 L 150 240 L 110 240" />
              <path d="M 200 290 L 250 240 L 290 240" />
              <path d="M 200 230 L 140 170 L 90 170" />
              <path d="M 200 230 L 260 170 L 310 170" />
              <path d="M 200 170 L 160 130" />
              <path d="M 200 170 L 240 130" />
              
              {/* Solar Panels / Concentric Circles */}
              <circle cx="200" cy="200" r="160" strokeDasharray="6,4" />
              <circle cx="200" cy="200" r="115" strokeDasharray="3,3" />
              <circle cx="200" cy="200" r="70" />
              
              {/* Tech Ring Markings */}
              <circle cx="200" cy="200" r="185" strokeWidth="0.5" opacity="0.3" />
              
              {/* Grid Angle lines */}
              <line x1="200" y1="15" x2="200" y2="385" strokeDasharray="2,8" opacity="0.5" />
              <line x1="15" y1="200" x2="385" y2="200" strokeDasharray="2,8" opacity="0.5" />
              
              {/* Energy Node Indicators */}
              <circle cx="110" cy="240" r="3" fill="currentColor" />
              <circle cx="290" cy="240" r="3" fill="currentColor" />
              <circle cx="90" cy="170" r="3" fill="currentColor" />
              <circle cx="310" cy="170" r="3" fill="currentColor" />
              <circle cx="160" cy="130" r="3" fill="currentColor" />
              <circle cx="240" cy="130" r="3" fill="currentColor" />
            </g>
            
            {/* Tech HUD text labels */}
            <text x="215" y="60" fill="currentColor" fontSize="7" fontFamily="monospace" letterSpacing="1" opacity="0.6">TREETINO_CORP // SYS_V2</text>
            <text x="215" y="70" fill="currentColor" fontSize="5" fontFamily="monospace" letterSpacing="0.5" opacity="0.4">LAT_VAR // LON_VAR</text>
            <text x="90" y="340" fill="currentColor" fontSize="6" fontFamily="monospace" letterSpacing="0.5" opacity="0.4">SOLAR_LEAF_COUNT: 300</text>
          </svg>
        </div>

        {/* Right Treetino Schematic HUD (Abstract Wind Turbine / Grid) */}
        <div className="absolute top-1/2 right-[4%] xl:right-[10%] -translate-y-1/2 w-[480px] h-[480px] opacity-[0.07] text-[#58cca8] filter drop-shadow-[0_0_10px_rgba(88,204,168,0.2)] select-none">
          <svg viewBox="0 0 400 400" width="100%" height="100%">
            <g stroke="currentColor" strokeWidth="1.2" fill="none">
              {/* Central Turbine Mast */}
              <line x1="200" y1="350" x2="200" y2="180" />
              <line x1="200" y1="350" x2="200" y2="385" strokeDasharray="3,3" />
              
              {/* Hub */}
              <circle cx="200" cy="180" r="14" />
              <circle cx="200" cy="180" r="4" fill="currentColor" />
              
              {/* Turbine Blades */}
              <path d="M 200 166 Q 235 110 200 50 T 170 10" />
              <path d="M 212 188 Q 272 200 320 160 T 360 140" opacity="0.8" />
              <path d="M 188 188 Q 128 230 110 290 T 70 320" opacity="0.8" />
              
              {/* Surrounding tech circles */}
              <circle cx="200" cy="180" r="150" strokeDasharray="4,6" />
              <circle cx="200" cy="180" r="90" strokeDasharray="8,8" />
              <circle cx="200" cy="180" r="50" />
              
              {/* Grid Angle lines */}
              <line x1="200" y1="15" x2="200" y2="385" strokeDasharray="2,8" opacity="0.5" />
              <line x1="15" y1="200" x2="385" y2="200" strokeDasharray="2,8" opacity="0.5" />
              
              {/* Energy Node Indicators */}
              <circle cx="200" cy="50" r="3" fill="currentColor" />
              <circle cx="320" cy="160" r="3" fill="currentColor" />
              <circle cx="110" cy="290" r="3" fill="currentColor" />
            </g>
            
            {/* Tech HUD text labels */}
            <text x="220" y="80" fill="currentColor" fontSize="7" fontFamily="monospace" letterSpacing="1" opacity="0.6">TURBINE_GEN // T1_HYBRID</text>
            <text x="220" y="90" fill="currentColor" fontSize="5" fontFamily="monospace" opacity="0.4">WIND_SPEED_EST: 7.2 M/S</text>
            <text x="60" y="340" fill="currentColor" fontSize="6" fontFamily="monospace" letterSpacing="0.5" opacity="0.4">GRID_FEED // ONLINE</text>
          </svg>
        </div>
      </div>

      {/* Login Screen Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-10"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />

        <div className="flex flex-col items-center text-center gap-2 mb-8 mt-2">
          <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-9 w-auto filter brightness-0 invert mb-3" />
          <h1 className="text-2xl font-bold text-white tracking-wide">B2B Partner Portál</h1>
          <p className="text-slate-400 text-xs tracking-wider uppercase">
            {isRegistering ? 'Vytvoření nového prodejního účtu' : 'Vstup do prodejního a provizního systému'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-xs bg-rose-500/15 border border-rose-500/30 text-rose-400 p-3.5 rounded-2xl text-center">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Uživatelské Jméno
            </label>
            <input
              type="text"
              placeholder="Např. jakub.lustyk"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-750 text-sm rounded-2xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Heslo
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-750 text-sm rounded-2xl py-3.5 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1 rounded-xl text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/50 focus:ring-offset-slate-900 focus:outline-none accent-blue-500 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-xs text-slate-400 select-none cursor-pointer hover:text-slate-300 transition-colors">
              Zapamatovat si mě
            </label>
          </div>

          {/* Register Mode Inputs */}
          {isRegistering && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-5 overflow-hidden"
            >
              {/* Tier Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Výkonnostní Třída (Tier)
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full bg-slate-800/80 border border-slate-750 text-sm rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Silver">Silver (5% provize, 10% max sleva)</option>
                  <option value="Gold">Gold (8% provize, 20% max sleva)</option>
                  <option value="Platinum">Platinum (12% provize, 30% max sleva)</option>
                </select>
              </div>

              {/* Partner Dropdown Selection */}
              {!fetchingPartners && partners.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" /> Partnerská Organizace
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-750 text-sm rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">Bez organizace (Nezávislý)</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(29,78,216,0.35)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isRegistering ? 'Vytvořit Účet a Vstoupit' : 'Vstoupit do Portálu'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-5 text-xs">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
          >
            {isRegistering ? 'Již máte účet? Přihlaste se' : 'Nemáte účet? Zaregistrujte se'}
          </button>
        </div>

        <div className="text-center mt-8 text-[10px] text-slate-500 font-mono">
          Treetino s.r.o. • Autonomní Energetické Stromy
        </div>
      </motion.div>
    </div>
  );
}

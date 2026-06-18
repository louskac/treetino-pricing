import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, User, ArrowRight, Loader2, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import type { Partner, User as UserType } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  onLogin: (user: UserType) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // Credentials States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      onLogin(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Přihlášení nebo registrace selhala. Zkontrolujte prosím údaje.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      {/* Background glowing rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-treetino-light/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-[0_0_50px_rgba(88,204,168,0.15)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-treetino-light via-cyan-500 to-treetino-light" />

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
              <User className="w-3.5 h-3.5 text-treetino-light" /> Uživatelské Jméno
            </label>
            <input
              type="text"
              placeholder="Např. jakub.lustyk"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-sm rounded-2xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-treetino-light transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-treetino-light" /> Heslo
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-sm rounded-2xl py-3.5 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-treetino-light transition-colors"
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
                  <Sparkles className="w-3.5 h-3.5 text-treetino-light" /> Výkonnostní Třída (Tier)
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-sm rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-treetino-light transition-colors"
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
                    <Shield className="w-3.5 h-3.5 text-treetino-light" /> Partnerská Organizace
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 text-sm rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-treetino-light transition-colors"
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
            className="w-full bg-treetino-light hover:bg-[#3ec19b] text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(88,204,168,0.2)] disabled:opacity-50"
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
            className="text-treetino-light hover:underline font-semibold"
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

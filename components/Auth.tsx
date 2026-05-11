import React, { useState } from 'react';
import { User } from '../types';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [receivePromotions, setReceivePromotions] = useState(false);

  const API_URL = import.meta.env.DEV ? 'http://localhost:3005/api' : '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin 
      ? { email, password } 
      : { id: `user-${Date.now()}`, name, email, phone, password, receivePromotions };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onLogin(data.user);
        } else {
          // After registration, automatically login or switch to login
          setIsLogin(true);
          setError('Cadastro realizado! Faça login agora.');
        }
      } else {
        setError(data.error || 'Ocorreu um erro. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px] opacity-50 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black flex items-center justify-center gap-2 mb-2">
                <ShoppingBagIcon className="w-10 h-10 text-green-600" />
                <span className="text-green-600">Smart</span><span className="text-slate-800">Market</span>
            </h1>
            <p className="text-slate-500 font-medium">Sua lista de compras inteligente</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-8 sm:p-10 transition-all duration-500">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cadastro
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-6">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative group">
                  <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Nome completo" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                  />
                </div>
                <div className="relative group">
                  <PhoneIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" />
                  <input 
                    type="tel" 
                    placeholder="Telefone" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </>
            )}

            <div className="relative group">
              <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" />
              <input 
                type="email" 
                placeholder="E-mail" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <div className="relative group">
              <LockClosedIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" />
              <input 
                type="password" 
                placeholder="Senha" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              />
            </div>

            {!isLogin && (
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={receivePromotions}
                  onChange={(e) => setReceivePromotions(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                />
                <span className="text-sm text-slate-600 font-medium">
                  Desejo receber informações sobre novidades e promoções.
                </span>
              </label>
            )}

            {error && (
              <div className={`p-4 rounded-2xl text-sm font-bold ${error.includes('Cadastro') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} animate-shake`}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-lg shadow-green-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg tracking-tight"
            >
              {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="ml-2 text-green-600 font-black hover:underline underline-offset-4"
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Auth;

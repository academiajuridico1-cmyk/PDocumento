import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { ProtocolService } from '../ProtocolService';

interface AuthProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPass = '';
    for (let i = 0; i < 8; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPass);
    setConfirmPassword(newPass);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Por favor, informe o e-mail e a senha.');
        }
        await ProtocolService.signIn(email, password);
      } else {
        if (!fullName || !email || !password || !companyName) {
          throw new Error('Por favor, preencha todos os campos obrigatórios.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        await ProtocolService.signUp(email, password, fullName, companyName);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let message = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      await ProtocolService.resetPassword(email);
      setError('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await ProtocolService.signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError('Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0070e0] flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl p-8 md:p-12"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 relative mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M20 20 L80 20 L80 80 L50 80 L50 50 L20 50 Z" fill="#0070e0" />
              <path d="M50 50 L80 50 L80 80 L50 80 Z" fill="#0056b3" />
              <path d="M20 20 L50 20 L50 50 L20 50 Z" fill="#0084ff" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Pdocumento</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Seu nome completo*"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#0070e0] outline-none transition-all ${error && !fullName ? 'border-red-500' : 'border-stone-300'}`}
                  />
                  {error && !fullName && (
                    <div className="absolute right-3 top-3 text-red-500">
                      <AlertCircle size={20} />
                    </div>
                  )}
                  {error && !fullName && <p className="text-red-500 text-xs mt-1">informe seu nome completo</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <input
              type="email"
              placeholder={mode === 'login' ? "e-mail" : "seu e-mail*"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#0070e0] outline-none transition-all ${error && !email ? 'border-red-500' : 'border-stone-300'}`}
            />
            {error && !email && (
              <div className="absolute right-3 top-3 text-red-500">
                <AlertCircle size={20} />
              </div>
            )}
            {error && !email && <p className="text-red-500 text-xs mt-1">informe o email</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === 'login' ? "Senha" : "Cadastre uma senha*"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#0070e0] outline-none transition-all ${error && !password ? 'border-red-500' : 'border-stone-300'}`}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {mode === 'register' && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirme sua senha*"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#0070e0] outline-none transition-all ${error && password !== confirmPassword ? 'border-red-500' : 'border-stone-300'}`}
                />
              </div>
            )}
          </div>

          {mode === 'register' && (
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-[#0070e0] text-xs font-bold uppercase hover:underline"
            >
              Gerar senha aleatória segura
            </button>
          )}

          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="company-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Nome da sua empresa*"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#0070e0] outline-none transition-all ${error && !companyName ? 'border-red-500' : 'border-stone-300'}`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && email && password && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 mt-8">
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full md:w-auto px-4 py-2 border border-stone-800 text-stone-800 text-xs font-bold uppercase hover:bg-stone-50 transition-all"
              >
                ESQUECI A SENHA
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 w-full bg-[#0080ff] text-white py-3 rounded font-bold uppercase hover:bg-[#0070e0] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA AGORA')}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative bg-white px-4 text-stone-400 text-xs uppercase font-bold">ou</div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 text-stone-700 py-3 rounded hover:bg-stone-50 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="font-bold text-sm uppercase">Entrar com Google</span>
              </button>
            </div>
          )}

          {mode === 'register' && (
            <p className="text-[10px] text-stone-500 text-center mt-4">
              Ao clicar em "Criar conta agora", você concorda com os nossos <span className="text-[#0070e0] cursor-pointer">termos</span>.
            </p>
          )}
        </form>
      </motion.div>

      <div className="mt-8 flex items-center gap-4 text-white font-medium">
        <p>{mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}</p>
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="px-6 py-2 border border-white rounded hover:bg-white/10 transition-all uppercase text-sm"
        >
          {mode === 'login' ? 'CRIE AGORA!' : 'FAÇA LOGIN'}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Cloud, Smartphone, Copy, Check, Users, AlertCircle } from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from '../services/firebaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  systemKey: string;
  onUpdateSystemKey: (newKey: string) => void;
}

export function UserSyncModal({ isOpen, onClose, systemKey, onUpdateSystemKey }: Props) {
  const [copied, setCopied] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState(systemKey);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  if (!isOpen) return null;

  const currentUser = auth.currentUser;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?system=${encodeURIComponent(systemKey)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyInput.trim()) {
      onUpdateSystemKey(newKeyInput.trim());
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setLoadingAuth(true);
    try {
      await signInWithGoogle();
      setAuthSuccess('¡Sesión con Google iniciada con éxito!');
    } catch (err: any) {
      console.warn('Google sign-in status:', err);
      setAuthError(err.message || 'No se pudo completar el acceso con Google');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoadingAuth(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess('Sesión iniciada correctamente');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setAuthSuccess('Cuenta creada y sincronizada correctamente');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error en la autenticación');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthSuccess('Sesión cerrada');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="modal-sync-user" 
        className="relative w-full max-w-lg bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 max-h-[90vh] overflow-y-auto text-[#ecf5ea]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f7ef]">
                Sincronización Multidispositivo
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Sincronización en tiempo real entre móvil, tablet y ordenador
              </p>
            </div>
          </div>
          <button
            id="btn-close-sync-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Section 1: Multi-device shared system key */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430]">
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#f1f7ef] text-sm">
              <Smartphone className="w-4 h-4 text-lime-400" />
              Código de Instalación Compartida
            </div>
            <p className="text-xs text-[#8ca48a] mb-3 leading-relaxed">
              Cualquier dispositivo que introduzca este identificador tendrá acceso a la misma base de datos con sincronización instantánea en tiempo real.
            </p>

            <form onSubmit={handleApplyKey} className="flex gap-2">
              <input
                id="input-system-key"
                type="text"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                placeholder="Identificador del sistema"
                className="flex-1 px-3 py-2 text-sm bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-mono text-white"
              />
              <button
                id="btn-save-system-key"
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-sm transition-colors"
              >
                Conectar
              </button>
            </form>

            <div className="mt-3 pt-3 border-t border-[#233525] flex items-center justify-between text-xs text-[#8ca48a]">
              <span className="truncate max-w-[240px]">
                Enlace directo para compartir
              </span>
              <button
                id="btn-copy-sync-link"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-lime-400 hover:text-lime-300 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
              </button>
            </div>
          </div>

          {/* Section 2: Firebase User Account & Google Login */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-[#f1f7ef] text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                Gestión de Usuarios y Cuenta
              </div>
              {currentUser && !currentUser.isAnonymous && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-lime-950 text-lime-300 border border-lime-800 font-medium">
                  Conectado
                </span>
              )}
            </div>

            {currentUser && !currentUser.isAnonymous ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#8ca48a]">
                  Has iniciado sesión como <strong className="text-white">{currentUser.email || currentUser.displayName || 'Usuario Google'}</strong>. Todos tus datos están seguros en Firestore.
                </p>
                <button
                  id="btn-signout"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 bg-[#253927] hover:bg-[#304832] text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#8ca48a]">
                  Conéctate con tu cuenta para asegurar tus datos personales en Firebase:
                </p>

                {/* Google Sign-in button */}
                <button
                  id="btn-google-signin"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loadingAuth}
                  className="w-full py-2.5 px-4 bg-[#1f3021] hover:bg-[#273d2a] border border-[#37523a] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Iniciar sesión con Google</span>
                </button>

                <div className="flex items-center my-2 text-[#4d6a4c] text-[10px]">
                  <div className="flex-1 border-t border-[#253927]" />
                  <span className="px-2">o con correo</span>
                  <div className="flex-1 border-t border-[#253927]" />
                </div>

                <div className="flex border-b border-[#233525] mb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`pb-1.5 px-3 font-medium transition-colors ${
                      authMode === 'login'
                        ? 'border-b-2 border-lime-400 text-lime-400 font-bold'
                        : 'text-[#8ca48a] hover:text-white'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`pb-1.5 px-3 font-medium transition-colors ${
                      authMode === 'register'
                        ? 'border-b-2 border-lime-400 text-lime-400 font-bold'
                        : 'text-[#8ca48a] hover:text-white'
                    }`}
                  >
                    Registrar Cuenta
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                  <input
                    id="input-auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    required
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-white"
                  />
                  <input
                    id="input-auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-white"
                  />

                  {authError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/50 p-2 rounded-lg border border-rose-800/60">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="text-xs text-lime-300 bg-lime-950/50 p-2 rounded-lg border border-lime-800/60">
                      {authSuccess}
                    </div>
                  )}

                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    {loadingAuth
                      ? 'Procesando...'
                      : authMode === 'login'
                      ? 'Entrar con correo'
                      : 'Crear cuenta'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#233525] flex justify-end">
          <button
            id="btn-close-sync-done"
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

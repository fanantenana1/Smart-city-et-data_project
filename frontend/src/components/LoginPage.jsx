import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postLogin, api } from '../api';
import { Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('\n🔐 ========== DÉBUT LOGIN ==========');
    console.log(`📝 Username: ${username}`);
    console.log(`📝 Password: ${password}`);
    
    try {
      console.log('📡 Configuration API:', {
        baseURL: api.defaults.baseURL,
        timeout: api.defaults.timeout
      });
      
      console.log('📤 Envoi requête POST à:', api.defaults.baseURL + '/api/auth/login');
      const res = await postLogin(username, password);
      
      console.log('✅ Réponse reçue!');
      console.log('📦 res:', res);
      console.log('📦 res.data:', res.data);
      console.log('📦 res.status:', res.status);
      
      if (!res || !res.data) {
        console.error('❌ ERREUR: res.data est vide!');
        throw new Error('No response data received');
      }
      
      const token = res.data.access_token;
      console.log('🎫 Token type:', typeof token);
      console.log('🎫 Token value:', token ? token.substring(0, 50) + '...' : 'NULL/UNDEFINED');
      
      if (!token) {
        console.error('❌ ERREUR: Token est undefined!');
        console.log('📦 Clés disponibles:', Object.keys(res.data));
        throw new Error('No access_token in response');
      }
      
      console.log('✅ Token valide!');
      localStorage.setItem('sw_token', token);
      console.log('💾 Token stocké dans localStorage');

      console.log('🎫 User info:', res.data.user);

      // Decode token to check role
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const isAdmin = decoded.role === 'admin';

      const redirectPath = isAdmin ? '/dashboard' : '/simple';
      console.log('🚀 Redirection vers', redirectPath);

      navigate(redirectPath);
      console.log('✨ Navigation effectuée!');
      console.log('🔐 ========== FIN LOGIN OK ==========\n');
      
    } catch (err) {
      console.error('\n❌ ========== ERREUR LOGIN ==========');
      console.error('❌ Code erreur:', err.code);
      console.error('❌ Message:', err.message);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Data:', err.response?.data);
      console.error('❌ Config URL:', err.config?.url);
      console.error('❌ Erreur complète:', err);
      console.error('🔐 ========== FIN ERREUR ==========\n');
      
      // Afficher l'erreur dans l'interface
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Erreur inconnue';
      setError('❌ ' + errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour à l'accueil
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-emerald-50 p-3 rounded-xl mb-4">
              {/*<Trash2 className="text-white" size={32} />*/}
                <img 
              src="/smartwaste-logo.png" 
              alt="SmartWaste Logo" 
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
            </div>
           
            <h1 className="text-2xl font-bold text-slate-800">SmartWaste</h1>
            <p className="text-slate-500">Connectez-vous à votre compte</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <form onSubmit={submit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Entrez votre nom d'utilisateur"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-12"
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connexion en cours...</span>
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">ou</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Vous n'avez pas de compte ?{' '}
                <Link 
                  to="/register" 
                  className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              {/*<strong>Compte démo :</strong> admin / admin*/}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-slate-500 text-sm">
        © 2026 SmartWaste - Tous droits réservés
      </footer>
    </div>
  );
}

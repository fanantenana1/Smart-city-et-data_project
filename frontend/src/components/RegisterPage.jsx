import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { api } from '../api'; // Importer l'instance axios configurée

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    setLoading(true);

    try {
      console.log('Envoi requête inscription:', {
        username: formData.username,
        email: formData.email,
        full_name: formData.name
      });

      // Utiliser l'instance axios configurée au lieu de fetch
      const response = await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        full_name: formData.name,
        phone_number: formData.phone_number,
        password: formData.password,
      });

      console.log('Réponse inscription:', response.data);

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.detail || 'Erreur lors de la création du compte.');
      }
    } catch (err) {
      console.error('Erreur inscription:', err);
      console.error('Response:', err.response);
      
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Erreur lors de la création du compte. Veuillez réessayer.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center bg-emerald-100 p-4 rounded-full mb-4">
            <Check className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Compte créé avec succès !</h2>
          <p className="text-slate-600 mb-4">Vous allez être redirigé vers la page de connexion...</p>
          <div className="animate-pulse bg-emerald-200 h-1 rounded-full"></div>
        </div>
      </div>
    );
  }

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
            <img
              src="/smartwaste-logo.png"
              alt="SmartWaste Logo"
              className="w-16 h-16 object-contain mx-auto mb-4"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
            <h1 className="text-2xl font-bold text-slate-800">Créer un compte</h1>
            <p className="text-slate-500">Rejoignez SmartWaste aujourd'hui</p>
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <form onSubmit={submit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Votre nom complet"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Choisissez un nom d'utilisateur"
                  required
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numéro de téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="+261 XX XX XXX XX"
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-12"
                    placeholder="Créez un mot de passe"
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

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
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
                    Création en cours...
                  </span>
                ) : (
                  'Créer mon compte'
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

            {/* Login Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Vous avez déjà un compte ?{' '}
                <Link 
                  to="/login" 
                  className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
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
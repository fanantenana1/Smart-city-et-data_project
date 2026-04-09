import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, MapPin, Bell, BarChart3, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const handleNavigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
             <div className="flex items-center space-x-3">
            <img 
              src="/smartwaste-logo.png" 
              alt="SmartWaste Logo" 
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800">SmartWaste</h1>
              <p className="text-xs text-slate-500">Commune de Fianarantsoa</p>
            </div>
          </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-center">
              <button 
                onClick={() => handleNavigate('/login')}
                className="flex-1 sm:flex-none px-4 py-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors text-center"
              >
                Se connecter
              </button>
              <button 
                onClick={() => handleNavigate('/register')}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-center"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section avec Image de Fond */}
      <section className="relative pt-4 pb-16 px-2 overflow-hidden min-h-[410px] flex items-center">

        {/* Image de fond avec overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop"
            alt="Ville de Fianarantsoa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-slate-900/85 to-emerald-800/90"></div>
         </div>

        {/* Contenu */}
        <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
          <div className="mb-4 sm:mb-6">
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4 drop-shadow-lg">
            Gestion Intelligente des Déchets
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-emerald-50 mb-8 sm:mb-10 max-w-3xl mx-auto px-4 drop-shadow-md">
            Optimisez la collecte des déchets avec notre système de surveillance en temps réel. 
            Réduisez les coûts, améliorez l'efficacité et contribuez à un environnement plus propre.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4 max-w-2xl mx-auto">
            <button 
              onClick={() => handleNavigate('/login')}
              className="w-full sm:w-auto min-w-[240px] px-8 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-200 text-base"
            >
              Accéder au tableau de bord
            </button>
            <button 
              onClick={() => handleNavigate('/register')}
              className="w-full sm:w-auto min-w-[240px] px-8 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all shadow-xl text-base"
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Effet de vague décorative */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section - CORRIGÉ POUR LE CENTRAGE */}
      <section className="py-12 sm:py-16 px-4 bg-white relative overflow-hidden">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-8 sm:mb-12 px-4">
            Fonctionnalités Principales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<MapPin className="text-emerald-600" size={32} />}
              title="Localisation en temps réel"
              description="Visualisez toutes vos poubelles sur une carte interactive avec leur niveau de remplissage actuel."
            />
            <FeatureCard 
              icon={<Bell className="text-emerald-600" size={32} />}
              title="Alertes intelligentes"
              description="Recevez des notifications automatiques quand une poubelle atteint un seuil critique."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-emerald-600" size={32} />}
              title="Statistiques avancées"
              description="Analysez les données de collecte pour optimiser vos tournées et réduire les coûts."
            />
            <FeatureCard 
              icon={<Zap className="text-emerald-600" size={32} />}
              title="Capteurs IoT"
              description="Connectivité avec des capteurs ESP32 pour une surveillance continue et précise."
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-600" size={32} />}
              title="Sécurité renforcée"
              description="Authentification sécurisée et gestion fine des droits d'accès utilisateurs."
            />
            <FeatureCard 
              icon={<Trash2 className="text-emerald-600" size={32} />}
              title="Gestion complète"
              description="Ajoutez, modifiez et suivez toutes vos poubelles depuis une interface unique."
            />
          </div>
        </div>
      </section>

      {/* Stats Section - AMÉLIORÉ RESPONSIVE */}
      <section className="py-12 sm:py-16 px-4 bg-emerald-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center text-white">
            <StatCard number="50+" label="Poubelles connectées" />
            <StatCard number="94%" label="Efficacité de collecte" />
            <StatCard number="24/7" label="Surveillance continue" />
            <StatCard number="30%" label="Réduction des coûts" />
          </div>
        </div>
      </section>

      {/* CTA Section - AMÉLIORÉ RESPONSIVE */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 px-4">
            Prêt à optimiser votre gestion des déchets ?
          </h2>
          <p className="text-slate-300 mb-6 sm:mb-8 text-base sm:text-lg px-4">
            Rejoignez les communes qui ont déjà adopté SmartWaste pour une ville plus propre.
          </p>
          <button 
            onClick={() => handleNavigate('/register')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition-colors mx-4"
          >
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Trash2 className="text-white" size={20} />
            </div>
            <span className="text-white font-bold text-base sm:text-lg">SmartWaste</span>
          </div>
          <p className="text-xs sm:text-sm px-4">
            © 2026 SmartWaste - Commune de Fianarantsoa. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 p-5 sm:p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow h-full">
      <div className="mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-slate-600">{description}</p>
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="py-4">
      <p className="text-3xl sm:text-4xl font-bold mb-2">{number}</p>
      <p className="text-sm sm:text-base text-emerald-100">{label}</p>
    </div>
  );
}
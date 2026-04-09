import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header(props) {
  const { isConnected } = props;
  const navigate = useNavigate();

  let token = null;
  try {
    token = localStorage.getItem('sw_token');
  } catch (e) {
    token = null;
  }

  const effectiveConnected = typeof isConnected === 'boolean' ? isConnected : !!token;

  const handleLogout = () => {
    try {
      localStorage.removeItem('sw_token');
    } catch (e) {}
    navigate('/login');
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-container">
            <img 
              src="/smartwaste-logo.png" 
              alt="SmartWaste Logo" 
              className="header-logo"
            />
            <div className="header-text">
              <h1>SmartWaste - Gestion Intelligente</h1>
              <p>Surveillance en temps réel des poubelles connectées</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-status ${effectiveConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{effectiveConnected ? 'Connecté' : 'Déconnecté'}</span>
          </div>
          {token ? (
            <button className="btn logout" onClick={handleLogout} aria-label="Déconnexion">Déconnexion</button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Header;
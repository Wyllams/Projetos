import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'profile' | 'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'parceiro' | 'cliente' | null>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const { t } = useLanguage();
  
  const [theme] = useState(() => localStorage.getItem('appTheme') || 'dark');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const handleProfileSelect = (role: 'admin' | 'parceiro') => {
    setSelectedRole(role);
    setActiveView('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setAuthError(error.message);
      return;
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    setLoading(false);

    const role = profile?.role || 'admin';
    if (role === 'admin') navigate('/admin');
    else if (role === 'parceiro') navigate('/partner');
    else if (role === 'cliente') navigate('/client');
    else navigate('/admin');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: regName,
        }
      }
    });

    setLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      alert(t('accountCreated'));
      setActiveView('login');
      setEmail(regEmail);
    }
  };

  const fillDemo = (role: 'admin' | 'parceiro') => {
    setSelectedRole(role);
    setActiveView('login');
    setTimeout(() => {
      navigate(role === 'admin' ? '/admin' : '/partner');
    }, 500);
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="logo-wrapper">
          {/* We import the image from public folder later or replace with absolute path for now */}
          <img src={theme === 'light' ? '/Logo atual Bravo.png' : '/Logo Fundo azul.jpeg'} alt="Bravo Homes Group" className="logo-img" style={{background: 'transparent'}} />
          <div className="logo-subtext">Plataforma de Gestão</div>
        </div>

        <div className="view-container">
          {/* PROFILE SELECTION */}
          <div className={`view ${activeView === 'profile' ? 'active' : 'exit-left'}`}>
            <h2 className="profile-title">Selecione seu acesso</h2>
            <div className="profile-cards">
              <div className="profile-card" onClick={() => handleProfileSelect('parceiro')}>
                <div className="pc-icon">👷</div>
                <div className="pc-info">
                  <h3>Sou Parceiro</h3>
                  <p>Acesse suas obras, clientes, fotos e cronograma.</p>
                </div>
                <div className="pc-arrow">➔</div>
              </div>
              <div className="profile-card" onClick={() => handleProfileSelect('admin')}>
                <div className="pc-icon">💼</div>
                <div className="pc-info">
                  <h3>Sou Admin</h3>
                  <p>Gerencie leads, equipes, propostas e financeiro.</p>
                </div>
                <div className="pc-arrow">➔</div>
              </div>
            </div>
          </div>

          {/* LOGIN FORM */}
          <div className={`view ${activeView === 'login' ? 'active' : 'exit-left'}`} style={{ display: activeView === 'login' || activeView === 'register' ? 'block' : 'none' }}>
            <div className="login-card">
              
              <div className="form-header">
                <h2>{t('loginTitle')}</h2>
                <p>{t('loginSubtitle')}</p>
              </div>

              <form onSubmit={handleLogin}>
                {authError && <div style={{color: 'var(--red)', fontSize: '0.8rem', marginBottom: '10px'}}>{authError}</div>}
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder={t('emailPlaceholder')} required />
                </div>
                
                <div className="form-group">
                  <label>{t('password')}</label>
                  <div className="pass-wrapper">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="••••••••" required />
                    <button type="button" className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <label className="remember-me">
                    <input type="checkbox" /> {t('rememberMe')}
                  </label>
                  <button type="button" className="forgot-pass" onClick={() => alert(t('forgotSoon'))}>{t('forgotPassword')}</button>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? t('loggingIn') : t('loginButton')}</span>
                </button>
              </form>

              <div className="create-account-row">
                {t('noAccount')} <button type="button" onClick={() => setActiveView('register')}>{t('createAccount')}</button>
              </div>
            </div>
          </div>


          {/* REGISTER FORM */}
          <div className={`view ${activeView === 'register' ? 'active' : 'exit-left'}`} style={{ display: activeView === 'register' ? 'block' : 'none' }}>
            <div className="login-card">
              <button type="button" className="back-btn" onClick={() => setActiveView('login')}>
                ← <span>{t('backToLogin')}</span>
              </button>

              <div className="form-header">
                <h2>{t('createAccountTitle')}</h2>
                <p>{t('createAccountSubtitle')}</p>
              </div>

              <form onSubmit={handleRegister}>
                {authError && <div style={{color: 'var(--red)', fontSize: '0.8rem', marginBottom: '10px'}}>{authError}</div>}
                <div className="form-group">
                  <label>{t('fullNameLabel')}</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="form-control" placeholder={t('fullNameLabel')} required />
                </div>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="form-control" placeholder={t('emailPlaceholder')} required />
                </div>
                <div className="form-group">
                  <label>{t('password')}</label>
                  <div className="pass-wrapper">
                    <input type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="form-control" placeholder="••••••••" required />
                    <button type="button" className="pass-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                      {showRegPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('profileLabel')}</label>
                  <select className="form-control" required style={{ cursor: 'pointer' }}>
                    <option value="">{t('selectProfile')}</option>
                    <option value="parceiro">{t('partnerContractor')}</option>
                    <option value="cliente">{t('client')}</option>
                  </select>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? t('creatingAccount') : t('createAccountTitle')}</span>
                </button>
              </form>

              <div className="create-account-row" style={{ marginTop: 14 }}>
                {t('alreadyHaveAccount')} <button type="button" onClick={() => setActiveView('login')}>{t('enter')}</button>
              </div>
            </div>
          </div>

        </div>

        <div className="login-footer">
          Bravo Homes Group © 2026<br/><span>Atlanta, Georgia</span>
        </div>
      </div>
    </div>
  );
}

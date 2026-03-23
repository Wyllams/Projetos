import React from 'react';

interface SettingsTabProps {
  t: (key: string) => string;
  userProfile: any;
  user: any;
  adminName: string;
  setAdminName: (v: string) => void;
  adminEmail: string;
  setAdminEmail: (v: string) => void;
  adminPhone: string;
  setAdminPhone: (v: string) => void;
  handleProfileSave: () => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  showToast: (msg: string) => void;
  showConfirm: (msg: string, cb: () => void) => void;
  notifPrefs: Record<string, boolean>;
  toggleNotifPref: (key: string) => void;
  lang: string;
  setLang: (v: any) => void;
}

export default function SettingsTab({
  t, userProfile, user, adminName, setAdminName, adminEmail, setAdminEmail,
  adminPhone, setAdminPhone, handleProfileSave, handleAvatarUpload,
  isUploadingAvatar, showToast, showConfirm, notifPrefs, toggleNotifPref,
  lang, setLang,
}: SettingsTabProps) {
  return (
    <div className="page active">
      <div style={{marginBottom:16}}><div className="u-syne-title">{t('platformSettings')}</div></div>
      
      {/* ROW 1: Perfil | Segurança | Notificações */}
      <div className="settings-grid-3">
        {/* PERFIL DO ADMIN */}
        <div className="card">
          <div className="ch"><span className="ct">👤 {t('adminProfile')}</span></div>
          <div className="cb">
            <div style={{display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px'}}>
              <div style={{position: 'relative', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg3)', border: '2px solid var(--gold)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink:0}}>
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <span style={{fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 'bold'}}>{(userProfile?.full_name || user?.user_metadata?.full_name || 'AD').substring(0,2).toUpperCase()}</span>
                )}
                <label style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', textAlign: 'center', padding: '3px', cursor: 'pointer'}}>
                  ALTERAR
                  <input type="file" style={{display: 'none'}} accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>
              <div>
                <div style={{fontWeight: 'bold', fontSize: '0.95rem'}}>{userProfile?.full_name || user?.user_metadata?.full_name || 'Admin'}</div>
                <div style={{color: 'var(--t2)', fontSize: '0.72rem'}}>{t('jpgPngMax')}</div>
                {isUploadingAvatar && <div style={{fontSize: '0.72rem', color: 'var(--gold)', marginTop: '2px'}}>{t('uploading')}</div>}
              </div>
            </div>
            <div className="u-mb-10"><label className="f-label">{t('fullName')}</label><input type="text" className="f-inp" value={adminName} onChange={(e) => setAdminName(e.target.value)} /></div>
            <div className="u-mb-10"><label className="f-label">{t('email')}</label><input type="text" className="f-inp" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} /></div>
            <div className="u-mb-10"><label className="f-label">Telefone</label><input type="tel" className="f-inp" placeholder="(00) 00000-0000" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} /></div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'24px'}}><button className="btn gold" onClick={handleProfileSave}>{t('saveChanges')}</button></div>
          </div>
        </div>

        {/* SEGURANÇA */}
        <div className="card" style={{display:'flex',flexDirection:'column'}}>
          <div className="ch"><span className="ct">🔒 {t('security')}</span></div>
          <div className="cb" style={{display:'flex',flexDirection:'column',flex:1}}>
            <div className="u-mb-10">
              <label className="f-label">{t('currentPassword')}</label>
              <input type="password" className="f-inp" placeholder="••••••••" />
            </div>
            <div className="u-mb-10">
              <label className="f-label">{t('newPassword')}</label>
              <input type="password" className="f-inp" placeholder={t('min8chars')} />
            </div>
            <div className="u-mb-10">
              <label className="f-label">{t('confirmPassword')}</label>
              <input type="password" className="f-inp" placeholder={t('repeatPassword')} />
            </div>
            <div style={{marginTop:'14px',paddingTop:'12px',borderTop:'1px solid var(--b)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'0.78rem',fontWeight:600}}>{t('twoFactor')}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--t3)'}}>{t('twoFactorDesc')}</div>
                </div>
                <div style={{width:44,height:24,borderRadius:12,background:'var(--b2)',cursor:'pointer',padding:2,transition:'all .3s'}} onClick={() => showToast(t('twoFactorSoon'))}>
                  <div style={{width:20,height:20,borderRadius:10,background:'var(--t3)',transition:'all .3s'}}></div>
                </div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'auto',paddingTop:'24px'}}><button className="btn gold" onClick={() => showToast(t('passwordUpdated'))}>{t('changePassword')}</button></div>
          </div>
        </div>

        {/* NOTIFICAÇÕES */}
        <div className="card">
          <div className="ch"><span className="ct">🔔 {t('notifications')}</span></div>
          <div className="cb">
            {/* Permission status */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',padding:'10px',borderRadius:'8px',background: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)'}}>
              <span style={{fontSize:'0.8rem',fontWeight:600}}>
                {typeof Notification !== 'undefined' && Notification.permission === 'granted'
                  ? '✅ Notificações ativadas'
                  : Notification.permission === 'denied'
                  ? '🚫 Notificações bloqueadas (ative nas configurações do browser)'
                  : '⚠️ Notificações não ativadas'}
              </span>
              {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied' && (
                <button className="btn gold" style={{fontSize:'0.7rem',padding:'4px 12px'}} onClick={async () => {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') showToast('✅ Notificações ativadas!');
                  else showToast('❌ Permissão negada.');
                }}>Ativar Notificações</button>
              )}
            </div>

            {[
              {label: t('newLeadReceived'), desc: t('newLeadReceivedDesc'), key: 'new_lead'},
              {label: t('partnerMessage'), desc: t('partnerMessageDesc'), key: 'partner_msg'},
              {label: t('projectUpdated'), desc: t('projectUpdatedDesc'), key: 'project_update'},
              {label: t('weeklyReports'), desc: t('weeklyReportsDesc'), key: 'weekly_report'},
            ].map(item => (
              <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b)'}}>
                <div>
                  <div style={{fontSize:'0.8rem',fontWeight:600}}>{item.label}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--t3)',marginTop:1}}>{item.desc}</div>
                </div>
                <div onClick={() => toggleNotifPref(item.key)} style={{width:40,height:22,borderRadius:11,background: notifPrefs[item.key] ? 'var(--gold)' : 'var(--b2)',cursor:'pointer',padding:2,transition:'all .3s',flexShrink:0}}>
                  <div style={{width:18,height:18,borderRadius:9,background: notifPrefs[item.key] ? '#fff' : 'var(--t3)',marginLeft: notifPrefs[item.key] ? 18 : 0,transition:'all .3s'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Configurações da Plataforma + Zona de Perigo */}
      <div className="settings-grid-2" style={{marginTop:'14px'}}>
        {/* CONFIG DA PLATAFORMA */}
        <div className="card">
          <div className="ch"><span className="ct">⚙️ {t('platformConfig')}</span></div>
          <div className="cb">
            <div className="settings-inner-grid">
              <div>
                <label className="f-label">{t('companyName')}</label>
                <input type="text" className="f-inp" defaultValue="Bravo Homes" />
              </div>
              <div>
                <label className="f-label">{t('timezone')}</label>
                <select className="f-inp">
                  <option value="America/New_York">América/New York (EST)</option>
                  <option value="America/Chicago">América/Chicago (CST)</option>
                  <option value="America/Denver">América/Denver (MST)</option>
                  <option value="America/Los_Angeles">América/Los Angeles (PST)</option>
                  <option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
                </select>
              </div>
              <div>
                <label className="f-label">{t('currency')}</label>
                <select className="f-inp">
                  <option value="USD">USD ($)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="settings-inner-grid" style={{marginTop:'12px'}}>
              <div>
                <label className="f-label">{t('language')}</label>
                <select className="f-inp" value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'16px'}}>
              <button className="btn gold" onClick={() => showToast(t('platformSettingsSaved'))}>{t('savePlatformSettings')}</button>
            </div>
          </div>
        </div>

        {/* ZONA DE PERIGO */}
        <div className="card" style={{border:'1px solid rgba(231,76,60,0.3)'}}>
          <div className="ch"><span className="ct" style={{color:'var(--red)'}}>⚠️ {t('dangerZone')}</span></div>
          <div className="cb">
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'0.82rem',fontWeight:600}}>{t('exportData')}</div>
              <div style={{fontSize:'0.7rem',color:'var(--t3)',marginBottom:'8px'}}>{t('exportDataDesc')}</div>
              <button className="btn ghost" style={{borderColor:'var(--gold)',color:'var(--gold)',width:'100%'}} onClick={() => showToast(t('exportEmail'))}>📥 {t('export')}</button>
            </div>
            <div style={{paddingTop:'14px',borderTop:'1px solid var(--b)'}}>
              <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--red)'}}>{t('deleteAccount')}</div>
              <div style={{fontSize:'0.7rem',color:'var(--t3)',marginBottom:'8px'}}>{t('deleteAccountDesc')}</div>
              <button className="btn" style={{background:'transparent',border:'1px solid var(--red)',color:'var(--red)',width:'100%'}} onClick={() => showConfirm(t('deleteAccountConfirm'), () => showToast(t('accountDeleted')))}>{t('deleteAccount')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

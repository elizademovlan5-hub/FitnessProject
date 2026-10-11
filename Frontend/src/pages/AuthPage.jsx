import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { Notice } from '../components/Feedback.jsx';

export default function AuthPage({ initialMode = 'login' }) {
  const path = useLocation().pathname;
  const [mode, setMode] = useState(initialMode || (path === '/register' ? 'register' : 'login'));
  const [form, setForm] = useState({ fullName: '', email: '', password: '', code: '' });
  const [waitingForOtp, setWaitingForOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showDevOtp, setShowDevOtp] = useState('');
  const { login, register, verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();

  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const changeMode = (next) => { setMode(next); navigate(next === 'register' ? '/register' : '/login', { replace: true }); setWaitingForOtp(false); setShowDevOtp(''); setNotice(null); setForm({ fullName: '', email: '', password: '', code: '' }); };

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      if (waitingForOtp) {
        const data = await verifyEmail({ email: form.email, code: form.code });
        setNotice({ type: 'success', text: data.message || 'Email təsdiqləndi. İndi daxil ola bilərsən.' });
        setWaitingForOtp(false); setMode('login');
      } else if (mode === 'register') {
        const data = await register({ fullName: form.fullName, email: form.email, password: form.password });
        setWaitingForOtp(true); setNotice({ type: 'success', text: data.message || 'Email-ə təsdiq kodu göndərildi.' });
        setShowDevOtp(data.developmentOtp || '');
      } else {
        await login({ email: form.email, password: form.password });
        navigate('/', { replace: true });
      }
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error) }); }
    finally { setBusy(false); }
  };

  const handleResend = async () => {
    setBusy(true); setNotice(null);
    try {
      const data = await resendOtp({ email: form.email });
      setShowDevOtp(data.developmentOtp || '');
      setNotice({ type: 'success', text: data.message || 'Yeni OTP göndərildi.' });
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error) }); }
    finally { setBusy(false); }
  };

  const title = waitingForOtp ? 'Emailini təsdiqlə' : mode === 'register' ? 'Hesabını yarat' : 'Yenidən hərəkətə başla';

  return <div className="auth-shell">
    <section className="auth-visual"><div className="auth-visual-overlay" /><div className="auth-brand"><div className="brand-mark"><Activity size={23} strokeWidth={2.7} /></div><div className="brand-name">fit<span>life</span><small>TRAINING STUDIO</small></div></div>
      <div className="auth-visual-content"><span className="overline"><Sparkles size={15} /> ÖZ TEMPİNDƏ. HƏR GÜN.</span><h1>Güclü vərdişlər.<br /><em>Daha yaxşı</em> sən.</h1><p>Məşqlərini planla, irəliləyişini izlə və öz ritmini tap. Kiçik addımlar da inkişafdır.</p><div className="auth-feature-list"><div><CheckCircle2 size={18} /><span>Sadə həftəlik məşq planı</span></div><div><CheckCircle2 size={18} /><span>Gündəlik nəticələr və statistika</span></div><div><CheckCircle2 size={18} /><span>Özünə uyğun məşq tövsiyələri</span></div></div></div>
      <div className="auth-photo-credit">FITLIFE METHOD <span>—</span> Hərəkətdə qal</div>
    </section>
    <section className="auth-panel"><div className="auth-panel-top"><span>Fitness rutininə xoş gəlmisən</span><span className="auth-online"><i /> SİSTEM AKTİVDİR</span></div><div className="auth-card"><div className="auth-card-heading"><div className="auth-card-icon"><Activity size={21} /></div><div className="eyebrow">{waitingForOtp ? 'EMAIL TƏSDİQİ' : mode === 'register' ? 'QEYDİYYAT' : 'GİRİŞ'}</div><h2>{title}</h2><p>{waitingForOtp ? `${form.email} ünvanına gələn 6 rəqəmli kodu yaz.` : mode === 'register' ? 'Bir neçə məlumatla hesabını yarat.' : 'Davam etmək üçün hesabına daxil ol.'}</p></div>
      <Notice type={notice?.type} onClose={() => setNotice(null)}>{notice?.text}</Notice>
      {showDevOtp && waitingForOtp && <div className="dev-otp-box"><span>Development test OTP</span><strong>{showDevOtp}</strong><small>Yalnız yerli Development testi üçündür.</small></div>}
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && !waitingForOtp && <label className="field-label">Ad və soyad<div className="input-wrap"><UserRound size={17} /><input autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Ad Soyad" minLength={2} required /></div></label>}
        <label className="field-label">Email ünvanı<div className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" required disabled={waitingForOtp} /></div></label>
        {!waitingForOtp && <label className="field-label">Şifrə<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={mode === 'register' ? 'Ən azı 8 simvol' : 'Şifrən'} minLength={mode === 'register' ? 8 : 1} required /><button type="button" className="input-eye" onClick={() => setShowPassword((x) => !x)} aria-label="Şifrəni göstər"><span>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</span></button></div>{mode === 'register' && <small className="field-hint">Böyük hərf, rəqəm və xüsusi simvol istifadə et.</small>}</label>}
        {waitingForOtp && <label className="field-label">6 rəqəmli təsdiq kodu<div className="input-wrap otp-input"><CheckCircle2 size={17} /><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={(e) => set('code', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></div></label>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Zəhmət olmasa gözlə...' : waitingForOtp ? 'Emaili təsdiqlə' : mode === 'register' ? 'Hesab yarat' : 'Daxil ol'} <ArrowRight size={17} /></button>
      </form>
      {waitingForOtp && <button className="text-button resend-button" onClick={handleResend} disabled={busy}>Kodu yenidən göndər</button>}
      {!waitingForOtp && <div className="auth-switch">{mode === 'register' ? 'Artıq hesabın var?' : 'Hələ hesabın yoxdur?'} <button onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Daxil ol' : 'Qeydiyyatdan keç'}</button></div>}
      <div className="auth-card-bottom"><span><LockKeyhole size={14} /> Təhlükəsiz giriş</span><span>•</span><span>FitLife Studio</span></div></div><div className="auth-panel-footer">Davam etməklə hesabın məlumatlarının bu tətbiqin funksiyalarını təmin etmək üçün istifadə edilməsinə razılaşırsan.</div></section>
  </div>;
}

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Save, UserRound } from 'lucide-react';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { EmptyState, Loading, Notice, PageHeading } from '../components/Feedback.jsx';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ fullName: '', heightCm: '', weightKg: '', fitnessGoal: '' });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [monthlyUploading, setMonthlyUploading] = useState(false);
  const [notice, setNotice] = useState(null);
  const photoRef = useRef(null);
  const monthlyRef = useRef(null);

  const load = async () => {
    setBusy(true);
    try {
      const [profile, history] = await Promise.all([api.get('/Profile/me'), api.get('/Profile/monthly-photos')]);
      setForm({ fullName: profile.data.fullName || '', heightCm: profile.data.heightCm ?? '', weightKg: profile.data.weightKg ?? '', fitnessGoal: profile.data.fitnessGoal || '' });
      setPhotos(history.data || []);
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const body = { fullName: form.fullName, heightCm: form.heightCm === '' ? null : Number(form.heightCm), weightKg: form.weightKg === '' ? null : Number(form.weightKg), fitnessGoal: form.fitnessGoal || null };
      await api.put('/Profile/me', body); await refreshProfile();
      setNotice({ type: 'success', text: 'Profil məlumatların saxlanıldı.' });
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setSaving(false); }
  };

  const upload = async (event, kind) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const setBusyKind = kind === 'profile' ? setUploading : setMonthlyUploading;
    setBusyKind(true); setNotice(null);
    try {
      const body = new FormData(); body.append('file', file);
      const endpoint = kind === 'profile' ? '/Profile/photo' : '/Profile/monthly-photo';
      const { data } = await api.post(endpoint, body);
      if (kind === 'profile') await refreshProfile(); else { const { data: history } = await api.get('/Profile/monthly-photos'); setPhotos(history || []); }
      setNotice({ type: 'success', text: data.message || 'Şəkil yükləndi.' });
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setBusyKind(false); }
  };

  if (busy) return <div className="page-stack"><Loading label="Profil yüklənir..." /></div>;
  const photo = user?.profilePhotoUrl;
  const initials = (form.fullName || user?.email || 'F').split(/[\s@]/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');

  return <div className="page-stack"><PageHeading eyebrow="ŞƏXSİ MƏLUMATLAR" title="Profilim" description="Məlumatlarını yenilə və irəliləyiş fotolarını idarə et." />{notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
    <div className="profile-layout"><section className="surface-card profile-card"><div className="profile-card-heading"><div className="eyebrow">HESAB MƏLUMATLARI</div><h2>Şəxsi məlumatlar</h2><p>Bu məlumatlar profilində və fərdi tövsiyələrində istifadə olunur.</p></div><div className="profile-identity"><div className="profile-avatar-large">{photo ? <img src={photo} alt="Profil şəkli" /> : initials || <UserRound size={31} />}<button onClick={() => photoRef.current?.click()} className="avatar-camera" title="Profil şəklini dəyiş"><Camera size={16} /></button></div><div><strong>{form.fullName || 'Adını əlavə et'}</strong><span>{user?.email}</span><button className="text-button" onClick={() => photoRef.current?.click()} disabled={uploading}>{uploading ? 'Yüklənir...' : 'Profil şəklini dəyiş'}</button><input className="hidden-input" ref={photoRef} type="file" accept="image/*" onChange={(e) => upload(e, 'profile')} /></div></div>
      <form className="profile-form" onSubmit={save}><label className="field-label">Ad və soyad<input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} minLength={2} maxLength={100} required /></label><label className="field-label">Email<input className="form-input input-readonly" value={user?.email || ''} disabled readOnly /><span className="field-hint">Email ünvanı bu bölmədə dəyişdirilmir.</span></label><div className="form-two-col"><label className="field-label">Boy (sm)<input className="form-input" type="number" min="100" max="250" step="0.1" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="Məsələn, 170" /></label><label className="field-label">Çəki (kq)<input className="form-input" type="number" min="25" max="350" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="Məsələn, 65" /></label></div><label className="field-label">Fitness məqsədi<select className="form-select" value={form.fitnessGoal} onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}><option value="">Məqsəd seç</option><option value="strength">Güc məşqləri</option><option value="cardio">Kardio və dözümlülük</option><option value="mobility">Elastiklik və hərəkətlilik</option><option value="general fitness">Ümumi fiziki hazırlıq</option></select><span className="field-hint">Məqsəd ümumi məşq tövsiyələrini uyğunlaşdırmağa kömək edir.</span></label><button className="btn btn-primary" type="submit" disabled={saving}><Save size={17} /> {saving ? 'Saxlanılır...' : 'Dəyişiklikləri saxla'}</button></form></section>
      <aside className="profile-side-column"><section className="surface-card profile-side-card"><div className="profile-side-icon"><ImagePlus size={20} /></div><div className="eyebrow">AYLIQ İRƏLİLƏYİŞ</div><h3>Aylıq foto qeydi</h3><p>İstəsən, öz irəliləyişini şəxsi tarixçəndə müqayisə etmək üçün ayda bir foto əlavə et. Fotolar Cloudinary-də saxlanılır.</p><button className="btn btn-outline btn-full" onClick={() => monthlyRef.current?.click()} disabled={monthlyUploading}><Camera size={17} /> {monthlyUploading ? 'Yüklənir...' : 'Bu ayın fotosunu əlavə et'}</button><input className="hidden-input" ref={monthlyRef} type="file" accept="image/*" onChange={(e) => upload(e, 'monthly')} /><div className="monthly-rule"><CheckCircle2 size={15} /> Təqvim ayı ərzində bir foto</div></section><section className="surface-card profile-side-card account-status-card"><div className="eyebrow">HESAB STATUSU</div><div className="account-status-row"><span className="status-dot" /><strong>Aktiv hesab</strong></div><p>Hesabın təsdiqlənmiş email ilə qorunur.</p></section></aside></div>
    <section className="surface-card photo-history-card"><div className="section-heading compact-heading"><div><div className="eyebrow">FOTO TARİXÇƏSİ</div><h2>Aylıq qeydlər</h2><p>Əlavə etdiyin fotoları burada görə bilərsən.</p></div><span className="counter-chip">{photos.length} foto</span></div>{photos.length ? <div className="photo-history-grid">{photos.map((p) => <figure key={`${p.photoMonth}-${p.photoUrl}`}><img src={p.photoUrl} alt="Aylıq irəliləyiş fotosu" loading="lazy" /><figcaption><strong>{new Date(p.photoMonth).toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })}</strong><span>{new Date(p.uploadedAt).toLocaleDateString('az-AZ')}</span></figcaption></figure>)}</div> : <EmptyState icon={ImagePlus} title="Hələ foto əlavə edilməyib" description="İlk aylıq foto qeydini yüklədikdə burada görünəcək." />}</section>
  </div>;
}

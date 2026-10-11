import { useEffect, useRef, useState } from 'react';
import { Check, CircleUserRound, Pencil, ImagePlus, Plus, RefreshCw, Save, ShieldCheck, Trash2, Upload, Users, Video, X } from 'lucide-react';
import api, { getErrorMessage } from '../api/client.js';
import { EmptyState, Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const emptyWorkout = { name: '', description: '', muscleGroup: 'Full body', difficulty: 'Beginner', categoryName: 'Strength', imageUrl: '', videoUrl: '', previewSeconds: 8, durationMinutes: 10 };

export default function AdminPage() {
  const [tab, setTab] = useState('workouts');
  const [users, setUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(emptyWorkout);
  const [editingSlug, setEditingSlug] = useState('');
  const [pendingRoles, setPendingRoles] = useState({});
  const imageInput = useRef(null);
  const videoInput = useRef(null);

  const load = async () => {
    setBusy(true); setNotice(null);
    try {
      const [userResult, workoutResult] = await Promise.all([api.get('/Admin/users'), api.get('/Admin/workouts')]);
      setUsers(userResult.data || []);
      setWorkouts((workoutResult.data || []).map((item) => item.workout ? { ...item.workout, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt } : item));
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  const saveWorkout = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const body = { ...form, previewSeconds: Number(form.previewSeconds), durationMinutes: Number(form.durationMinutes), imageUrl: form.imageUrl || null, videoUrl: form.videoUrl || null };
      if (editingSlug) await api.put(`/Admin/workouts/${encodeURIComponent(editingSlug)}`, body);
      else await api.post('/Admin/workouts', body);
      setNotice({ type: 'success', text: editingSlug ? 'Məşq yeniləndi.' : 'Yeni məşq yaradıldı.' });
      setForm(emptyWorkout); setEditingSlug('');
      const { data } = await api.get('/Admin/workouts');
      setWorkouts((data || []).map((item) => item.workout ? { ...item.workout, isActive: item.isActive, createdAt: item.createdAt, updatedAt: item.updatedAt } : item));
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setSaving(false); }
  };

  const editWorkout = (workout) => {
    setEditingSlug(workout.slug);
    setForm({ name: workout.name || '', description: workout.description || '', muscleGroup: workout.muscleGroup || '', difficulty: workout.difficulty || 'Beginner', categoryName: workout.categoryName || 'Strength', imageUrl: workout.imageUrl || '', videoUrl: workout.videoUrl || '', previewSeconds: workout.previewSeconds || 8, durationMinutes: workout.durationMinutes || 10 });
    setTab('workouts'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteWorkout = async (workout) => {
    if (!window.confirm(`“${workout.name}” məşqi deaktiv edilsin?`)) return;
    setNotice(null);
    try {
      await api.delete(`/Admin/workouts/${encodeURIComponent(workout.slug)}`);
      setNotice({ type: 'success', text: 'Məşq deaktiv edildi.' });
      setWorkouts((current) => current.map((x) => x.slug === workout.slug ? { ...x, isActive: false } : x));
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
  };

  const changeRole = async (user) => {
    const role = pendingRoles[user.email] || user.roles?.[0] || 'User';
    setNotice(null);
    try {
      await api.put('/Admin/users/role', { email: user.email, role });
      setNotice({ type: 'success', text: `${user.email} istifadəçisinin rolu ${role} edildi.` });
      setUsers((current) => current.map((u) => u.email === user.email ? { ...u, roles: [role] } : u));
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
  };

  const toggleUser = async (user) => {
    setNotice(null);
    try {
      await api.put('/Admin/users/status', { email: user.email, isActive: !user.isActive });
      setNotice({ type: 'success', text: user.isActive ? 'İstifadəçi deaktiv edildi.' : 'İstifadəçi aktiv edildi.' });
      setUsers((current) => current.map((u) => u.email === user.email ? { ...u, isActive: !u.isActive } : u));
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
  };

  const uploadAsset = async (event, kind) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setNotice(null); setSaving(true);
    try {
      const body = new FormData(); body.append('file', file);
      const endpoint = kind === 'image' ? '/Admin/upload-image' : '/Admin/upload-video';
      const { data } = await api.post(endpoint, body);
      if (kind === 'image') setForm((old) => ({ ...old, imageUrl: data.imageUrl }));
      else setForm((old) => ({ ...old, videoUrl: data.videoUrl, previewSeconds: data.previewSeconds || 8 }));
      setNotice({ type: 'success', text: kind === 'image' ? 'Şəkil Cloudinary-yə yükləndi.' : 'Video Cloudinary-yə yükləndi.' });
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setSaving(false); }
  };

  const resetForm = () => { setForm(emptyWorkout); setEditingSlug(''); setNotice(null); };
  const activeUsers = users.filter((u) => u.isActive).length;
  const activeWorkouts = workouts.filter((w) => w.isActive !== false).length;

  return <div className="page-stack"><PageHeading eyebrow="SİSTEMİN İDARƏETMƏSİ" title="Admin paneli" description="Məşqləri idarə et, istifadəçilərə və rollara nəzarət et." right={<button className="btn btn-outline" onClick={load} disabled={busy}><RefreshCw size={16} /> Yenilə</button>} />
    {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
    <div className="admin-summary-grid"><div className="admin-summary"><div className="stat-icon mint"><Dumbbell size={19} /></div><div><span>Aktiv məşqlər</span><strong>{activeWorkouts}</strong></div></div><div className="admin-summary"><div className="stat-icon lilac"><Users size={19} /></div><div><span>İstifadəçilər</span><strong>{users.length}</strong></div></div><div className="admin-summary"><div className="stat-icon blue"><CircleUserRound size={19} /></div><div><span>Aktiv hesablar</span><strong>{activeUsers}</strong></div></div></div>
    <div className="admin-tabs"><button onClick={() => setTab('workouts')} className={tab === 'workouts' ? 'active' : ''}><Dumbbell size={17} /> Məşqlər</button><button onClick={() => setTab('users')} className={tab === 'users' ? 'active' : ''}><Users size={17} /> İstifadəçilər</button></div>
    {busy ? <Loading label="Admin məlumatları yüklənir..." /> : tab === 'workouts' ? <div className="admin-workout-layout"><section className="surface-card admin-form-card"><div className="section-heading compact-heading"><div><div className="eyebrow">{editingSlug ? 'MƏŞQİ REDAKTƏ ET' : 'YENİ MƏŞQ'}</div><h2>{editingSlug ? 'Məşq məlumatları' : 'Məşq yarat'}</h2><p>Mediada fayl deyil, Cloudinary URL-i saxlanılır.</p></div>{editingSlug && <button className="icon-button" onClick={resetForm} title="Redaktəni ləğv et"><X size={17} /></button>}</div>
      <form className="admin-workout-form" onSubmit={saveWorkout}><label className="field-label">Məşqin adı<input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={120} required placeholder="Məsələn, Push-up" /></label><label className="field-label">Təsvir<textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} minLength={5} maxLength={2000} required rows={3} placeholder="Məşq haqqında qısa məlumat..." /></label><div className="form-two-col"><label className="field-label">Əzələ qrupu<input className="form-input" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })} required placeholder="Chest, Back, Full body..." /></label><label className="field-label">Çətinlik<select className="form-select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><div className="form-two-col"><label className="field-label">Kateqoriya<select className="form-select" value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })}><option>Strength</option><option>Cardio</option><option>Mobility</option></select></label><label className="field-label">Müddət (dəq.)<input className="form-input" type="number" min="1" max="240" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required /></label></div><div className="upload-fields"><div className="upload-field"><div className="upload-field-icon"><ImagePlus size={18} /></div><div className="upload-field-copy"><strong>Məşq şəkli</strong><span>{form.imageUrl ? 'Şəkil əlavə edilib' : 'JPG, PNG və ya WebP'}</span></div><button type="button" className="btn btn-outline btn-sm" onClick={() => imageInput.current?.click()}><Upload size={14} /> Yüklə</button><input ref={imageInput} className="hidden-input" type="file" accept="image/*" onChange={(e) => uploadAsset(e, 'image')} /></div><div className="upload-field"><div className="upload-field-icon video-icon"><Video size={18} /></div><div className="upload-field-copy"><strong>Hərəkət videosu</strong><span>{form.videoUrl ? 'Video əlavə edilib · 8 san. preview' : 'Qısa məşq videosu'}</span></div><button type="button" className="btn btn-outline btn-sm" onClick={() => videoInput.current?.click()}><Upload size={14} /> Yüklə</button><input ref={videoInput} className="hidden-input" type="file" accept="video/*" onChange={(e) => uploadAsset(e, 'video')} /></div></div>{(form.imageUrl || form.videoUrl) && <div className="asset-url-box">{form.imageUrl && <div><span>Image URL</span><input className="form-input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>}{form.videoUrl && <div><span>Video URL</span><input className="form-input" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} /></div>}</div>}<div className="admin-form-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{editingSlug ? <Save size={17} /> : <Plus size={17} />}{saving ? 'Saxlanılır...' : editingSlug ? 'Dəyişiklikləri saxla' : 'Məşq yarat'}</button>{editingSlug && <button type="button" className="btn btn-outline" onClick={resetForm}>Ləğv et</button>}</div></form></section>
      <section className="surface-card admin-workout-list"><div className="section-heading compact-heading"><div><div className="eyebrow">KİTABXANA</div><h2>Məşqlər siyahısı</h2><p>Əlavə olunan məşqləri redaktə et və ya deaktiv et.</p></div><span className="counter-chip">{workouts.length}</span></div>{workouts.length ? <div className="admin-items-list">{workouts.map((w) => <article className={`admin-workout-item ${w.isActive === false ? 'inactive-item' : ''}`} key={w.slug}><div className="admin-workout-thumb">{w.imageUrl ? <img src={w.imageUrl} alt="" /> : <Dumbbell size={21} />}</div><div className="admin-workout-info"><strong>{w.name}</strong><span>{w.muscleGroup} · {w.difficulty}</span><small>{w.slug}</small></div><span className={`status-chip ${w.isActive === false ? 'status-off' : ''}`}>{w.isActive === false ? 'Deaktiv' : 'Aktiv'}</span><button className="icon-button" onClick={() => editWorkout(w)} title="Redaktə et" disabled={w.isActive === false}><Pencil size={16} /></button>{w.isActive !== false && <button className="icon-button danger-icon" onClick={() => deleteWorkout(w)} title="Deaktiv et"><Trash2 size={16} /></button>}</article>)}</div> : <EmptyState icon={Dumbbell} title="Məşq yoxdur" description="İlk məşqi bu formadan əlavə et." />}</section></div> : <section className="surface-card admin-users-card"><div className="section-heading compact-heading"><div><div className="eyebrow">HESABLAR</div><h2>İstifadəçilər</h2><p>Rolları və hesab statusunu idarə et.</p></div><span className="counter-chip"><Users size={15} /> {users.length} istifadəçi</span></div>{users.length ? <div className="table-responsive"><table className="data-table admin-users-table"><thead><tr><th>İstifadəçi</th><th>Email statusu</th><th>Rol</th><th>Hesab</th><th>Əməliyyat</th></tr></thead><tbody>{users.map((u) => <tr key={u.email}><td><div className="user-table-cell"><div className="avatar-mini">{u.profilePhotoUrl ? <img src={u.profilePhotoUrl} alt="" /> : (u.fullName || u.email).slice(0, 1).toUpperCase()}</div><div><strong>{u.fullName || '—'}</strong><span>{u.email}</span></div></div></td><td><span className={`status-chip ${u.emailConfirmed ? '' : 'status-off'}`}>{u.emailConfirmed ? 'Təsdiqlənib' : 'Təsdiq gözləyir'}</span></td><td><div className="role-edit"><select className="table-select" value={pendingRoles[u.email] || u.roles?.[0] || 'User'} onChange={(e) => setPendingRoles({ ...pendingRoles, [u.email]: e.target.value })}><option value="User">User</option><option value="Admin">Admin</option></select><button className="icon-button" title="Rolu saxla" onClick={() => changeRole(u)}><Check size={15} /></button></div></td><td><span className={`status-chip ${u.isActive ? '' : 'status-off'}`}>{u.isActive ? 'Aktiv' : 'Deaktiv'}</span></td><td><button className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline'}`} onClick={() => toggleUser(u)}>{u.isActive ? 'Deaktiv et' : 'Aktiv et'}</button></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title="İstifadəçi yoxdur" description="Qeydiyyatdan keçən istifadəçilər burada görünəcək." />}</section>}
    <div className="admin-security-note"><ShieldCheck size={17} /><span>Bu panel yalnız Admin roluna sahib istifadəçilər üçün açıqdır. Dəyişikliklər birbaşa backend API-sinə göndərilir.</span></div>
  </div>;
}

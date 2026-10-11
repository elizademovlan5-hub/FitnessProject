import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, Clock3, Dumbbell, PlayCircle, Target } from 'lucide-react';
import api, { getErrorMessage } from '../api/client.js';
import { localMonday } from '../components/WorkoutCard.jsx';
import { Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const days = [{ value: 0, label: 'Bazar' }, { value: 1, label: 'Bazar ertəsi' }, { value: 2, label: 'Çərşənbə axşamı' }, { value: 3, label: 'Çərşənbə' }, { value: 4, label: 'Cümə axşamı' }, { value: 5, label: 'Cümə' }, { value: 6, label: 'Şənbə' }];

function VideoPreview({ src, seconds = 8 }) {
  const limit = Math.max(7, Math.min(Number(seconds) || 8, 8));
  return <div className="video-preview"><video controls playsInline preload="metadata" src={src} onLoadedMetadata={(e) => { const v = e.currentTarget; if (Number.isFinite(v.duration) && v.duration > limit) v.currentTime = 0; }} onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime >= limit) { v.pause(); v.currentTime = limit; } }} /><div className="video-limit-note"><PlayCircle size={15} /> Önizləmə {limit} saniyə ilə məhdudlaşdırılıb</div></div>;
}

export default function WorkoutDetailPage() {
  const { slug } = useParams();
  const [workout, setWorkout] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [day, setDay] = useState('1');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let alive = true; setBusy(true); setError('');
    api.get(`/Workouts/${encodeURIComponent(slug)}`).then(({ data }) => { if (alive) setWorkout(data); })
      .catch((err) => { if (alive) setError(getErrorMessage(err)); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [slug]);

  const addToPlan = async () => {
    setSaving(true); setNotice(null);
    try {
      await api.post('/WeeklyPlan/items', { workoutSlug: workout.slug, dayOfWeek: Number(day), weekStartDate: localMonday() });
      setNotice({ type: 'success', text: 'Məşq həftəlik plana əlavə olundu.' });
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setSaving(false); }
  };

  if (busy) return <div className="surface-card"><Loading label="Məşq məlumatları yüklənir..." /></div>;
  if (error || !workout) return <div className="page-stack"><Link to="/workouts" className="back-link"><ArrowLeft size={17} /> Məşqlərə qayıt</Link><Notice type="error">{error || 'Məşq tapılmadı.'}</Notice></div>;

  return <div className="page-stack">
    <Link to="/workouts" className="back-link"><ArrowLeft size={17} /> Məşqlərə qayıt</Link>
    <PageHeading eyebrow={`${workout.categoryName || 'MƏŞQ'} / MƏŞQ DETALI`} title={workout.name} description="Hərəkəti öz imkanlarına uyğun, rahat tempdə icra et." />
    {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
    <div className="detail-layout"><section className="detail-main surface-card">
      {workout.videoUrl ? <VideoPreview src={workout.videoUrl} seconds={workout.previewSeconds} /> : <div className="detail-cover">{workout.imageUrl ? <img src={workout.imageUrl} alt={workout.name} /> : <div className="cover-placeholder detail-placeholder"><Dumbbell size={54} /><span>FITNESS SESSION</span></div>}</div>}
      <div className="detail-content"><div className="detail-tags"><span className="tag tag-mint">{workout.muscleGroup}</span><span className="tag tag-lilac">{workout.difficulty}</span><span className="tag"><Clock3 size={13} /> {workout.durationMinutes} dəq.</span></div><h2>Məşq haqqında</h2><p className="detail-description">{workout.description}</p><div className="detail-note"><Target size={19} /><div><strong>Rahat temp seç</strong><p>Hərəkəti düzgün icra etməyə diqqət et. Narahatlıq hiss etsən, dayan və fasilə ver.</p></div></div></div>
    </section><aside className="detail-side surface-card"><div className="eyebrow">MƏŞQİNİ PLANLA</div><h3>Həftənə əlavə et</h3><p className="side-description">Bu məşqi həftəlik planında uyğun günə yerləşdir.</p><label className="field-label">Məşq günü<select className="form-select" value={day} onChange={(e) => setDay(e.target.value)}>{days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label><button className="btn btn-primary btn-full" onClick={addToPlan} disabled={saving}><CalendarPlus size={17} /> {saving ? 'Əlavə olunur...' : 'Həftəlik plana əlavə et'}</button><div className="detail-divider" /><div className="info-line"><span><Clock3 size={16} /> Müddət</span><strong>{workout.durationMinutes} dəqiqə</strong></div><div className="info-line"><span><Dumbbell size={16} /> Səviyyə</span><strong>{workout.difficulty}</strong></div><div className="info-line"><span><CheckCircle2 size={16} /> Preview</span><strong>{workout.previewSeconds || 8} saniyə</strong></div><Link to="/weekly-plan" className="text-link side-link">Həftəlik planı aç <ArrowLeft className="arrow-turned" size={15} /></Link></aside></div>
  </div>;
}

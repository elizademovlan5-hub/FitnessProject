import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Dumbbell, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { EmptyState, Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const dayAz = { Monday: 'Bazar ertəsi', Tuesday: 'Çərşənbə axşamı', Wednesday: 'Çərşənbə', Thursday: 'Cümə axşamı', Friday: 'Cümə', Saturday: 'Şənbə', Sunday: 'Bazar' };

export default function RecommendationsPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    api.get('/Recommendations/me').then(({ data: result }) => { if (alive) setData(result); })
      .catch((err) => { if (alive) setError(getErrorMessage(err)); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, []);
  const isProfileIncomplete = error.toLowerCase().includes('boy və çəki');

  return <div className="page-stack"><PageHeading eyebrow="ŞƏXSİ TÖVSİYƏLƏR" title="Sənə uyğun rutin" description="Profilindəki məqsədə əsaslanan ümumi, başlanğıc səviyyəli məşq ideyaları." />
    <section className="recommendation-hero"><div className="recommendation-icon"><Sparkles size={23} /></div><div><div className="hero-kicker"><span className="hero-kicker-dot" /> SADƏ BAŞLA</div><h2>Ən yaxşı plan — davam etdirə bildiyin plandır.</h2><p>Bu tövsiyələr ümumi məşq ideyalarıdır. Boy və çəki təkbaşına ideal bədən və ya təhlükəsiz intensivlik müəyyən etmir.</p></div></section>
    {busy ? <Loading label="Tövsiyələr hazırlanır..." /> : error ? <div className="surface-card"><Notice type={isProfileIncomplete ? 'info' : 'error'}>{error}</Notice>{isProfileIncomplete && <div className="recommendation-incomplete"><p>Profilində boy və çəki məlumatlarını qeyd etdikdən sonra ümumi başlanğıc proqramına baxa bilərsən.</p><Link to="/profile" className="btn btn-primary">Profilimi tamamla <ArrowRight size={16} /></Link></div>}</div> : <>
      {data?.message && <div className="recommendation-disclaimer"><Target size={18} /><span>{data.message}</span></div>}
      {data?.sessions?.length ? <div className="recommendation-session-grid">{data.sessions.map((session, index) => <article className="recommendation-session" key={`${session.day}-${session.workout.slug}`}><div className="recommendation-session-day"><CalendarDays size={16} /> {dayAz[session.day] || session.day}<span>0{index + 1}</span></div><Link to={`/workouts/${encodeURIComponent(session.workout.slug)}`} className="recommendation-workout-cover">{session.workout.imageUrl ? <img src={session.workout.imageUrl} alt={session.workout.name} /> : <div className="cover-placeholder"><Dumbbell size={28} /><span>FITNESS</span></div>}</Link><div className="recommendation-session-body"><div className="workout-meta"><span>{session.workout.muscleGroup}</span><span>·</span><span>{session.workout.difficulty}</span></div><h3>{session.workout.name}</h3><p>{session.workout.description}</p><div className="recommendation-session-bottom"><span>{session.workout.durationMinutes} dəq.</span><Link to={`/workouts/${encodeURIComponent(session.workout.slug)}`} className="text-link">Detallar <ArrowRight size={15} /></Link></div></div></article>)}</div> : <div className="surface-card"><EmptyState icon={Dumbbell} title="Hələ tövsiyə ediləcək məşq yoxdur" description="Admin panelindən Beginner səviyyəli məşqlər əlavə ediləndə onlar burada görünəcək." action={<Link to="/workouts" className="btn btn-outline">Məşqlərə bax</Link>} /></div>}
      <div className="recommendation-reminder"><CheckCircle2 size={18} /><span>{data?.reminder || 'Öz tempini seç, ehtiyac olduqda fasilə ver.'}</span></div>
    </>}
  </div>;
}

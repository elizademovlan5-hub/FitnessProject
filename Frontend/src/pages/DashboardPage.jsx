import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarCheck, BarChart3, Clock3, Dumbbell, Flame, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { Loading, Notice, PageHeading } from '../components/Feedback.jsx';
import WorkoutCard from '../components/WorkoutCard.jsx';

const number = (value) => new Intl.NumberFormat('az-AZ').format(Number(value || 0));
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? 'Sabahın xeyir' : hour < 18 ? 'Günün xeyir' : 'Axşamın xeyir'; };

export default function DashboardPage() {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => {
    setError(''); setBusy(true);
    try {
      const [d, w, list] = await Promise.all([
        api.get('/Statistics/daily'), api.get('/Statistics/weekly'), api.get('/Workouts', { params: { page: 1, pageSize: 3 } })
      ]);
      setDaily(d.data); setWeekly(w.data); setWorkouts(list.data.items || []);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  useEffect(() => { reload(); }, []);

  return <div className="page-stack">
    <PageHeading eyebrow="ŞƏXSİ İCMAL" title={`${greeting()}!`} description="Bu gün özün üçün kiçik bir addım at." right={<Link to="/workouts" className="btn btn-primary"><Dumbbell size={17} /> Məşqləri kəşf et</Link>} />
    <section className="dashboard-hero"><div className="hero-copy"><div className="hero-kicker"><span className="hero-kicker-dot" /> HƏRƏKƏT ZAMANI</div><h2>Davamlı ol.<br /><em>Nəticə öz yolunu tapacaq.</em></h2><p>Planını qur, tamamladığın məşqləri işarələ və inkişafını öz tempində izlə.</p><Link to="/weekly-plan" className="hero-button">Həftəlik planına bax <ArrowRight size={16} /></Link></div><div className="hero-art" aria-hidden="true"><div className="hero-ring hero-ring-one" /><div className="hero-ring hero-ring-two" /><div className="hero-orbit-dot" /><div className="hero-art-number">01<span>/ 07</span></div><div className="hero-art-label">ONE DAY AT A TIME</div><div className="hero-art-check"><Target size={22} /></div></div></section>
    {error && <Notice type="error">{error}</Notice>}
    {busy ? <div className="stats-grid">{[1, 2, 3, 4].map((x) => <div key={x} className="stat-card skeleton-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div> : <section className="stats-grid">
      <div className="stat-card"><div className="stat-card-top"><span>Bu gün tamamlanan</span><div className="stat-icon mint"><CalendarCheck size={19} /></div></div><strong>{number(daily?.completedCount)}</strong><div className="stat-foot"><span className="stat-neutral"><TrendingUp size={14} /> Bugünkü sessiya</span><span className="stat-foot-note">məşq</span></div></div>
      <div className="stat-card"><div className="stat-card-top"><span>Aktiv dəqiqələr</span><div className="stat-icon orange"><Clock3 size={19} /></div></div><strong>{number(daily?.totalMinutes)}<small> dəq.</small></strong><div className="stat-foot"><span className="stat-neutral"><Flame size={14} /> Hərəkətdə qal</span></div></div>
      <div className="stat-card"><div className="stat-card-top"><span>Həftəlik tamamlanma</span><div className="stat-icon lilac"><Target size={19} /></div></div><strong>{number(weekly?.completionPercentage)}<small>%</small></strong><div className="stat-progress"><span style={{ width: `${Math.min(100, Number(weekly?.completionPercentage || 0))}%` }} /></div><div className="stat-foot"><span className="stat-foot-note">{number(weekly?.plannedCompletedCount)} / {number(weekly?.plannedCount)} məşq</span></div></div>
      <div className="stat-card"><div className="stat-card-top"><span>Bu həftə vaxt</span><div className="stat-icon blue"><BarChart3 size={19} /></div></div><strong>{number(weekly?.totalMinutes)}<small> dəq.</small></strong><div className="stat-foot"><span className="stat-neutral"><Dumbbell size={14} /> Tamamlanmış sessiyalar</span><span className="stat-foot-note">{number(weekly?.completedSessionCount)}</span></div></div>
    </section>}
    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">SƏNİN ÜÇÜN SEÇİLDİ</div><h2>Məşqləri kəşf et</h2><p>Kiçik bir sessiya ilə başla.</p></div><Link to="/workouts" className="text-link">Bütün məşqlər <ArrowRight size={16} /></Link></div>
      {busy ? <Loading label="Məşqlər yüklənir..." /> : workouts.length ? <div className="workout-grid">{workouts.map((workout) => <WorkoutCard key={workout.slug} workout={workout} onPlanAdded={reload} />)}</div> : <div className="empty-banner"><div className="empty-icon"><Dumbbell size={23} /></div><div><strong>Hələ məşq əlavə olunmayıb</strong><p>Admin panelindən ilk məşqi yarat, burada görünəcək.</p></div><Link to="/workouts" className="text-link">Yoxla <ArrowRight size={15} /></Link></div>}
    </section>
    <section className="bottom-promo"><div className="promo-spark"><Target size={22} /></div><div><strong>Bu həftənin məqsədi — müntəzəm hərəkət</strong><p>Məşqləri həftəyə yay və ehtiyac olduqda istirahət et. Öz tempini seç.</p></div><Link to="/recommendations" className="btn btn-outline">Tövsiyələrim <ArrowUpRight size={16} /></Link></section>
  </div>;
}

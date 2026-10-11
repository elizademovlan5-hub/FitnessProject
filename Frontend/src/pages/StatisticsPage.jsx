import { useEffect, useState } from 'react';
import { BarChart3, CalendarCheck, Clock3, Dumbbell, Target, Trophy } from 'lucide-react';
import api, { getErrorMessage } from '../api/client.js';
import { Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const fmtDate = (value) => value ? new Date(value).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const number = (v) => new Intl.NumberFormat('az-AZ').format(Number(v || 0));

export default function StatisticsPage() {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/Statistics/daily'), api.get('/Statistics/weekly'), api.get('/Statistics/history', { params: { page: 1, pageSize: 20 } })])
      .then(([d, w, h]) => { if (!alive) return; setDaily(d.data); setWeekly(w.data); setHistory(h.data.items || []); })
      .catch((e) => { if (alive) setError(getErrorMessage(e)); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, []);
  const maxMuscleCount = Math.max(1, ...(weekly?.byMuscleGroup || []).map((x) => Number(x.count || 0)));

  return <div className="page-stack"><PageHeading eyebrow="İRƏLİLƏYİŞİN" title="Statistika" description="Tamamladığın məşqlərə bax və ardıcıllığını izlə." />
    {error && <Notice type="error">{error}</Notice>}
    {busy ? <Loading label="Statistika yüklənir..." /> : <>
      <section className="stats-grid stats-grid-three"><div className="stat-card"><div className="stat-card-top"><span>Tamamlanan sessiyalar</span><div className="stat-icon mint"><CalendarCheck size={18} /></div></div><strong>{number(weekly?.completedSessionCount)}</strong><div className="stat-foot"><span className="stat-foot-note">Bu həftə</span></div></div><div className="stat-card"><div className="stat-card-top"><span>Məşq vaxtı</span><div className="stat-icon orange"><Clock3 size={18} /></div></div><strong>{number(weekly?.totalMinutes)}<small> dəq.</small></strong><div className="stat-foot"><span className="stat-foot-note">Bu həftə</span></div></div><div className="stat-card"><div className="stat-card-top"><span>Plan tamamlama</span><div className="stat-icon lilac"><Target size={18} /></div></div><strong>{number(weekly?.completionPercentage)}<small>%</small></strong><div className="stat-progress"><span style={{ width: `${Math.min(100, Number(weekly?.completionPercentage || 0))}%` }} /></div></div></section>
      <div className="statistics-grid"><section className="surface-card stats-chart-card"><div className="section-heading compact-heading"><div><div className="eyebrow">MƏŞQ PAYLANMASI</div><h2>Əzələ qrupları</h2><p>Bu həftə tamamlanan məşqlər</p></div><div className="stat-icon blue"><BarChart3 size={19} /></div></div>{weekly?.byMuscleGroup?.length ? <div className="bar-list">{weekly.byMuscleGroup.map((item) => <div className="bar-row" key={item.muscleGroup}><div className="bar-label-row"><span>{item.muscleGroup}</span><strong>{item.count} məşq <small>· {item.minutes} dəq.</small></strong></div><div className="bar-track"><span style={{ width: `${Math.max(4, Number(item.count || 0) / maxMuscleCount * 100)}%` }} /></div></div>)}</div> : <div className="chart-empty"><div className="empty-icon"><BarChart3 size={23} /></div><strong>Hələ məlumat yoxdur</strong><span>Məşq tamamladıqca qrafik burada görünəcək.</span></div>}</section>
      <section className="surface-card daily-stats-card"><div className="eyebrow">BU GÜN</div><h2>Günün xülasəsi</h2><div className="daily-meter"><div className="meter-number"><strong>{number(daily?.completionPercentage)}</strong><span>% tamamlanıb</span></div><svg viewBox="0 0 160 160" className="meter-svg" aria-label={`${daily?.completionPercentage || 0}% tamamlanma`}><circle cx="80" cy="80" r="63" className="meter-bg" /><circle cx="80" cy="80" r="63" className="meter-value" strokeDasharray={`${2 * Math.PI * 63}`} strokeDashoffset={`${2 * Math.PI * 63 * (1 - Math.max(0, Math.min(100, Number(daily?.completionPercentage || 0))) / 100)}`} /></svg><div className="meter-center"><Trophy size={22} /></div></div><div className="daily-stat-line"><span>Planlaşdırılıb</span><strong>{number(daily?.plannedCount)}</strong></div><div className="daily-stat-line"><span>Tamamlanıb</span><strong>{number(daily?.completedCount)}</strong></div><div className="daily-stat-line"><span>Aktiv dəqiqə</span><strong>{number(daily?.totalMinutes)} dəq.</strong></div></section></div>
      <section className="surface-card history-card"><div className="section-heading compact-heading"><div><div className="eyebrow">MƏŞQ TARİXÇƏSİ</div><h2>Son məşqlər</h2><p>Bitirdiyin sessiyalar burada saxlanılır.</p></div><div className="stat-icon mint"><Dumbbell size={19} /></div></div>{history.length ? <div className="table-responsive"><table className="data-table"><thead><tr><th>Məşq</th><th>Əzələ qrupu</th><th>Tarix</th><th>Müddət</th></tr></thead><tbody>{history.map((item, index) => <tr key={`${item.workoutSlug}-${item.completedAt}-${index}`}><td><strong>{item.workoutName}</strong></td><td><span className="tag tag-mint">{item.muscleGroup}</span></td><td>{fmtDate(item.completedAt)}</td><td>{item.durationMinutes} dəq.</td></tr>)}</tbody></table></div> : <div className="history-empty"><Dumbbell size={21} /><div><strong>Tarixçə hələ boşdur</strong><p>Həftəlik planındakı məşqi tamamladıqda burada görünəcək.</p></div></div>}</section>
    </>}
  </div>;
}

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Dumbbell, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { localMonday } from '../components/WorkoutCard.jsx';
import { EmptyState, Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const dayLabels = [
  { value: 1, label: 'Bazar ertəsi', short: 'B.E.' }, { value: 2, label: 'Çərşənbə axşamı', short: 'Ç.A.' },
  { value: 3, label: 'Çərşənbə', short: 'Çər.' }, { value: 4, label: 'Cümə axşamı', short: 'C.A.' },
  { value: 5, label: 'Cümə', short: 'Cümə' }, { value: 6, label: 'Şənbə', short: 'Şənbə' },
  { value: 0, label: 'Bazar', short: 'Bazar' }
];
function adjustDate(value, offset) { const d = new Date(`${value}T12:00:00`); d.setDate(d.getDate() + offset * 7); return localMonday(d); }
function weekCaption(value) { const start = new Date(`${value}T12:00:00`); const end = new Date(start); end.setDate(start.getDate() + 6); return `${start.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })}`; }

export default function WeeklyPlanPage() {
  const [week, setWeek] = useState(() => localMonday());
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [notice, setNotice] = useState(null);

  const reload = async () => {
    setBusy(true); setError('');
    try { const { data } = await api.get('/WeeklyPlan', { params: { weekStartDate: week } }); setItems(data.items || []); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  useEffect(() => { reload(); }, [week]);

  const grouped = useMemo(() => dayLabels.map((day) => ({ ...day, items: items.filter((x) => Number(x.dayOfWeek) === day.value) })), [items]);
  const countDone = items.filter((x) => x.completedAt).length;
  const totalMinutes = items.reduce((sum, x) => sum + Number(x.durationMinutes || 0), 0);

  const doAction = async (item, action) => {
    setActionBusy(`${item.workoutSlug}-${action}`); setNotice(null);
    try {
      if (action === 'complete') await api.post(`/WeeklyPlan/items/${encodeURIComponent(item.workoutSlug)}/complete`, null, { params: { weekStartDate: week } });
      else await api.delete(`/WeeklyPlan/items/${encodeURIComponent(item.workoutSlug)}`, { params: { weekStartDate: week } });
      setNotice({ type: 'success', text: action === 'complete' ? 'Məşq tamamlandı və tarixçəyə əlavə olundu.' : 'Məşq plandan silindi.' });
      await reload();
    } catch (err) { setNotice({ type: 'error', text: getErrorMessage(err) }); }
    finally { setActionBusy(''); }
  };

  return <div className="page-stack"><PageHeading eyebrow="HƏFTƏLİK RUTİN" title="Məşq planım" description="Həftəni özünə uyğun qur. İstirahət də planın bir hissəsidir." right={<Link to="/workouts" className="btn btn-primary"><Dumbbell size={17} /> Məşq əlavə et</Link>} />
    <div className="week-toolbar surface-card"><div className="week-date-label"><div className="stat-icon mint"><CalendarDays size={19} /></div><div><strong>{weekCaption(week)}</strong><span>Həftənin planı</span></div></div><div className="week-nav"><button aria-label="Əvvəlki həftə" onClick={() => setWeek((w) => adjustDate(w, -1))}><ChevronLeft size={18} /></button><button onClick={() => setWeek(localMonday())} className="today-button">Bu həftə</button><button aria-label="Növbəti həftə" onClick={() => setWeek((w) => adjustDate(w, 1))}><ChevronRight size={18} /></button></div><div className="week-summary"><div><strong>{items.length}</strong><span>planlaşdırılıb</span></div><div><strong>{countDone}</strong><span>tamamlanıb</span></div><div><strong>{totalMinutes}</strong><span>dəqiqə</span></div></div></div>
    {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}{error && <Notice type="error">{error}</Notice>}
    {busy ? <Loading label="Həftəlik plan yüklənir..." /> : items.length === 0 ? <div className="surface-card"><EmptyState icon={CalendarDays} title="Bu həftə üçün plan boşdur" description="Məşqlər bölməsindən hərəkət seç və uyğun günə əlavə et." action={<Link to="/workouts" className="btn btn-primary">Məşqləri kəşf et</Link>} /></div> : <div className="week-days-grid">{grouped.map((day) => <section className={`day-column ${day.items.length ? 'day-has-items' : ''}`} key={day.value}><div className="day-column-header"><span className="day-name-short">{day.short}</span><span className="day-name-full">{day.label}</span><span className="day-count">{day.items.length}</span></div><div className="day-items">{day.items.map((item) => <article className={`plan-item ${item.completedAt ? 'plan-item-done' : ''}`} key={item.workoutSlug}><div className="plan-item-top"><div className="plan-item-icon">{item.completedAt ? <Check size={17} /> : <Dumbbell size={17} />}</div><span className="plan-item-duration"><Clock3 size={13} /> {item.durationMinutes} dəq.</span></div><Link className="plan-item-title" to={`/workouts/${encodeURIComponent(item.workoutSlug)}`}>{item.workoutName}</Link><div className="plan-item-meta">{item.muscleGroup} · {item.difficulty}</div>{item.completedAt ? <span className="completed-chip"><CheckCircle2 size={13} /> Tamamlanıb</span> : <div className="plan-item-actions"><button className="small-complete-btn" onClick={() => doAction(item, 'complete')} disabled={!!actionBusy}>{actionBusy === `${item.workoutSlug}-complete` ? '...' : 'Tamamla'}</button><button className="small-remove-btn" onClick={() => doAction(item, 'remove')} disabled={!!actionBusy} title="Plandan sil"><Trash2 size={15} /></button></div>}</article>)}</div></section>)}</div>}
    <div className="plan-footnote"><CheckCircle2 size={17} /><span>Tamamladığın məşqlər tarixçədə qalır. İstirahət günlərini boş saxlaya bilərsən.</span></div>
  </div>;
}

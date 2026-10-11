import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarPlus, Clock3, Dumbbell, Play } from 'lucide-react';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Notice } from './Feedback.jsx';

const dayLabels = [
  { value: 0, label: 'Bazar' }, { value: 1, label: 'Bazar ertəsi' },
  { value: 2, label: 'Çərşənbə axşamı' }, { value: 3, label: 'Çərşənbə' },
  { value: 4, label: 'Cümə axşamı' }, { value: 5, label: 'Cümə' }, { value: 6, label: 'Şənbə' }
];

export default function WorkoutCard({ workout, onPlanAdded }) {
  const { token } = useAuth();
  const [day, setDay] = useState('1');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const addToPlan = async () => {
    if (!token) return;
    setBusy(true); setNotice(null);
    try {
      await api.post('/WeeklyPlan/items', { workoutSlug: workout.slug, dayOfWeek: Number(day), weekStartDate: localMonday() });
      setNotice({ type: 'success', text: 'Məşq həftəlik plana əlavə edildi.' });
      onPlanAdded?.();
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error) }); }
    finally { setBusy(false); }
  };

  return <article className="workout-card">
    <Link to={`/workouts/${encodeURIComponent(workout.slug)}`} className="workout-cover">
      {workout.imageUrl ? <img src={workout.imageUrl} alt={workout.name} loading="lazy" /> : <div className="cover-placeholder"><Dumbbell size={35} /><span>FITNESS SESSION</span></div>}
      <span className="cover-tag">{workout.categoryName || 'Məşq'}</span>
      {workout.videoUrl && <span className="play-badge"><Play size={14} fill="currentColor" /></span>}
    </Link>
    <div className="workout-card-body">
      <div className="workout-meta"><span>{workout.muscleGroup}</span><span className="dot-separator">•</span><span>{workout.difficulty}</span></div>
      <Link to={`/workouts/${encodeURIComponent(workout.slug)}`} className="workout-title-link"><h3>{workout.name}</h3><ArrowUpRight size={17} /></Link>
      <p className="workout-description">{workout.description}</p>
      <div className="workout-card-bottom"><span className="duration"><Clock3 size={15} /> {workout.durationMinutes} dəq.</span><span className="muted-small">{workout.previewSeconds || 8} san. preview</span></div>
      <div className="add-plan-row"><select className="day-select" aria-label="Məşq günü" value={day} onChange={(e) => setDay(e.target.value)}>{dayLabels.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select><button className="icon-action" onClick={addToPlan} disabled={!token || busy} title={token ? 'Həftəlik plana əlavə et' : 'Əvvəlcə daxil ol'}><CalendarPlus size={17} />{busy ? '...' : 'Plana əlavə et'}</button></div>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
    </div>
  </article>;
}

export function localMonday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

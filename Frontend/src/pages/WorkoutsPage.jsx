import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import WorkoutCard from '../components/WorkoutCard.jsx';
import { EmptyState, Loading, Notice, PageHeading } from '../components/Feedback.jsx';

const categoryOptions = [{ value: '', label: 'Bütün kateqoriyalar' }, { value: 'strength', label: 'Strength' }, { value: 'cardio', label: 'Cardio' }, { value: 'mobility', label: 'Mobility' }];
const difficulties = [{ value: '', label: 'Bütün səviyyələr' }, { value: 'Beginner', label: 'Başlanğıc' }, { value: 'Intermediate', label: 'Orta' }, { value: 'Advanced', label: 'İrəli' }];

export default function WorkoutsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryText = searchParams.get('search') || '';
  const [searchDraft, setSearchDraft] = useState(queryText);
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1, page: 1 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const page = Number(searchParams.get('page') || 1);
  const muscleGroup = searchParams.get('muscleGroup') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const category = searchParams.get('category') || '';
  const serialized = searchParams.toString();

  useEffect(() => { setSearchDraft(queryText); }, [queryText]);
  useEffect(() => {
    let alive = true;
    setBusy(true); setError('');
    api.get('/Workouts', { params: Object.fromEntries(new URLSearchParams(serialized)) })
      .then(({ data: result }) => { if (alive) setData(result); })
      .catch((err) => { if (alive) setError(getErrorMessage(err)); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [serialized]);

  const muscleOptions = useMemo(() => [...new Set([muscleGroup, ...(data.items || []).map((w) => w.muscleGroup)].filter(Boolean))].sort(), [data.items, muscleGroup]);
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };
  const onSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchDraft.trim()) next.set('search', searchDraft.trim()); else next.delete('search');
    next.delete('page'); setSearchParams(next);
  };
  const clearFilters = () => { setSearchDraft(''); setSearchParams({}); };

  return <div className="page-stack">
    <PageHeading eyebrow="MƏŞQ KİTABXANASI" title="Məşqləri kəşf et" description="Sənə uyğun hərəkət seç, öz planını qur." right={<div className="counter-chip"><Dumbbell size={16} /> {data.totalCount || 0} məşq</div>} />
    <section className="filter-panel"><form className="search-form" onSubmit={onSearch}><Search size={18} /><input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Məşq adı və ya açar söz axtar..." aria-label="Məşq axtar" /><button className="btn btn-primary" type="submit">Axtar</button></form><div className="filter-divider" /><div className="filter-fields"><div className="filter-title"><SlidersHorizontal size={16} /><span>Filtrlər</span></div><label><span>Əzələ qrupu</span><select value={muscleGroup} onChange={(e) => updateParam('muscleGroup', e.target.value)}><option value="">Bütün qruplar</option>{muscleOptions.map((m) => <option key={m} value={m}>{m}</option>)}</select></label><label><span>Çətinlik</span><select value={difficulty} onChange={(e) => updateParam('difficulty', e.target.value)}>{difficulties.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label><label><span>Kateqoriya</span><select value={category} onChange={(e) => updateParam('category', e.target.value)}>{categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><button className="clear-filter" onClick={clearFilters}><X size={15} /> Sıfırla</button></div><div className="query-hint"><span>Aktiv URL filtrləri</span><code>{`/workouts${serialized ? `?${serialized}` : ''}`}</code></div></section>
    {error && <Notice type="error">{error}</Notice>}
    {busy ? <div className="workout-grid">{[1, 2, 3, 4].map((x) => <div className="workout-card skeleton-workout" key={x}><div className="skeleton-cover" /><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div> : data.items?.length ? <><div className="results-heading"><span><strong>{data.totalCount}</strong> nəticə tapıldı</span><span>Səhifə {data.page || page} / {data.totalPages || 1}</span></div><div className="workout-grid">{data.items.map((workout) => <WorkoutCard key={workout.slug} workout={workout} />)}</div>{(data.totalPages || 1) > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(page - 1)); setSearchParams(next); }}><ChevronLeft size={17} /> Əvvəlki</button><span>{page} / {data.totalPages}</span><button disabled={page >= data.totalPages} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(page + 1)); setSearchParams(next); }}>Növbəti <ChevronRight size={17} /></button></div>}</> : <div className="surface-card"><EmptyState icon={Dumbbell} title="Uyğun məşq tapılmadı" description="Filtrləri dəyiş və ya axtarışı sıfırla." action={<button className="btn btn-outline" onClick={clearFilters}>Filtrləri sıfırla</button>} /></div>}
  </div>;
}

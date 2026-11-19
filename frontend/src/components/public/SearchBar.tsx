import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-1.5 rounded-2xl border-2 border-slate-200 bg-white p-2
        shadow-[0_8px_32px_-8px_rgba(6,22,47,.18),0_1px_4px_rgba(6,22,47,.06)]
        transition-all duration-300
        focus-within:border-brand-400/60 focus-within:shadow-[0_12px_40px_-8px_rgba(225,37,43,.22),0_1px_4px_rgba(61,15,16,.06)]
        sm:flex-row sm:items-center"
      role="search"
    >
      <label htmlFor="global-search" className="sr-only">Buscar documentos</label>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft/30 transition-colors duration-200" aria-hidden="true" />
        <input
          id="global-search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por título, autor o tutor…"
          autoComplete="off"
          className="w-full rounded-xl border-0 bg-transparent py-4 pl-12 pr-3 text-base font-medium text-unior-950 placeholder:text-ink-soft/30 focus:outline-none focus:ring-0"
        />
      </div>
      <button type="submit" className="shrink-0 rounded-xl bg-brand-400 px-6 py-3.5 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:bg-brand-500 hover:-translate-y-px hover:shadow-brand-lg active:scale-[0.98] flex items-center gap-2">
        <span>Buscar</span>
        <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
      </button>
    </form>
  );
}

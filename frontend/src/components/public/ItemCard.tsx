import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText, UserRound } from 'lucide-react';

interface Props {
  to: string;
  title: string;
  author?: string;
  year?: string;
  type?: string;
  community?: string;
  collection?: string;
  abstract?: string;
}

const COVER_ACCENTS: Record<string, { gradient: string; dot: string }> = {
  tesis:     { gradient: 'from-unior-950 via-unior-800 to-unior-500',   dot: 'bg-brand-400' },
  proyecto:  { gradient: 'from-[#4b3218] via-[#8a5b20] to-brand-500',  dot: 'bg-amber-400' },
  artículo:  { gradient: 'from-[#103a32] via-[#1c5a49] to-[#38866f]',  dot: 'bg-emerald-400' },
  articulo:  { gradient: 'from-[#103a32] via-[#1c5a49] to-[#38866f]',  dot: 'bg-emerald-400' },
  libro:     { gradient: 'from-[#3c1f3a] via-[#642e54] to-[#8d4770]',  dot: 'bg-purple-400' },
  ponencia:  { gradient: 'from-[#2f2448] via-[#4d3a7a] to-[#7660b2]',  dot: 'bg-violet-400' },
  trabajo:   { gradient: 'from-[#133249] via-[#1e5474] to-[#3b7f9e]',  dot: 'bg-sky-400' },
};
const DEFAULT_ACCENT = { gradient: 'from-unior-950 via-unior-700 to-unior-500', dot: 'bg-gold-400' };

export default function ItemCard({ to, title, author, year, type, community, collection, abstract }: Props) {
  const accent = COVER_ACCENTS[(type ?? '').toLowerCase()] ?? DEFAULT_ACCENT;
  const location = [community, collection].filter(Boolean).join(' · ');

  return (
    <Link
      to={to}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white
        shadow-[0_1px_3px_rgba(6,22,47,.05),0_6px_20px_-10px_rgba(6,22,47,.1)]
        transition-all duration-300 ease-smooth
        hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_8px_28px_-8px_rgba(6,22,47,.18),0_1px_4px_rgba(6,22,47,.06)]"
      aria-label={`Ver documento: ${title}`}
    >
      {/* Portada degradada */}
      <div className={`cover-art relative h-28 bg-gradient-to-br ${accent.gradient} overflow-hidden`}>
        {/* Overlay hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
        {/* Círculos decorativos */}
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/[0.12] transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-8 left-14 h-20 w-20 rounded-full border border-white/[0.08]" aria-hidden="true" />

        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="max-w-[75%] truncate rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
              {type || 'Documento'}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/40">
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} aria-hidden="true" />
              UNIOR · Open access
            </span>
            {year && <span className="font-display text-2xl font-medium leading-none text-white/90">{year}</span>}
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-sans text-[15px] font-bold leading-snug text-unior-950 transition-colors duration-200 group-hover:text-unior-700">
          {title}
        </h3>
        {author && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft/65">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate">{author}</span>
          </p>
        )}
        {abstract && <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-soft/50">{abstract}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-unior-900/[0.06] pt-3.5">
          <span className="line-clamp-2 text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-ink-soft/40">
            {location || 'Repositorio institucional'}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-unior-900/10 bg-paper-50 text-unior-900
            transition-all duration-300
            group-hover:border-brand-500 group-hover:bg-unior-950 group-hover:text-brand-300 group-hover:shadow-brand-sm group-hover:scale-110">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

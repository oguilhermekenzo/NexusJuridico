
import React, { useMemo } from 'react';
import { Calendar, Clock, Gavel, CheckCircle2, ChevronRight, Scale, Bell, MapPin, Video } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface AgendaEvent {
  id: string;
  processoId: string;
  processoTitulo: string;
  processoNumero: string;
  data: string;
  tipo: 'PRAZO' | 'AUDIENCIA';
  descricao: string;
  local?: string;
  status: string;
}

interface AgendaProps {
  onViewProcess?: (processId: string) => void;
}

const parseDate = (dateStr: string) => {
  if (dateStr.includes('T')) return new Date(dateStr);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isUrl = (str: string) => /^https?:\/\//.test(str);

const EventCard = ({ event, isOverdue, onViewProcess }: { 
  event: AgendaEvent; 
  isOverdue?: boolean;
  onViewProcess?: (processId: string) => void;
}) => (
  <div className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-600 transition-all group shadow-sm flex items-start gap-4 
    ${isOverdue ? 'border-red-900/50 bg-red-900/5' : 'border-slate-800'}`}>
    
    <div className={`p-3 rounded-lg shrink-0 ${event.tipo === 'PRAZO' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
      {event.tipo === 'PRAZO' ? <Clock size={20} /> : <Gavel size={20} />}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-col">
          <h4 className="font-bold text-slate-100 text-sm truncate">{event.descricao}</h4>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${event.tipo === 'PRAZO' ? 'text-amber-500' : 'text-blue-500'}`}>
            {event.tipo === 'PRAZO' ? 'Prazo Processual' : 'Audiência'}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
             {parseDate(event.data).toLocaleDateString('pt-BR')}
          </span>
          {event.data.includes('T') && (
            <span className="text-[10px] font-mono text-slate-500">
              {new Date(event.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 mt-2">
        <Scale size={12} className="text-slate-600" /> {event.processoTitulo}
      </p>
      
      {event.local && (
        <div className="mt-2">
          {isUrl(event.local) ? (
            <a 
              href={event.local} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/10 text-blue-400 text-[10px] font-bold hover:bg-blue-600/20 transition-colors"
            >
              <Video size={12} /> Entrar na Reunião
            </a>
          ) : (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.local)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold hover:bg-slate-700 hover:text-slate-200 transition-colors"
            >
              <MapPin size={12} /> Ver no Mapa
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{event.processoNumero}</span>
         <button 
           onClick={() => onViewProcess?.(event.processoId)}
           className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors uppercase"
         >
            Ver Processo <ChevronRight size={12} />
         </button>
      </div>
    </div>
  </div>
);

const Section = ({ title, events, color, isOverdue, onViewProcess }: { 
  title: string; 
  events: AgendaEvent[]; 
  color: string; 
  isOverdue?: boolean;
  onViewProcess?: (processId: string) => void;
}) => {
  if (events.length === 0) return null;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={`w-1 h-6 rounded-full ${color}`}></div>
        <h3 className={`font-bold uppercase tracking-widest text-xs ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
          {title}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
          {events.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <EventCard 
            key={`${event.tipo}-${event.id}`} 
            event={event} 
            isOverdue={isOverdue} 
            onViewProcess={onViewProcess}
          />
        ))}
      </div>
    </div>
  );
};

export const Agenda: React.FC<AgendaProps> = ({ onViewProcess }) => {
  const { cases } = useData();

  const allEvents = useMemo(() => {
    const events: AgendaEvent[] = [];
    
    cases.forEach(c => {
      c.prazos?.forEach(p => {
        if (p.status === 'PENDENTE') {
          events.push({
            id: p.id,
            processoId: c.id,
            processoTitulo: c.titulo,
            processoNumero: c.numero,
            data: p.data,
            tipo: 'PRAZO',
            descricao: p.descricao,
            status: p.status
          });
        }
      });
      
      c.audiencias?.forEach(a => {
        if (a.status === 'AGENDADA') {
          events.push({
            id: a.id,
            processoId: c.id,
            processoTitulo: c.titulo,
            processoNumero: c.numero,
            data: a.data,
            tipo: 'AUDIENCIA',
            descricao: a.tipo,
            local: a.local,
            status: a.status
          });
        }
      });
    });

    return events.sort((a, b) => parseDate(a.data).getTime() - parseDate(b.data).getTime());
  }, [cases]);

  const groupedEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    return {
      atrasados: allEvents.filter(e => {
        const d = parseDate(e.data);
        d.setHours(0,0,0,0);
        return d.getTime() < now.getTime();
      }),
      hoje: allEvents.filter(e => {
        const d = parseDate(e.data);
        d.setHours(0,0,0,0);
        return d.getTime() === now.getTime();
      }),
      amanha: allEvents.filter(e => {
        const d = parseDate(e.data);
        d.setHours(0,0,0,0);
        return d.getTime() === tomorrow.getTime();
      }),
      estaSemana: allEvents.filter(e => {
        const d = parseDate(e.data);
        d.setHours(0,0,0,0);
        return d.getTime() > tomorrow.getTime() && d.getTime() <= endOfWeek.getTime();
      }),
      futuro: allEvents.filter(e => {
        const d = parseDate(e.data);
        d.setHours(0,0,0,0);
        return d.getTime() > endOfWeek.getTime();
      })
    };
  }, [allEvents]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Calendar className="text-blue-500" /> Agenda Jurídica
          </h1>
          <p className="text-slate-500">Compromissos e prazos de todos os seus casos</p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
           <Bell size={18} className="text-slate-500" />
           <span className="text-sm font-medium text-slate-300">
             {groupedEvents.hoje.length} compromissos hoje
           </span>
        </div>
      </header>

      {allEvents.length === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
              <CheckCircle2 size={40} />
           </div>
           <h3 className="text-xl font-bold text-slate-300">Agenda Limpa!</h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">Não há compromissos pendentes ou prazos agendados no momento.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <Section 
            title="Vencidos / Atrasados" 
            events={groupedEvents.atrasados} 
            color="bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
            isOverdue 
            onViewProcess={onViewProcess}
          />
          <Section 
            title="Hoje" 
            events={groupedEvents.hoje} 
            color="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
            onViewProcess={onViewProcess}
          />
          <Section 
            title="Amanhã" 
            events={groupedEvents.amanha} 
            color="bg-amber-500" 
            onViewProcess={onViewProcess}
          />
          <Section 
            title="Esta Semana" 
            events={groupedEvents.estaSemana} 
            color="bg-indigo-500" 
            onViewProcess={onViewProcess}
          />
          <Section 
            title="Próximos Compromissos" 
            events={groupedEvents.futuro} 
            color="bg-slate-700" 
            onViewProcess={onViewProcess}
          />
        </div>
      )}
    </div>
  );
};

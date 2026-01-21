
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, Check } from 'lucide-react';

interface CustomDatePickerProps {
  label?: string;
  value: string; // ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void;
  includeTime?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const ITEM_HEIGHT = 40; 

const WheelColumn = ({ items, value, onChange }: { items: string[], value: string, onChange: (val: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
      }
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    
    if (index >= 0 && index < items.length) {
       scrollTimeout.current = setTimeout(() => {
          if (items[index] !== value) {
             onChange(items[index]);
          }
       }, 50);
    }
  };

  return (
    <div className="relative h-[200px] w-full flex-1 overflow-hidden group">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item, i) => (
          <div 
            key={item} 
            className={`h-[40px] flex items-center justify-center text-sm font-medium transition-all duration-200 snap-center cursor-pointer select-none
              ${item === value 
                ? 'text-white text-lg font-bold scale-110' 
                : 'text-slate-600 scale-95 hover:text-slate-400'}`}
            onClick={() => {
               if (containerRef.current) {
                 containerRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
               }
               onChange(item);
            }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
};

const TimePicker = ({ value, onChange }: { value: string, onChange: (time: string) => void }) => {
  const [hour, minute] = value.split(':');
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="relative h-[200px] bg-slate-950 rounded-xl overflow-hidden mt-4 border border-slate-800/50">
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[40px] bg-slate-800/50 border-y border-blue-500/30 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="flex justify-center relative z-20 h-full">
        <WheelColumn items={hours} value={hour} onChange={(h) => onChange(`${h}:${minute}`)} />
        <div className="flex items-center justify-center pt-2 pb-2 z-30">
           <span className="text-slate-500 font-bold mb-1">:</span>
        </div>
        <WheelColumn items={minutes} value={minute} onChange={(m) => onChange(`${hour}:${m}`)} />
      </div>
    </div>
  );
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  includeTime = false,
  placeholder = 'Selecione a data',
  className = '',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  const [localDate, setLocalDate] = useState<Date | null>(null);
  const [localTime, setLocalTime] = useState("09:00");

  useEffect(() => {
    if (value && isOpen) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setLocalDate(date);
        setViewDate(date);
        if (includeTime) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          setLocalTime(`${hours}:${minutes}`);
        }
      }
    } else if (!value) {
      setLocalDate(null);
    }
  }, [value, isOpen, includeTime]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);
  
  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleConfirm = () => {
    if (!localDate) return;
    
    const [hours, minutes] = localTime.split(':').map(Number);
    const dateToCommit = new Date(localDate);
    dateToCommit.setHours(hours, minutes);
    
    const year = dateToCommit.getFullYear();
    const month = (dateToCommit.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = dateToCommit.getDate().toString().padStart(2, '0');

    if (includeTime) {
      onChange(`${year}-${month}-${dayStr}T${localTime}`);
    } else {
      onChange(`${year}-${month}-${dayStr}`);
    }
    setIsOpen(false);
  };

  const handleDateClick = (day: number, monthOffset: number = 0) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, day);
    setLocalDate(newDate);
    
    if (!includeTime) {
      const year = newDate.getFullYear();
      const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = newDate.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${dayStr}`);
      setIsOpen(false);
    }
  };

  const formattedDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const dateStr = date.toLocaleDateString('pt-BR');
    if (includeTime && value.includes('T')) {
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} às ${timeStr}`;
    }
    return dateStr;
  };
  
  const generateCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDate.getDate();
    
    const grid = [];
    
    for (let i = firstDayOfMonth; i > 0; i--) {
      const day = prevMonthDays - i + 1;
      grid.push(
        <button key={`prev-${day}`} type="button" onClick={() => handleDateClick(day, -1)} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-slate-700 hover:bg-slate-800 hover:text-slate-400 rounded-full transition-colors">
          {day}
        </button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = localDate?.getDate() === day && localDate?.getMonth() === month && localDate?.getFullYear() === year;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      grid.push(
        <button key={day} type="button" onClick={() => handleDateClick(day)} className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110 z-10' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} ${isToday && !isSelected ? 'ring-1 ring-blue-500 text-blue-400' : ''}`}>
          {day}
          {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></div>}
        </button>
      );
    }

    const totalCells = 42; 
    const nextDays = totalCells - grid.length;
    for (let day = 1; day <= nextDays; day++) {
       grid.push(
        <button key={`next-${day}`} type="button" onClick={() => handleDateClick(day, 1)} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-slate-700 hover:bg-slate-800 hover:text-slate-400 rounded-full transition-colors">
          {day}
        </button>
      );
    }
    return grid;
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>}
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center gap-3 bg-slate-950 border rounded-xl p-3.5 cursor-pointer transition-all group
          ${error ? 'border-red-500' : 'border-slate-800 hover:border-slate-700'}
          ${isOpen && !error ? 'ring-2 ring-blue-600 border-transparent' : ''}`}
      >
        <div className={`p-1.5 rounded-lg ${isOpen && !error ? 'bg-blue-600/20 text-blue-500' : 'bg-slate-900 text-slate-500'}`}>
          {includeTime ? <Clock size={16}/> : <Calendar size={16} />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${value ? 'text-slate-200' : 'text-slate-500'}`}>
            {formattedDisplayValue() || placeholder}
          </p>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}
      
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-5 w-full max-w-xs animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
              <h3 className="text-slate-100 font-bold capitalize text-base">{MONTH_NAMES[viewDate.getMonth()]} de {viewDate.getFullYear()}</h3>
              <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {WEEK_DAYS.map((day, i) => <div key={i} className="h-8 flex items-center justify-center text-xs font-bold text-slate-500">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {generateCalendarGrid()}
            </div>
            
            {includeTime && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} className="text-blue-500"/> Selecionar Horário
                  </span>
                  <div className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-300 text-xs font-mono">
                      {localTime}
                  </div>
                </div>
                <TimePicker value={localTime} onChange={setLocalTime} />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
              <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider">
                Cancelar
              </button>
              {includeTime && (
                <button type="button" onClick={handleConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/40">
                    <Check size={14} /> Confirmar
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

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

// --- IOS STYLE WHEEL PICKER ---
const ITEM_HEIGHT = 40; // Height of each number in px
const VISIBLE_ITEMS = 5; // How many items visible at once

const WheelColumn = ({ items, value, onChange }: { items: string[], value: string, onChange: (val: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<any>(null);

  // Initial Scroll Position
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
    
    // Determine which item is centered
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    
    // Only update if index is valid and changed
    if (index >= 0 && index < items.length) {
       // Debounce the state update slightly to avoid stuttering while scrolling fast
       scrollTimeout.current = setTimeout(() => {
          if (items[index] !== value) {
             onChange(items[index]);
          }
       }, 50);
    }
  };

  return (
    <div className="relative h-[200px] w-full flex-1 overflow-hidden group">
      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none',  // IE/Edge
        }}
      >
        {/* Top Padding spacer to allow first item to reach center */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        
        {items.map((item, i) => (
          <div 
            key={item} 
            className={`h-[40px] flex items-center justify-center text-sm font-medium transition-all duration-200 snap-center cursor-pointer select-none
              ${item === value 
                ? 'text-white text-lg font-bold scale-110' 
                : 'text-slate-600 scale-95 hover:text-slate-400'}`}
            onClick={() => {
               // Allow clicking to snap
               if (containerRef.current) {
                 containerRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
               }
               onChange(item);
            }}
          >
            {item}
          </div>
        ))}

        {/* Bottom Padding spacer */}
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
      
      {/* Highlight Bar (The "Lens") */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[40px] bg-slate-800/50 border-y border-blue-500/30 pointer-events-none z-0" />
      
      {/* Gradient Masks for 3D effect */}
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("09:00");

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewDate(date);
        if (includeTime) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          setSelectedTime(`${hours}:${minutes}`);
        }
      }
    } else {
      setSelectedDate(null);
    }
  }, [value, includeTime]);

  // ESC Support
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);
  
  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const updateFullDate = (datePart: Date, timePart: string) => {
    const [hours, minutes] = timePart.split(':').map(Number);
    datePart.setHours(hours, minutes);
    
    const year = datePart.getFullYear();
    const month = (datePart.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = datePart.getDate().toString().padStart(2, '0');

    if(includeTime) {
      onChange(`${year}-${month}-${dayStr}T${timePart}`);
    } else {
      onChange(`${year}-${month}-${dayStr}`);
      setIsOpen(false);
    }
  }

  const handleDateClick = (day: number, monthOffset: number = 0) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, day);
    setSelectedDate(newDate);
    updateFullDate(newDate, selectedTime);
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (selectedDate) {
      updateFullDate(new Date(selectedDate), newTime);
    }
  };

  const formattedDisplayValue = () => {
    if (!selectedDate) return '';
    const dateStr = selectedDate.toLocaleDateString('pt-BR');
    if (includeTime) {
      const timeStr = selectedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    
    // Previous month's days
    for (let i = firstDayOfMonth; i > 0; i--) {
      const day = prevMonthDays - i + 1;
      grid.push(
        <button key={`prev-${day}`} type="button" onClick={() => handleDateClick(day, -1)} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-slate-700 hover:bg-slate-800 hover:text-slate-400 rounded-full transition-colors">
          {day}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      grid.push(
        <button key={day} type="button" onClick={() => handleDateClick(day)} className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all relative ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110 z-10' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} ${isToday && !isSelected ? 'ring-1 ring-blue-500 text-blue-400' : ''}`}>
          {day}
          {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></div>}
        </button>
      );
    }

    // Next month's days to fill grid (Fixed to 42 cells)
    const totalCells = 42; // 6 weeks * 7 days
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

  const CalendarModal = () => createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-5 w-full max-w-xs animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
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
                  {selectedTime}
               </div>
             </div>
             <TimePicker value={selectedTime} onChange={handleTimeChange} />
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
           <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider">
             Fechar (ESC)
           </button>
        </div>
      </div>
    </div>,
    document.body
  );

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
          <p className={`text-sm font-medium ${selectedDate ? 'text-slate-200' : 'text-slate-500'}`}>
            {formattedDisplayValue() || placeholder}
          </p>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}
      {isOpen && <CalendarModal />}
    </div>
  );
};

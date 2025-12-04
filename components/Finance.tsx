import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

export const Finance: React.FC = () => {
  const data = [
    { name: 'Jan', receita: 45000, despesa: 12000 },
    { name: 'Fev', receita: 52000, despesa: 15000 },
    { name: 'Mar', receita: 48000, despesa: 11000 },
    { name: 'Abr', receita: 61000, despesa: 22000 },
    { name: 'Mai', receita: 55000, despesa: 18000 },
    { name: 'Jun', receita: 67000, despesa: 14000 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão Financeira</h1>
          <p className="text-slate-500">Fluxo de caixa, honorários e timesheet</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-colors">
          <Download size={18} /> Relatório Financeiro
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Receita Mensal</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ 67.000,00</h3>
            </div>
          </div>
          <span className="text-xs text-green-400 font-medium">+12% vs mês anterior</span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Despesas</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ 14.000,00</h3>
            </div>
          </div>
          <span className="text-xs text-green-400 font-medium">-5% vs mês anterior</span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Honorários a Faturar</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ 23.450,00</h3>
            </div>
          </div>
          <span className="text-xs text-slate-400">Baseado no Timesheet</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-200 mb-6">Fluxo de Caixa (Semestral)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'}} 
                  formatter={(value: number) => [`R$ ${value}`, '']}
                />
                <Bar dataKey="receita" fill="#10b981" name="Receitas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timesheet Quick View */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-200 mb-4">Timesheet Recente</h3>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {[
              { client: 'Tech Corp', task: 'Revisão Contratual', time: '2h 30m', user: 'Dr. Silva' },
              { client: 'Indústria ABC', task: 'Reunião Cliente', time: '1h 00m', user: 'Dra. Ana' },
              { client: 'Comércio XYZ', task: 'Petição Inicial', time: '4h 15m', user: 'Dr. Silva' },
              { client: 'Tech Corp', task: 'Email / Call', time: '0h 45m', user: 'Dr. Silva' },
            ].map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-300">{entry.client}</p>
                  <p className="text-xs text-slate-500">{entry.task}</p>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-sm font-bold text-blue-500">{entry.time}</span>
                  <span className="text-[10px] text-slate-500">{entry.user}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 border border-blue-600 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600/10 transition-colors">
            Registrar Horas
          </button>
        </div>
      </div>
    </div>
  );
};
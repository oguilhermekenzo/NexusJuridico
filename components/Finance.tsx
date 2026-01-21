
import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Download, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';

export const Finance: React.FC = () => {
  const { cases, timesheet } = useData();

  const financialMetrics = useMemo(() => {
    let currentMonthRevenue = 0;
    let currentMonthExpense = 0;
    let lastMonthRevenue = 0;
    let lastMonthExpense = 0;
    let totalHonorariosContratuais = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const monthlyDataMap: Record<string, { receita: number; despesa: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString('pt-BR', { month: 'short' });
      monthlyDataMap[key] = { receita: 0, despesa: 0 };
    }

    cases.forEach(c => {
      if ((c.status === 'Ativo' || c.status === 'Em Recurso') && c.financeiro?.config?.honorariosContratuais) {
        totalHonorariosContratuais += Number(c.financeiro.config.honorariosContratuais);
      }
      if (c.financeiro?.transacoes) {
        c.financeiro.transacoes.forEach(t => {
          const tDate = new Date(t.data);
          const tMonth = tDate.getMonth();
          const tYear = tDate.getFullYear();
          const monthKey = tDate.toLocaleString('pt-BR', { month: 'short' });
          if (tMonth === currentMonth && tYear === currentYear) {
            if (t.tipo === 'RECEITA') currentMonthRevenue += t.valor;
            else currentMonthExpense += t.valor;
          }
          if (tMonth === lastMonth && tYear === lastMonthYear) {
            if (t.tipo === 'RECEITA') lastMonthRevenue += t.valor;
            else lastMonthExpense += t.valor;
          }
          if (Object.prototype.hasOwnProperty.call(monthlyDataMap, monthKey)) {
            if (t.tipo === 'RECEITA') monthlyDataMap[monthKey].receita += t.valor;
            else monthlyDataMap[monthKey].despesa += t.valor;
          }
        });
      }
    });

    const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : currentMonthRevenue > 0 ? 100 : 0;
    const expenseGrowth = lastMonthExpense > 0 ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : currentMonthExpense > 0 ? 100 : 0;
    const chartData = Object.entries(monthlyDataMap).map(([name, values]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      receita: values.receita,
      despesa: values.despesa
    }));

    return { currentMonthRevenue, currentMonthExpense, revenueGrowth, expenseGrowth, totalHonorariosContratuais, chartData };
  }, [cases]);

  const recentTimesheet = useMemo(() => {
    return timesheet.slice(0, 5).map(entry => {
      const processo = cases.find(c => c.id === entry.processoId);
      return {
        ...entry,
        processoTitulo: processo?.titulo || 'Processo não encontrado'
      };
    });
  }, [timesheet, cases]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão Financeira Integrada</h1>
          <p className="text-slate-500">Consolidado de receitas e despesas dos processos</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-colors">
          <Download size={18} /> Relatório Financeiro
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-center md:text-left">
          <p className="text-sm text-slate-500">Receita (Mês Atual)</p>
          <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.currentMonthRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-center md:text-left">
          <p className="text-sm text-slate-500">Despesas (Mês Atual)</p>
          <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.currentMonthExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-center md:text-left">
          <p className="text-sm text-slate-500">Contratos (Valor Fixo)</p>
          <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.totalHonorariosContratuais.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col min-h-[380px]">
          <h3 className="font-bold text-slate-200 mb-6">Fluxo de Caixa (Últimos 6 Meses)</h3>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialMetrics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                  <Bar dataKey="receita" fill="#10b981" name="Receitas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col min-h-[380px]">
          <h3 className="font-bold text-slate-200 mb-4">Timesheet Recente</h3>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {recentTimesheet.length > 0 ? recentTimesheet.map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm font-semibold text-slate-300 truncate">{entry.processoTitulo}</p>
                  <p className="text-[10px] text-slate-500 truncate">{entry.descricao}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-mono text-sm font-bold text-blue-500">{entry.horas.toFixed(1)}h</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase">{entry.advogado}</span>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-center">
                 <Clock size={32} className="mb-2 opacity-20" />
                 <p className="text-xs">Nenhum lançamento recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

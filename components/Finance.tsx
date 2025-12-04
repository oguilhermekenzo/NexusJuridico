
import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Download, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';

export const Finance: React.FC = () => {
  const { cases } = useData();

  // Calcular métricas financeiras baseadas nos processos reais
  const financialMetrics = useMemo(() => {
    let currentMonthRevenue = 0;
    let currentMonthExpense = 0;
    let lastMonthRevenue = 0;
    let lastMonthExpense = 0;
    let totalHonorariosContratuais = 0; // Honorários fixos de todos os processos ativos

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Agrupamento por mês para o gráfico (últimos 6 meses)
    const monthlyDataMap: Record<string, { receita: number; despesa: number }> = {};
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString('pt-BR', { month: 'short' });
      monthlyDataMap[key] = { receita: 0, despesa: 0 };
    }

    cases.forEach(c => {
      // Somar Honorários Contratuais de processos ativos
      if (c.status === 'Ativo' && c.financeiro?.config?.honorariosContratuais) {
        totalHonorariosContratuais += Number(c.financeiro.config.honorariosContratuais);
      }

      // Processar Transações
      if (c.financeiro?.transacoes) {
        c.financeiro.transacoes.forEach(t => {
          const tDate = new Date(t.data);
          const tMonth = tDate.getMonth();
          const tYear = tDate.getFullYear();
          const monthKey = tDate.toLocaleString('pt-BR', { month: 'short' });

          // Métricas do Mês Atual
          if (tMonth === currentMonth && tYear === currentYear) {
            if (t.tipo === 'RECEITA') currentMonthRevenue += t.valor;
            else currentMonthExpense += t.valor;
          }

          // Métricas do Mês Anterior
          if (tMonth === lastMonth && tYear === lastMonthYear) {
            if (t.tipo === 'RECEITA') lastMonthRevenue += t.valor;
            else lastMonthExpense += t.valor;
          }

          // Dados do Gráfico (apenas se estiver dentro da janela de 6 meses)
          if (Object.prototype.hasOwnProperty.call(monthlyDataMap, monthKey)) {
            if (t.tipo === 'RECEITA') monthlyDataMap[monthKey].receita += t.valor;
            else monthlyDataMap[monthKey].despesa += t.valor;
          }
        });
      }
    });

    // Calcular variações percentuais
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;
      
    const expenseGrowth = lastMonthExpense > 0 
      ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 
      : currentMonthExpense > 0 ? 100 : 0;

    // Converter mapa para array do gráfico
    const chartData = Object.entries(monthlyDataMap).map(([name, values]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      receita: values.receita,
      despesa: values.despesa
    }));

    return {
      currentMonthRevenue,
      currentMonthExpense,
      revenueGrowth,
      expenseGrowth,
      totalHonorariosContratuais,
      chartData
    };
  }, [cases]);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Receita (Mês Atual)</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.currentMonthRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>
          <span className={`text-xs font-medium ${financialMetrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {financialMetrics.revenueGrowth > 0 ? '+' : ''}{financialMetrics.revenueGrowth.toFixed(1)}% vs mês anterior
          </span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Despesas (Mês Atual)</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.currentMonthExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>
          <span className={`text-xs font-medium ${financialMetrics.expenseGrowth <= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {financialMetrics.expenseGrowth > 0 ? '+' : ''}{financialMetrics.expenseGrowth.toFixed(1)}% vs mês anterior
          </span>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Contratos Ativos (Valor Fixo)</p>
              <h3 className="text-2xl font-bold text-slate-100">R$ {financialMetrics.totalHonorariosContratuais.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>
          <span className="text-xs text-slate-400">Total de honorários contratuais cadastrados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-200 mb-6">Fluxo de Caixa (Últimos 6 Meses)</h3>
          {financialMetrics.chartData.every(d => d.receita === 0 && d.despesa === 0) ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600 min-h-[250px]">
                <AlertCircle size={40} className="mb-2 opacity-50" />
                <p>Sem dados financeiros recentes.</p>
                <p className="text-xs">Adicione transações nos processos para visualizar.</p>
             </div>
          ) : (
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip 
                    cursor={{fill: '#1e293b'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'}} 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']}
                    />
                    <Bar dataKey="receita" fill="#10b981" name="Receitas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Timesheet Quick View (Still Mocked as Timesheet Module is placeholder) */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-200">Timesheet Recente</h3>
             <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Simulação</span>
          </div>
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
          <button className="mt-4 w-full py-2 border border-blue-600 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600/10 transition-colors opacity-50 cursor-not-allowed" title="Módulo Timesheet em desenvolvimento">
            Registrar Horas
          </button>
        </div>
      </div>
    </div>
  );
};

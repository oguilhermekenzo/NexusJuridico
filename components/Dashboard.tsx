
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, Clock, TrendingUp, Scale, DollarSign, CheckCircle2 } from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito } from '../types';

interface DashboardProps {
  cases: Processo[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cases }) => {
  const activeCases = cases.filter(c => c.status === ProcessoStatus.ATIVO).length;
  const totalValue = cases.reduce((acc, curr) => acc + (curr.valorCausa || 0), 0);
  
  const productivity = useMemo(() => {
    let totalPrazos = 0;
    let prazosConcluidos = 0;
    cases.forEach(c => {
      if (c.prazos) {
        totalPrazos += c.prazos.length;
        prazosConcluidos += c.prazos.filter(p => p.status === 'CONCLUIDO').length;
      }
    });
    if (totalPrazos === 0) return 100;
    return Math.round((prazosConcluidos / totalPrazos) * 100);
  }, [cases]);

  const statusData = [
    { name: 'Ativos', value: cases.filter(c => c.status === ProcessoStatus.ATIVO).length },
    { name: 'Suspensos', value: cases.filter(c => c.status === ProcessoStatus.SUSPENSO).length },
    { name: 'Julgados', value: cases.filter(c => c.status === ProcessoStatus.JULGADO).length },
    { name: 'Recurso', value: cases.filter(c => c.status === ProcessoStatus.EM_RECURSO).length },
  ].filter(d => d.value > 0);

  const areaData = Object.values(AreaDireito).map(area => ({
    name: area,
    count: cases.filter(c => c.area === area).length
  })).filter(d => d.count > 0);

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

  const StatsCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 transition-all hover:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Visão Geral</h1>
        <p className="text-slate-500">Inteligência estratégica do escritório</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Processos Ativos" value={activeCases} icon={Scale} color="bg-blue-600" />
        <StatsCard title="Valor em Causa" value={`R$ ${totalValue.toLocaleString('pt-BR')}`} icon={DollarSign} color="bg-green-600" />
        <StatsCard title="Prazos Críticos" value={cases.filter(c => c.prazoFatal).length} icon={AlertTriangle} color="bg-red-600" />
        <StatsCard 
          title="Produtividade" 
          value={`${productivity}%`} 
          icon={productivity >= 80 ? CheckCircle2 : TrendingUp} 
          color={productivity >= 80 ? "bg-emerald-600" : "bg-indigo-600"}
          subtext={productivity >= 80 ? "Excelente performance" : "Abaixo da meta esperada"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 min-h-[420px] flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Processos por Área</h3>
          <div className="flex-1 w-full h-[300px]">
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={areaData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc'}}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
                  <Bar dataKey="count" name="Total de Processos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Sem dados de área para exibir.</div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 min-h-[420px] flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Status da Carteira</h3>
          <div className="flex-1 w-full h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc'}} />
                  <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Sem dados de status para exibir.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

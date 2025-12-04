import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Scale, DollarSign } from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito } from '../types';

interface DashboardProps {
  cases: Processo[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cases }) => {
  // Mock aggregations
  const activeCases = cases.filter(c => c.status === ProcessoStatus.ATIVO).length;
  const totalValue = cases.reduce((acc, curr) => acc + curr.valorCausa, 0);
  
  const statusData = [
    { name: 'Ativos', value: cases.filter(c => c.status === ProcessoStatus.ATIVO).length },
    { name: 'Suspensos', value: cases.filter(c => c.status === ProcessoStatus.SUSPENSO).length },
    { name: 'Julgados', value: cases.filter(c => c.status === ProcessoStatus.JULGADO).length },
    { name: 'Recurso', value: cases.filter(c => c.status === ProcessoStatus.EM_RECURSO).length },
  ];

  const areaData = Object.values(AreaDireito).map(area => ({
    name: area,
    count: cases.filter(c => c.area === area).length
  })).filter(d => d.count > 0);

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

  const StatsCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
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
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Visão Geral do Escritório</h1>
        <p className="text-slate-500">Acompanhamento estratégico em tempo real</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Processos Ativos" 
          value={activeCases} 
          icon={Scale} 
          color="bg-blue-600"
          subtext="+5 novos esta semana"
        />
        <StatsCard 
          title="Valor em Causa" 
          value={`R$ ${totalValue.toLocaleString('pt-BR')}`} 
          icon={DollarSign} 
          color="bg-green-600"
          subtext="Total acumulado"
        />
        <StatsCard 
          title="Prazos Críticos" 
          value="3" 
          icon={AlertTriangle} 
          color="bg-red-600"
          subtext="Vencendo em 48h"
        />
        <StatsCard 
          title="Produtividade" 
          value="94%" 
          icon={TrendingUp} 
          color="bg-indigo-600"
          subtext="Meta mensal atingida"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Processos por Área</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}} 
                  contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'}} 
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Status da Carteira</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1 text-sm text-slate-400">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-200">Próximos Prazos & Audiências</h3>
          <button className="text-sm text-blue-500 font-medium hover:text-blue-400">Ver Agenda Completa</button>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            { title: "Contestação - Silva vs Construtora", date: "Hoje", type: "Prazo", color: "text-red-400 bg-red-500/10" },
            { title: "Audiência de Instrução - Proc. 50442", date: "Amanhã, 14:00", type: "Audiência", color: "text-blue-400 bg-blue-500/10" },
            { title: "Recurso Ordinário - Tech Solutions", date: "24/10/2023", type: "Prazo", color: "text-orange-400 bg-orange-500/10" },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <Clock size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-200">{item.title}</p>
                  <p className="text-xs text-slate-500">Responsável: Dr. Carlos Mendes</p>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
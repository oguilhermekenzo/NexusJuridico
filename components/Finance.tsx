
import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Download, AlertCircle, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface FinanceProps {
  showNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Finance: React.FC<FinanceProps> = ({ showNotify }) => {
  const { cases, timesheet } = useData();
  const { office } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

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
    return timesheet.slice(0, 10).map(entry => {
      const processo = cases.find(c => c.id === entry.processoId);
      return {
        ...entry,
        processoTitulo: processo?.titulo || 'Processo não encontrado'
      };
    });
  }, [timesheet, cases]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      // Importação dinâmica das bibliotecas PDF
      const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
      const { default: autoTable } = await import('https://esm.sh/jspdf-autotable@3.8.2');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString('pt-BR');

      // Cabeçalho
      doc.setFillColor(15, 23, 42); // slate-950
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Financeiro', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(office?.name || 'Escritório Digital', 15, 28);
      doc.text(`Data de Emissão: ${today}`, pageWidth - 15, 20, { align: 'right' });

      // Seção de Métricas
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Mensal', 15, 55);

      autoTable(doc, {
        startY: 60,
        head: [['Métrica', 'Valor']],
        body: [
          ['Receita (Mês Atual)', `R$ ${financialMetrics.currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Despesas (Mês Atual)', `R$ ${financialMetrics.currentMonthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Saldo Operacional', `R$ ${(financialMetrics.currentMonthRevenue - financialMetrics.currentMonthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Contratos Fixos Ativos', `R$ ${financialMetrics.totalHonorariosContratuais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // blue-600
        styles: { fontSize: 10 }
      });

      // Seção de Atividades Recentes
      doc.setFontSize(14);
      doc.text('Lançamentos de Timesheet Recentes', 15, (doc as any).lastAutoTable.finalY + 15);

      const timesheetBody = recentTimesheet.map(t => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.advogado,
        t.processoTitulo,
        t.descricao,
        `${t.horas.toFixed(1)}h`
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Data', 'Advogado', 'Processo', 'Descrição', 'Horas']],
        body: timesheetBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 }
      });

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Gerado por Juzk SAJ IA`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`relatorio_financeiro_${office?.name || 'escritorio'}_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotify?.("Relatório gerado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showNotify?.("Ocorreu um erro ao gerar o relatório.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão Financeira Integrada</h1>
          <p className="text-slate-500">Consolidado de receitas e despesas dos processos</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          disabled={isDownloading}
          className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {isDownloading ? 'Gerando...' : 'Relatório Financeiro'}
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

import { useState } from 'react';
import { DebtWithSchedule } from '../types';
import { formatCurrency } from '../lib/utils';
import { ChevronDown, ChevronUp, CreditCard, Home, Car, Landmark, Trash2, Clock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { DebtSchedule } from './DebtSchedule';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface DebtListProps {
  debts: DebtWithSchedule[];
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  credit_card: { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', label: '信用卡' },
  mortgage: { icon: Home, color: 'text-blue-600', bg: 'bg-blue-50', label: '房贷' },
  car_loan: { icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '车贷' },
  personal_loan: { icon: Landmark, color: 'text-orange-600', bg: 'bg-orange-50', label: '个人贷款' },
  online_loan: { icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', label: '未分期网贷' },
};

export function DebtList({ debts, onDelete }: DebtListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  if (debts.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-neutral-100 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-50 text-neutral-400 mb-4">
          <CreditCard size={32} />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">暂无负债记录</h3>
        <p className="text-neutral-500 text-sm">点击右上角按钮添加你的第一笔负债，开启科学规划。</p>
      </div>
    );
  }

  const activeDebts = debts.filter(d => !d.isDeferred);
  const deferredDebts = debts.filter(d => d.isDeferred);

  const handleAnalyzeDebts = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debts }),
      });

      if (!response.ok) {
        throw new Error('API 请求失败');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || '分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderDebtCard = (debt: DebtWithSchedule) => {
    const config = typeConfig[debt.type] || typeConfig['credit_card'];
    const Icon = config.icon;
    const isExpanded = expandedId === debt.id;
    const progress = debt.isDeferred ? 0 : ((debt.termMonths - debt.remainingPeriods) / debt.termMonths) * 100;

    return (
      <div key={debt.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden transition-all hover:border-neutral-200">
        <div 
          className="p-4 md:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
          onClick={() => setExpandedId(isExpanded ? null : debt.id)}
        >
          <div className="flex items-start md:items-center space-x-3 md:space-x-4">
            <div className={`p-2.5 md:p-3 rounded-xl shrink-0 ${config.bg} ${config.color}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-neutral-900 flex flex-wrap items-center gap-2">
                <span className="truncate">{debt.name}</span>
                {debt.accountNumber && (
                  <span className="text-sm font-normal text-neutral-400 shrink-0">({debt.accountNumber})</span>
                )}
                <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-normal shrink-0">
                  {config.label}
                </span>
                {debt.isDeferred && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-normal border shrink-0 ${
                    (debt.overdueDays ?? 0) > 0 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {(debt.overdueDays ?? 0) > 0 ? `逾期 ${debt.overdueDays} 天` : '延后处理'}
                  </span>
                )}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {debt.isDeferred 
                  ? <span className="text-orange-600/80">当前暂不计入月供计划</span>
                  : <>剩余期数: <span className="font-medium text-neutral-700">{debt.remainingPeriods}</span> / {debt.termMonths}期</>
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end space-x-4 md:space-x-8 pl-12 md:pl-0">
            <div>
              <p className="text-xs md:text-sm text-neutral-500">{debt.isDeferred ? '欠款总额' : '每月还款'}</p>
              <p className="text-base md:text-lg font-medium text-neutral-900">{formatCurrency(debt.isDeferred ? debt.principal : debt.monthlyPayment)}</p>
            </div>
            {!debt.isDeferred && (
              <div className="hidden md:block w-32">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>进度</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="flex items-center space-x-1 md:space-x-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(debt.id); }}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除记录"
              >
                <Trash2 size={18} />
              </button>
              <div className="text-neutral-400 p-2">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 pt-2 border-t border-neutral-100 bg-neutral-50/30 overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm mt-3">
                <div>
                  <span className="block text-neutral-500 mb-1">本金总额</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(debt.principal)}</span>
                </div>
                {!debt.isDeferred && (
                  <>
                    <div>
                      <span className="block text-neutral-500 mb-1">年化利率</span>
                      <span className="font-medium text-neutral-900">{debt.annualInterestRate}%</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 mb-1">总利息预估</span>
                      <span className="font-medium text-orange-600">{formatCurrency(debt.totalInterest)}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 mb-1">总还款额</span>
                      <span className="font-medium text-neutral-900">{formatCurrency(debt.totalPayment)}</span>
                    </div>
                  </>
                )}
              </div>
              {debt.notes && (
                <div className="mb-4 text-sm text-neutral-600 bg-white p-3 rounded-xl border border-neutral-100 shadow-sm">
                  <span className="font-medium text-neutral-500 block mb-1">备注说明</span>
                  {debt.notes}
                </div>
              )}
              {!debt.isDeferred && <DebtSchedule debt={debt} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* AI Debt Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-indigo-900 flex items-center">
              <Sparkles size={16} className="text-indigo-500 mr-1.5" />
              AI 债务结构诊断
            </h4>
            <p className="text-xs text-indigo-700/70 mt-1">评估高息风险，获取最优还款策略建议</p>
          </div>
          <button
            onClick={handleAnalyzeDebts}
            disabled={isAnalyzing || debts.length === 0}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                诊断中...
              </>
            ) : (
              '一键诊断'
            )}
          </button>
        </div>

        {analysisError && (
          <div className="flex items-start p-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100 mb-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 mr-2" />
            <span>{analysisError}</span>
          </div>
        )}

        {analysis && (
          <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100/50 text-sm text-neutral-800 shadow-sm mt-4">
            <div className="markdown-body">
              <Markdown>{analysis}</Markdown>
            </div>
          </div>
        )}
      </div>

      {activeDebts.length > 0 && (
        <div className="space-y-4">
          {activeDebts.map(renderDebtCard)}
        </div>
      )}

      {deferredDebts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <Clock className="mr-2 text-rose-500" size={20} />
            延后处理 (网贷等低优债务)
          </h3>
          <div className="space-y-4">
            {deferredDebts.map(renderDebtCard)}
          </div>
        </div>
      )}
    </div>
  );
}

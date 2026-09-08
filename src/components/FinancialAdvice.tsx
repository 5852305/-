import { Wallet, ShieldCheck, AlertTriangle, TrendingUp, CalendarDays } from 'lucide-react';
import { DebtWithSchedule, UserSettings, DailyExpense } from '../types';
import { formatCurrency } from '../lib/utils';

interface FinancialAdviceProps {
  debts: DebtWithSchedule[];
  settings: UserSettings;
  expenses: DailyExpense[];
}

export function FinancialAdvice({ debts, settings, expenses }: FinancialAdviceProps) {
  const totalInstallments = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  
  // Calculate extra income for this month
  const monthlyExtraIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate actual total income
  const totalIncome = settings.monthlyIncome + monthlyExtraIncome;

  // Calculate cash flow
  const fixedOutflows = settings.monthlyLivingExpenses + totalInstallments;
  const remainingCash = totalIncome - fixedOutflows;

  // Daily metrics (assuming 30 days)
  const dailyIncome = totalIncome / 30;
  const dailyOutflow = fixedOutflows / 30;
  const dailySurplus = remainingCash / 30;

  const isDeficit = remainingCash < 0;

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 opacity-10">
        <ShieldCheck size={200} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-6 text-emerald-400">
          <Wallet size={24} />
          <h3 className="text-xl font-semibold text-white">月度现金流与资金分配建议</h3>
        </div>
        
        <p className="text-neutral-300 text-sm mb-6">
          鉴于您的债务已设定好固定的分期计划，当前的首要任务是<strong>建立健康的现金流与应急备用金</strong>，而非盲目焦虑提前还款。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Daily Income */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center space-x-2 text-neutral-400 mb-2">
              <CalendarDays size={16} />
              <span className="text-sm font-medium">每日收入基准</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{formatCurrency(dailyIncome)}</span>
              <span className="text-neutral-400 text-xs">/天</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              包含固定 {formatCurrency(settings.monthlyIncome)} 
              {monthlyExtraIncome > 0 && <span className="text-emerald-400"> + 额外 {formatCurrency(monthlyExtraIncome)}</span>}
            </p>
          </div>

          {/* Card 2: Mandatory Keep */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center space-x-2 text-neutral-400 mb-2">
              <ShieldCheck size={16} className="text-blue-400" />
              <span className="text-sm font-medium">每月必须预留</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{formatCurrency(fixedOutflows)}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              生活费 {formatCurrency(settings.monthlyLivingExpenses)} + 分期还款 {formatCurrency(totalInstallments)}
            </p>
          </div>

          {/* Card 3: Recommended Savings */}
          <div className={`rounded-xl p-5 border ${isDeficit ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {isDeficit ? <AlertTriangle size={16} className="text-rose-400" /> : <TrendingUp size={16} className="text-emerald-400" />}
              <span className={`text-sm font-medium ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isDeficit ? '资金缺口' : '每月建议储蓄'}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-bold ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(Math.abs(remainingCash))}
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDeficit ? 'text-rose-300' : 'text-emerald-300'}`}>
              {isDeficit ? `每日透支 ${formatCurrency(Math.abs(dailySurplus))}` : `每日结余 ${formatCurrency(dailySurplus)}`}
            </p>
          </div>
        </div>

        {/* Strategic Advice Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
          <h4 className="font-medium mb-3 flex items-center">
            {isDeficit ? (
              <span className="text-rose-400">⚠️ 现金流断裂高危预警</span>
            ) : (
              <span className="text-emerald-300">💡 执行策略 (稳健防御派)</span>
            )}
          </h4>
          
          {isDeficit ? (
            <div className="text-sm text-neutral-200 leading-relaxed space-y-2">
              <p>系统检测到您的 <strong>固定支出已超出总收入</strong>。您目前每天一睁眼就面临 <strong>{formatCurrency(dailyOutflow)}</strong> 的硬性成本，而收入仅有 <strong>{formatCurrency(dailyIncome)}</strong>。</p>
              <ul className="list-disc pl-5 space-y-1 text-rose-200 mt-2">
                <li>立刻停止新增任何负债，盘点可削减的非必要生活开销。</li>
                <li>尝试寻找副业增加额外收入，填补每月 {formatCurrency(Math.abs(remainingCash))} 的窟窿。</li>
                <li>如确实无法承担，请务必提前与平台协商延期或重新分期，避免逾期产生高额罚息和征信污点。</li>
              </ul>
            </div>
          ) : (
            <div className="text-sm text-neutral-200 leading-relaxed space-y-2">
              <p>您的分期计划已安排妥当。您每天的生存底线成本为 <strong>{formatCurrency(dailyOutflow)}</strong>（生活+还款），低于您的日均收入，这是一个好现象。</p>
              <ul className="list-disc pl-5 space-y-1 text-emerald-50 mt-2">
                <li><strong>资金锁仓：</strong> 发工资当天，请立刻将 {formatCurrency(fixedOutflows)} 划入专用账户，确保本月活得下去且不逾期。</li>
                <li><strong>建立安全网：</strong> 剩下的 <strong>{formatCurrency(remainingCash)}</strong> 坚决不要提前还款！请 100% 存入随时可取的货币基金或活期，直到攒够 <strong>3-6个月</strong> 的硬性支出金额，用于防范突然失业或降薪风险。</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

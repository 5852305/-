import { DebtWithSchedule, UserSettings } from '../types';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Target, Trophy, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RepaymentGoalCardProps {
  debts: DebtWithSchedule[];
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export function RepaymentGoalCard({ debts, settings, onUpdateSettings }: RepaymentGoalCardProps) {
  if (!settings.enableRepaymentGoalReminder) return null;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const suggestedRepayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);

  // If no debts or no suggested repayment, don't show the card
  if (suggestedRepayment <= 0) return null;

  const isCompleted = settings.lastCompletedRepaymentMonth === currentMonth;

  const handleMarkCompleted = () => {
    onUpdateSettings({ ...settings, lastCompletedRepaymentMonth: currentMonth });
    
    // Trigger a small confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7']
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-8 animate-in fade-in zoom-in-95 duration-500">
      {!isCompleted ? (
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Target size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">本月还款目标</h3>
              <p className="text-sm text-neutral-500">
                本月建议还款额为 <span className="font-semibold text-neutral-900">{formatCurrency(suggestedRepayment)}</span>。完成还款了吗？
              </p>
            </div>
          </div>
          <button 
            onClick={handleMarkCompleted}
            className="w-full md:w-auto px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center whitespace-nowrap"
          >
            <CheckCircle2 size={18} className="mr-2" />
            标记为已完成
          </button>
        </div>
      ) : (
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">太棒了！目标达成 🎉</h3>
              <p className="text-sm text-emerald-700">
                您已成功完成本月的还款目标 {formatCurrency(suggestedRepayment)}。坚持下去，距离财务自由又近了一步！
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm flex items-center shrink-0">
            <CheckCircle2 size={16} className="mr-1.5" />
            {format(new Date(), 'M月')}任务完成
          </div>
        </div>
      )}
    </div>
  );
}

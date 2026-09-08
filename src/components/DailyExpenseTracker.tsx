import { useState, useMemo } from 'react';
import { DailyExpense, UserSettings } from '../types';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import { Receipt, Plus, AlertCircle, CheckCircle2, TrendingUp, Wallet, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DailyExpenseAnalysis } from './DailyExpenseAnalysis';

interface DailyExpenseTrackerProps {
  expenses: DailyExpense[];
  settings: UserSettings;
  user: User;
}

export function DailyExpenseTracker({ expenses, settings, user }: DailyExpenseTrackerProps) {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);

  const todayRecords = expenses.filter(e => e.date === selectedDate);
  const todayExpSum = todayRecords.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);
  const todayIncSum = todayRecords.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);

  const budget = settings.dailyExpenseBudget || Math.round(settings.monthlyLivingExpenses / 30);

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = format(today, 'yyyy-MM');
    const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));
    
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthlyTotalBudget = budget * daysInMonth;

    // We only count days where *expenses* were logged for the unlogged assumption
    const expenseRecords = thisMonthExpenses.filter(e => e.type !== 'income');
    const loggedDaysSet = new Set(expenseRecords.map(e => e.date));
    const loggedDaysCount = loggedDaysSet.size;
    const unloggedDaysCount = Math.max(0, daysInMonth - loggedDaysCount);

    const loggedSum = expenseRecords.reduce((sum, e) => sum + e.amount, 0);
    const assumedUnloggedSum = unloggedDaysCount * budget;
    const projectedTotal = loggedSum + assumedUnloggedSum;
    
    const extraIncomeTotal = thisMonthExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);

    return {
      daysInMonth,
      loggedDaysCount,
      loggedSum,
      projectedTotal,
      monthlyTotalBudget,
      extraIncomeTotal,
      isOverspending: projectedTotal > monthlyTotalBudget
    };
  }, [expenses, budget]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'dailyExpenses'), {
        userId: user.uid,
        date: selectedDate,
        type: type,
        amount: Number(amount),
        note: note || (type === 'expense' ? '日常开销' : '额外收入'),
        createdAt: serverTimestamp()
      });
      setAmount('');
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'dailyExpenses', id));
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 flex items-center">
          <Receipt size={18} className="mr-2 text-neutral-500" />
          日常收支追踪
        </h3>
        <span className="text-xs font-medium text-neutral-400">{format(new Date(), 'MM月')}统计</span>
      </div>

      <div className="p-5 space-y-6">
        {/* Today's Tracker */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-900">
              {selectedDate === format(new Date(), 'yyyy-MM-dd') ? '今日数据' : `${selectedDate} 数据`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-neutral-500">支出</span>
              <div className="text-lg font-bold text-neutral-900">{formatCurrency(todayExpSum)}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-500">额外收入</span>
              <div className="text-lg font-bold text-emerald-600">+{formatCurrency(todayIncSum)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-500 mb-4 pb-4 border-b border-neutral-200">
            <span>全局支出预算: {formatCurrency(budget)}/天</span>
            <span className={todayExpSum > budget ? 'text-rose-500 font-medium' : 'text-emerald-500'}>
              {todayExpSum > budget ? `超支 ${formatCurrency(todayExpSum - budget)}` : `结余 ${formatCurrency(budget - todayExpSum)}`}
            </span>
          </div>

          <form onSubmit={handleAddRecord} className="space-y-3">
            <div className="flex space-x-1 p-1 bg-neutral-200/50 rounded-lg">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                记支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-emerald-600'}`}
              >
                记额外收入
              </button>
            </div>
            <div className="flex flex-col space-y-2">
              <input
                type="date"
                required
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="金额"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <input
                type="text"
                placeholder="备注 (选填)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="submit"
                disabled={isAdding}
                className={`w-full px-3 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-1 ${type === 'expense' ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                <Plus size={16} />
                <span>{type === 'expense' ? '记录支出' : '记录额外收入'}</span>
              </button>
            </div>
          </form>

          {todayRecords.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">记录明细</h4>
              <div className="space-y-2">
                {todayRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl shadow-sm">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-neutral-900 truncate">{record.note}</p>
                      <p className="text-xs text-neutral-400">{record.type === 'expense' ? '支出' : '收入'}</p>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`text-sm font-bold ${record.type === 'expense' ? 'text-neutral-900' : 'text-emerald-600'}`}>
                        {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="删除记录"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DailyExpenseAnalysis expenses={expenses} date={selectedDate} />
        </div>

        {/* Monthly Projection */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-3">本月预估支出总额</h4>
          <div className="flex justify-between items-end mb-2">
            <span className={`text-2xl font-bold ${stats.isOverspending ? 'text-rose-600' : 'text-neutral-900'}`}>
              {formatCurrency(stats.projectedTotal)}
            </span>
            <span className="text-xs text-neutral-400 mb-1">
              / {formatCurrency(stats.monthlyTotalBudget)}
            </span>
          </div>
          
          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full rounded-full ${stats.isOverspending ? 'bg-rose-500' : 'bg-neutral-800'}`}
              style={{ width: `${Math.min(100, (stats.projectedTotal / stats.monthlyTotalBudget) * 100)}%` }}
            />
          </div>

          <div className="flex flex-col space-y-2 mt-4">
            <div className="flex items-start p-3 rounded-xl bg-neutral-50/50 text-xs text-neutral-500">
              {stats.isOverspending ? (
                <>
                  <AlertCircle size={14} className="text-rose-500 mr-1.5 shrink-0 mt-0.5" />
                  <span>
                    本月预测支出将超 <strong className="text-rose-600">{formatCurrency(stats.projectedTotal - stats.monthlyTotalBudget)}</strong>。
                    (含 {stats.loggedDaysCount} 天实记，剩余按预算推算)
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500 mr-1.5 shrink-0 mt-0.5" />
                  <span>
                    开销控制得不错！预计本月在支出预算内。未记账日期自动使用预算推算。
                  </span>
                </>
              )}
            </div>
            
            {stats.extraIncomeTotal > 0 && (
              <div className="flex items-start p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                <TrendingUp size={14} className="mr-1.5 shrink-0 mt-0.5" />
                <span>
                  <strong>本月已赚取额外收入 {formatCurrency(stats.extraIncomeTotal)}</strong>！这笔钱已自动并入主控面板的月度现金流结余中，极大地增强了您的抗风险能力。
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

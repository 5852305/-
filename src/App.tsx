import { useState, useMemo, useEffect } from 'react';
import { Debt, UserSettings, DailyExpense } from './types';
import { calculateAmortization } from './lib/debtMath';
import { Dashboard } from './components/Dashboard';
import { FinancialAdvice } from './components/FinancialAdvice';
import { DebtList } from './components/DebtList';
import { Reminders } from './components/Reminders';
import { DailyExpenseTracker } from './components/DailyExpenseTracker';
import { PaymentCalendar } from './components/PaymentCalendar';
import { RepaymentGoalCard } from './components/RepaymentGoalCard';
import { AddDebtModal } from './components/AddDebtModal';
import { Login } from './components/Login';
import { Plus, Settings, LogOut, Loader2 } from 'lucide-react';

import { auth, db, signOut } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    monthlyIncome: 15000,
    monthlyLivingExpenses: 5000,
    dailyExpenseBudget: 166, // Default approx 5000/30
    targetDebtToIncomeRatio: 0.3,
  });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setDebts([]);
        setDailyExpenses([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const settingsRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        setDoc(settingsRef, settings);
      }
    }, (error) => {
      console.error("Settings snapshot error:", error);
    });

    const debtsRef = collection(db, 'debts');
    const q = query(debtsRef, where('userId', '==', user.uid));
    const unsubDebts = onSnapshot(q, (snapshot) => {
      const loadedDebts: Debt[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedDebts.push({
          id: docSnap.id,
          name: data.name,
          type: data.type as any,
          accountNumber: data.accountNumber,
          principal: data.principal,
          annualInterestRate: data.annualInterestRate,
          termMonths: data.termMonths,
          startDate: data.startDate,
          notes: data.notes,
          isDeferred: data.isDeferred,
          overdueDays: data.overdueDays,
        });
      });
      setDebts(loadedDebts);
      setLoading(false);
    }, (error) => {
      console.error("Debts snapshot error:", error);
      setLoading(false);
    });

    const expensesRef = collection(db, 'dailyExpenses');
    const startOfPeriod = new Date();
    startOfPeriod.setMonth(startOfPeriod.getMonth() - 3);
    startOfPeriod.setDate(1);
    startOfPeriod.setHours(0, 0, 0, 0);
    
    // We fetch recent 3 months' expenses for AI analysis and tracker
    const expQ = query(
      expensesRef, 
      where('userId', '==', user.uid),
      where('date', '>=', startOfPeriod.toISOString().split('T')[0])
    );
    const unsubExpenses = onSnapshot(expQ, (snapshot) => {
      const loadedExps: DailyExpense[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedExps.push({
          id: docSnap.id,
          userId: data.userId,
          date: data.date,
          type: data.type || 'expense',
          amount: data.amount,
          note: data.note,
          createdAt: data.createdAt,
        });
      });
      setDailyExpenses(loadedExps);
    }, (error) => {
      console.error("Expenses snapshot error:", error);
    });

    return () => {
      unsubSettings();
      unsubDebts();
      unsubExpenses();
    };
  }, [user]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (user) {
      setDoc(doc(db, 'users', user.uid), newSettings, { merge: true });
    }
  };

  // Compute schedules
  const debtsWithSchedule = useMemo(() => {
    return debts.map(calculateAmortization);
  }, [debts]);

  const handleAddDebt = async (debt: Debt) => {
    if (!user) return;
    const { id, ...debtData } = debt;
    
    // Remove undefined values to prevent Firebase errors
    const cleanData = Object.fromEntries(
      Object.entries(debtData).filter(([_, v]) => v !== undefined)
    );

    await addDoc(collection(db, 'debts'), {
      ...cleanData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'debts', id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400 mb-4" size={32} />
        <p className="text-neutral-500 font-medium">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 font-sans text-neutral-900 selection:bg-neutral-200">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">D</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">DebtFree</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
              title="设置"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={signOut}
              className="p-2 rounded-full transition-colors text-neutral-500 hover:text-red-600 hover:bg-red-50"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 bg-neutral-900 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 outline-none"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">添加负债</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {isSettingsOpen && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="mr-2 text-neutral-500" size={20}/> 财务缓冲设置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">每月总收入 (¥)</label>
                <p className="text-xs text-neutral-500 mb-3">用于计算您的可支配收入及还款加速策略。</p>
                <input 
                  type="number" 
                  value={settings.monthlyIncome}
                  onChange={(e) => handleUpdateSettings({ ...settings, monthlyIncome: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">每月固定生活开销 (¥)</label>
                <p className="text-xs text-neutral-500 mb-3">房租、水电等刚性支出，保障健康生活。</p>
                <input 
                  type="number" 
                  value={settings.monthlyLivingExpenses}
                  onChange={(e) => handleUpdateSettings({ ...settings, monthlyLivingExpenses: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">全局每日开销预算 (¥)</label>
                <p className="text-xs text-neutral-500 mb-3">每天的日常吃饭交通等预算，用于跟踪。</p>
                <input 
                  type="number" 
                  value={settings.dailyExpenseBudget || Math.round(settings.monthlyLivingExpenses / 30)}
                  onChange={(e) => handleUpdateSettings({ ...settings, dailyExpenseBudget: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-100">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="block text-sm font-medium text-neutral-900">还款目标提醒</span>
                  <span className="block text-xs text-neutral-500 mt-1">开启后，每月完成建议还款额时，在首页显示激励性的祝贺卡片。</span>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.enableRepaymentGoalReminder || false}
                    onChange={(e) => handleUpdateSettings({ ...settings, enableRepaymentGoalReminder: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Top Left Desktop, Priority 1 Mobile */}
          <div className="order-1 lg:order-none lg:col-span-2 space-y-8">
            <RepaymentGoalCard 
              debts={debtsWithSchedule.filter(d => !d.isDeferred)}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
            <Dashboard debts={debtsWithSchedule.filter(d => !d.isDeferred)} />
            <PaymentCalendar debts={debtsWithSchedule.filter(d => !d.isDeferred)} />
          </div>

          {/* Right Sidebar Desktop, Priority 2 Mobile */}
          <div className="order-2 lg:order-none lg:col-start-3 lg:row-span-2 space-y-8">
            <DailyExpenseTracker 
              expenses={dailyExpenses} 
              settings={settings}
              user={user}
            />
            <Reminders debts={debtsWithSchedule.filter(d => !d.isDeferred)} />
          </div>

          {/* Bottom Left Desktop, Priority 3 Mobile */}
          <div className="order-3 lg:order-none lg:col-span-2 lg:col-start-1 space-y-8">
            <FinancialAdvice 
              debts={debtsWithSchedule.filter(d => !d.isDeferred)} 
              settings={settings} 
              expenses={dailyExpenses}
            />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-neutral-900">负债明细</h2>
              </div>
              <DebtList debts={debtsWithSchedule} onDelete={handleDeleteDebt} />
            </div>
          </div>
        </div>
      </main>

      <AddDebtModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddDebt} 
      />
    </div>
  );
}

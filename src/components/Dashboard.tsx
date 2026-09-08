import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DebtWithSchedule } from '../types';
import { generateAggregateSchedule } from '../lib/debtMath';
import { formatCurrency } from '../lib/utils';
import { Wallet, CheckCircle2, CalendarCheck, Flag } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  debts: DebtWithSchedule[];
}

export function Dashboard({ debts }: DashboardProps) {
  // Helpers
  const getCurrentBalance = (d: DebtWithSchedule) => {
    if (d.remainingPeriods === d.termMonths) return d.principal; // Not started yet
    const passedPeriods = d.termMonths - d.remainingPeriods;
    const currentPeriod = d.schedule[Math.max(0, passedPeriods - 1)];
    return currentPeriod ? currentPeriod.remainingBalance : 0;
  };

  const totalPrincipal = debts.reduce((sum, d) => sum + d.principal, 0);
  const currentTotalDebt = debts.reduce((sum, d) => sum + getCurrentBalance(d), 0);
  const amountPaid = Math.max(0, totalPrincipal - currentTotalDebt);
  const progressPercent = totalPrincipal > 0 ? (amountPaid / totalPrincipal) * 100 : 0;

  // Find latest payoff date
  let latestDate = new Date();
  let hasValidDate = false;
  debts.forEach(d => {
    if (d.schedule.length > 0) {
      const lastPeriod = d.schedule[d.schedule.length - 1];
      const date = new Date(lastPeriod.date);
      if (date > latestDate) {
        latestDate = date;
        hasValidDate = true;
      }
    }
  });
  const payoffDateStr = hasValidDate && totalPrincipal > 0 ? format(latestDate, 'yyyy年 MM月') : '-';

  const chartData = generateAggregateSchedule(debts, 24);

  // Pie Chart Data
  const pieData = [
    { name: '信用卡', value: debts.filter(d => d.type === 'credit_card').reduce((sum, d) => sum + getCurrentBalance(d), 0), color: '#a855f7' },
    { name: '房贷', value: debts.filter(d => d.type === 'mortgage').reduce((sum, d) => sum + getCurrentBalance(d), 0), color: '#3b82f6' },
    { name: '车贷', value: debts.filter(d => d.type === 'car_loan').reduce((sum, d) => sum + getCurrentBalance(d), 0), color: '#10b981' },
    { name: '个人贷款', value: debts.filter(d => d.type === 'personal_loan').reduce((sum, d) => sum + getCurrentBalance(d), 0), color: '#f97316' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-neutral-500 mb-3">
            <Wallet size={18} />
            <span className="text-sm font-medium">总债务金额</span>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-neutral-900">{formatCurrency(totalPrincipal)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-emerald-600 mb-3">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">已还款金额</span>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-emerald-600">{formatCurrency(amountPaid)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-orange-600 mb-3">
            <Flag size={18} />
            <span className="text-sm font-medium">剩余债务金额</span>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-orange-600">{formatCurrency(currentTotalDebt)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-blue-600 mb-3">
            <CalendarCheck size={18} />
            <span className="text-sm font-medium">预计还清日期</span>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-blue-600">{payoffDateStr}</p>
        </div>
      </div>

      {/* Financial Freedom Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">距离财务自由进度</h3>
            <p className="text-sm text-neutral-500 mt-1">革命尚未成功，同志仍需努力</p>
          </div>
          <div className="text-2xl font-bold text-emerald-500">{progressPercent.toFixed(1)}%</div>
        </div>
        <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">财务压力趋势 (未来24个月)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} tickFormatter={(value) => `¥${(value/10000).toFixed(0)}w`} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), '预计余额']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">剩余债务构成</h3>
          {pieData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-neutral-400 text-sm">
              暂无债务数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { ShieldCheck, CalendarClock } from 'lucide-react';
import { DebtWithSchedule } from '../types';
import { differenceInDays } from 'date-fns';
import { formatCurrency } from '../lib/utils';

export function Reminders({ debts }: { debts: DebtWithSchedule[] }) {
  const today = new Date();
  
  // Find upcoming payments within the next 14 days
  const upcomingPayments = debts.flatMap(debt => {
    return debt.schedule.map(period => {
      const paymentDate = new Date(period.date);
      const daysUntil = differenceInDays(paymentDate, today);
      return {
        ...period,
        debtName: debt.name,
        daysUntil,
      };
    }).filter(p => p.daysUntil >= 0 && p.daysUntil <= 14);
  }).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3); // top 3

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">智能提醒</h3>
      </div>
      
      <div className="divide-y divide-neutral-50">
        {/* Security Reminder */}
        <div className="p-5 flex items-start space-x-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-neutral-900">账户安全建议</h4>
            <p className="text-sm text-neutral-500 mt-1">建议开启主要还款银行卡的异常交易提醒及两步验证，防止资金被盗刷导致逾期。</p>
          </div>
        </div>

        {/* Payment Reminders */}
        {upcomingPayments.length === 0 ? (
          <div className="p-5 flex items-start space-x-4">
             <div className="p-2.5 bg-neutral-50 text-neutral-400 rounded-xl mt-0.5">
               <CalendarClock size={20} />
             </div>
             <div>
               <h4 className="text-sm font-medium text-neutral-900">近期无还款压力</h4>
               <p className="text-sm text-neutral-500 mt-1">未来 14 天内没有需要还款的账单，继续保持财务缓冲计划！</p>
             </div>
          </div>
        ) : (
          upcomingPayments.map((payment, idx) => (
            <div key={idx} className="p-5 flex items-start space-x-4">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl mt-0.5">
                <CalendarClock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-neutral-900">{payment.debtName} - 第 {payment.period} 期</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-md">
                    {payment.daysUntil === 0 ? '今天到期' : `${payment.daysUntil} 天后`}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  自动还款提醒：需在 {payment.date} 前保证账户有 <span className="font-medium text-neutral-800">{formatCurrency(payment.payment)}</span> 余额。
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

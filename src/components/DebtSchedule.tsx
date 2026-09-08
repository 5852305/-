import { DebtWithSchedule } from '../types';
import { formatCurrency } from '../lib/utils';
import { isPast } from 'date-fns';
import { cn } from '../lib/utils';

interface DebtScheduleProps {
  debt: DebtWithSchedule;
}

export function DebtSchedule({ debt }: DebtScheduleProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200 sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">期数</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">还款日</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">应还金额</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right hidden sm:table-cell whitespace-nowrap">本金</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right hidden sm:table-cell whitespace-nowrap">利息</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">剩余余额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {debt.schedule.map((period) => {
              const past = isPast(new Date(period.date));
              return (
                <tr key={period.period} className={cn("bg-white transition-colors hover:bg-neutral-50/50", past && "opacity-50 bg-neutral-50")}>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-neutral-900 whitespace-nowrap">{period.period} / {debt.termMonths}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-neutral-500 whitespace-nowrap">{period.date}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-neutral-900 whitespace-nowrap">{formatCurrency(period.payment)}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-neutral-500 hidden sm:table-cell whitespace-nowrap">{formatCurrency(period.principalPayment)}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-neutral-500 hidden sm:table-cell whitespace-nowrap">{formatCurrency(period.interestPayment)}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-neutral-900 font-medium whitespace-nowrap">{formatCurrency(period.remainingBalance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { DebtWithSchedule } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  addDays, 
  addMonths, 
  subMonths, 
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface PaymentCalendarProps {
  debts: DebtWithSchedule[];
}

export function PaymentCalendar({ debts }: PaymentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{date: Date, payments: any[]} | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  // Flatten payments
  const allPayments = debts.flatMap(debt => {
    return debt.schedule.map(period => ({
      ...period,
      debtName: debt.name,
    }));
  });

  const getPaymentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allPayments.filter(p => p.date === dateStr);
  };

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center space-x-2">
          <CalendarIcon size={18} className="text-neutral-500" />
          <h3 className="font-semibold text-neutral-900">月度还款日历</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={goToToday} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 mr-1 md:mr-2">今天</button>
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-neutral-50 transition-colors text-neutral-600">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 md:px-3 text-sm font-medium text-neutral-900 min-w-[4rem] md:min-w-[5rem] text-center">
              {format(currentDate, 'yyyy年M月')}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-neutral-50 transition-colors text-neutral-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-5">
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(wd => (
            <div key={wd} className="text-center text-xs font-medium text-neutral-400 py-1">
              {wd}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((d, idx) => {
            const isSameMonthDate = isSameMonth(d, monthStart);
            const isTodayDate = isToday(d);
            const dayPayments = getPaymentsForDate(d);
            const hasPayments = dayPayments.length > 0;

            return (
              <div 
                key={idx} 
                onClick={() => hasPayments && isSameMonthDate && setSelectedDay({date: d, payments: dayPayments})}
                className={`min-h-[4.5rem] md:min-h-[6rem] p-1 md:p-2 rounded-lg md:rounded-xl border flex flex-col transition-all overflow-hidden min-w-0
                  ${!isSameMonthDate ? 'bg-neutral-50/30 border-transparent text-neutral-300' : 'bg-white border-neutral-100'}
                  ${isTodayDate ? 'ring-2 ring-neutral-900 border-transparent' : ''}
                  ${hasPayments && isSameMonthDate ? 'hover:border-orange-200 hover:bg-orange-50/30 cursor-pointer' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-0.5 md:mb-1">
                  <span className={`text-[10px] sm:text-xs md:text-sm font-medium inline-flex items-center justify-center ${isTodayDate ? 'bg-neutral-900 text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full' : (hasPayments && isSameMonthDate ? 'text-neutral-900' : '')}`}>
                    {format(d, 'd')}
                  </span>
                </div>
                
                {hasPayments && isSameMonthDate && (
                  <div className="mt-auto pt-0.5 flex flex-col gap-0.5 md:gap-1 min-w-0 w-full">
                    {dayPayments.slice(0, 2).map((p, i) => {
                      const amount = Number(p.payment) || 0;
                      return (
                        <div key={i} className="text-[8px] sm:text-[9px] md:text-[10px] leading-none md:leading-tight px-0.5 sm:px-1 md:px-1.5 py-0.5 md:py-1 bg-orange-50 text-orange-700 rounded w-full flex flex-col lg:flex-row justify-between items-start lg:items-center overflow-hidden" title={`${p.debtName} - ${formatCurrency(amount)}`}>
                          <span className="truncate w-full lg:w-auto lg:mr-1 mb-0.5 lg:mb-0 max-w-full text-[8px] sm:text-[9px] md:text-[10px]">{p.debtName}</span>
                          <span className="font-semibold shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">{formatCurrency(amount)}</span>
                        </div>
                      );
                    })}
                    {dayPayments.length > 2 && (
                      <div className="text-[8px] sm:text-[9px] md:text-[10px] text-neutral-400 px-0.5">
                        +{dayPayments.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">{format(selectedDay.date, 'yyyy年M月d日')} 还款明细</h3>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDay.payments.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-orange-100 bg-orange-50/30 rounded-xl">
                  <span className="font-medium text-neutral-900">{p.debtName}</span>
                  <span className="font-bold text-orange-600">{formatCurrency(Number(p.payment) || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

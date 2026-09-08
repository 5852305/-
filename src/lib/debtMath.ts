import { addMonths, format, differenceInMonths, isPast, isFuture } from 'date-fns';
import { Debt, AmortizationPeriod, DebtWithSchedule } from '../types';

export function calculateAnnualInterestRate(principal: number, termMonths: number, monthlyPayment: number): number {
  if (!principal || !termMonths || !monthlyPayment) return 0;
  if (monthlyPayment * termMonths <= principal) return 0; // Invalid or 0% interest

  let rMin = 0;
  let rMax = 1.0; // Extremely high upper bound for monthly rate
  let r = 0;

  // Bisection method to find the root of the amortization equation
  for (let i = 0; i < 50; i++) {
    r = (rMin + rMax) / 2;
    const mCalc = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    if (mCalc > monthlyPayment) {
      rMax = r;
    } else {
      rMin = r;
    }
  }

  // Convert monthly decimal rate to annual percentage rate
  return Number((r * 12 * 100).toFixed(4));
}

export function calculateAmortization(debt: Debt): DebtWithSchedule {
  const schedule: AmortizationPeriod[] = [];
  const r = debt.annualInterestRate / 100 / 12;
  const n = debt.termMonths;
  let p = debt.principal;

  // Monthly payment calculation
  const monthlyPayment = r === 0 
    ? p / n 
    : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
  let totalInterest = 0;
  const start = new Date(debt.startDate);

  for (let i = 1; i <= n; i++) {
    const interestPayment = p * r;
    const principalPayment = monthlyPayment - interestPayment;
    
    p -= principalPayment;
    // Handle tiny floating point inaccuracies at the end of the loan
    if (p < 0.01) p = 0;
    
    totalInterest += interestPayment;

    schedule.push({
      period: i,
      date: format(addMonths(start, i), 'yyyy-MM-dd'),
      payment: monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance: p,
    });
  }

  // Calculate remaining periods based on today
  const today = new Date();
  const passedMonths = Math.max(0, differenceInMonths(today, start));
  const remainingPeriods = Math.max(0, n - passedMonths);

  return {
    ...debt,
    schedule,
    monthlyPayment,
    totalInterest,
    totalPayment: debt.principal + totalInterest,
    remainingPeriods,
  };
}

export function generateAggregateSchedule(debts: DebtWithSchedule[], monthsToProject: number = 24) {
  const aggregate: Record<string, number> = {};
  
  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  for (let i = 0; i < monthsToProject; i++) {
    const projectDate = addMonths(startMonth, i);
    const dateKey = format(projectDate, 'yyyy-MM');
    aggregate[dateKey] = 0;
  }

  debts.forEach(debt => {
    debt.schedule.forEach(period => {
      const pDate = new Date(period.date);
      // Only project for the future
      if (!isPast(pDate) || format(pDate, 'yyyy-MM') === format(today, 'yyyy-MM')) {
        const dateKey = format(pDate, 'yyyy-MM');
        if (aggregate[dateKey] !== undefined) {
          aggregate[dateKey] += period.remainingBalance;
        }
      }
    });
  });

  return Object.keys(aggregate).sort().map(date => ({
    date,
    balance: aggregate[date]
  }));
}

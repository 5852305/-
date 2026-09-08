export type DebtType = 'credit_card' | 'mortgage' | 'personal_loan' | 'car_loan' | 'online_loan';

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  accountNumber?: string;
  principal: number;
  annualInterestRate: number;
  termMonths: number;
  startDate: string; // ISO Date string (YYYY-MM-DD)
  notes?: string;
  isDeferred?: boolean; // Used for un-installment online loans that are paid later
  overdueDays?: number; // Used for online loans
}

export interface AmortizationPeriod {
  period: number;
  date: string;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}

export interface DebtWithSchedule extends Debt {
  schedule: AmortizationPeriod[];
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  remainingPeriods: number;
}

export interface UserSettings {
  monthlyIncome: number;
  monthlyLivingExpenses: number;
  dailyExpenseBudget?: number; // Global daily expense budget
  targetDebtToIncomeRatio: number; // e.g., 0.3 for 30%
  enableRepaymentGoalReminder?: boolean;
  lastCompletedRepaymentMonth?: string; // YYYY-MM
}

export interface DailyExpense {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type?: 'expense' | 'income';
  amount: number;
  note?: string;
  createdAt: string;
}

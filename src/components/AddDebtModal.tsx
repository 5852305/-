import { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Debt, DebtType } from '../types';
import { calculateAnnualInterestRate } from '../lib/debtMath';
import { formatCurrency } from '../lib/utils';
import { X, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (debt: Debt) => void;
}

export function AddDebtModal({ isOpen, onClose, onAdd }: AddDebtModalProps) {
  const [formData, setFormData] = useState<Partial<Debt> & { monthlyPayment?: number }>({
    type: 'credit_card',
    startDate: new Date().toISOString().split('T')[0],
    overdueDays: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ type: 'credit_card', startDate: new Date().toISOString().split('T')[0], overdueDays: 0 });
    }
  }, [isOpen]);

  const isOnlineLoan = formData.type === 'online_loan';

  // Auto-calculate interest rate and total repayment
  const calculatedStats = useMemo(() => {
    if (isOnlineLoan) return null; // Not needed for online loan
    const p = Number(formData.principal) || 0;
    const n = Number(formData.termMonths) || 0;
    const m = Number(formData.monthlyPayment) || 0;
    
    if (p > 0 && n > 0 && m > 0) {
      const rate = calculateAnnualInterestRate(p, n, m);
      return {
        rate,
        total: Math.max(p, m * n),
        interest: Math.max(0, (m * n) - p),
        isWarning: m * n < p - 1 // Warning if payment is too low (allowing 1 unit float error)
      };
    }
    return null;
  }, [formData.principal, formData.termMonths, formData.monthlyPayment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.principal || !formData.startDate) return;
    
    if (isOnlineLoan) {
      onAdd({
        id: uuidv4(),
        name: formData.name,
        type: formData.type as DebtType,
        accountNumber: formData.accountNumber,
        principal: Number(formData.principal),
        annualInterestRate: 0,
        termMonths: 1, // Treat as a 1-month balloon payment
        startDate: formData.startDate,
        notes: formData.notes,
        isDeferred: true, // Mark it as deferred/low priority
        overdueDays: Number(formData.overdueDays) || 0,
      });
      onClose();
      return;
    }

    if (!formData.termMonths || !formData.monthlyPayment) return;
    if (!calculatedStats) return;

    onAdd({
      id: uuidv4(),
      name: formData.name,
      type: formData.type as DebtType,
      accountNumber: formData.accountNumber,
      principal: Number(formData.principal),
      annualInterestRate: calculatedStats.rate,
      termMonths: Number(formData.termMonths),
      startDate: formData.startDate,
      notes: formData.notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-neutral-900">添加负债记录</h2>
            <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">负债名称</label>
                <input required type="text" placeholder="例如：招商银行" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">账号/卡号 (选填)</label>
                <input type="text" placeholder="例如：尾号 8888" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  value={formData.accountNumber || ''} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">负债类型</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as DebtType})}
                >
                  <option value="credit_card">信用卡</option>
                  <option value="personal_loan">个人贷款</option>
                  <option value="car_loan">车贷</option>
                  <option value="mortgage">房贷</option>
                  <option value="online_loan">未分期网贷 (延后处理)</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">开始还款日期</label>
                <input required type="date" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  value={formData.startDate || ''} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
            </div>

            {!isOnlineLoan ? (
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                <h3 className="text-sm font-semibold flex items-center text-neutral-700">
                  <Calculator size={16} className="mr-2" />
                  资金与利息计算器
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">本金总额 (¥)</label>
                    <input required type="number" min="0" step="0.01" placeholder="10000" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                      value={formData.principal || ''} onChange={(e) => setFormData({...formData, principal: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">还款期数 (月)</label>
                    <input required type="number" min="1" step="1" placeholder="12" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                      value={formData.termMonths || ''} onChange={(e) => setFormData({...formData, termMonths: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">每月还款金额 (¥)</label>
                    <input required type="number" min="0" step="0.01" placeholder="888.88" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                      value={formData.monthlyPayment || ''} onChange={(e) => setFormData({...formData, monthlyPayment: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                {/* Calculated Results Block */}
                <div className="pt-3 border-t border-neutral-200 flex flex-wrap gap-4 text-sm">
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-neutral-500 block mb-0.5">自动推算年利率</span>
                    <span className="font-semibold text-neutral-900 text-lg">
                      {calculatedStats ? `${calculatedStats.rate}%` : '--'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-neutral-500 block mb-0.5">总还款额</span>
                    <span className="font-semibold text-neutral-900 text-lg">
                      {calculatedStats ? formatCurrency(calculatedStats.total) : '--'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-neutral-500 block mb-0.5">预估总利息</span>
                    <span className="font-semibold text-orange-600 text-lg">
                      {calculatedStats ? formatCurrency(calculatedStats.interest) : '--'}
                    </span>
                  </div>
                </div>
                
                {calculatedStats?.isWarning && (
                  <div className="pt-2 text-rose-500 text-xs">
                    提示：填写的每月还款额偏低，系统将按 0% 利率为您计算，并微调期末总额。
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-4">
                <div className="text-sm text-orange-700 mb-2">
                  提示：未分期的网贷将被标记为“延后处理”，不会计入当前的财务压力图表。当您还清高优债务（如信用卡）后，可随时关注此笔欠款。
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">欠款总额 (¥)</label>
                    <input required type="number" min="0" step="0.01" placeholder="10000" className="w-full px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-900 bg-white"
                      value={formData.principal || ''} onChange={(e) => setFormData({...formData, principal: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">逾期天数 (天)</label>
                    <input type="number" min="0" step="1" placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-900 bg-white"
                      value={formData.overdueDays || ''} onChange={(e) => setFormData({...formData, overdueDays: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">备注说明 (选填)</label>
              <textarea placeholder="例如：这笔贷款用于装修新房..." rows={2} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="pt-2 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors">
                取消
              </button>
              <button type="submit" disabled={!isOnlineLoan && !calculatedStats} className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                保存记录
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

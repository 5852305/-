import { useState, useMemo } from 'react';
import { DailyExpense } from '../types';
import { Sparkles, Loader2, AlertCircle, Calendar } from 'lucide-react';
import Markdown from 'react-markdown';
import { format, subDays, subMonths } from 'date-fns';

interface Props {
  expenses: DailyExpense[];
  date: string; // The currently selected date in the tracker (usually today)
}

type TimeRange = 'today' | 'week' | 'month' | '3months';

export function DailyExpenseAnalysis({ expenses, date }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const recordsToAnalyze = useMemo(() => {
    const today = new Date();
    
    switch (timeRange) {
      case 'today':
        return expenses.filter(e => e.date === date);
      case 'week': {
        const weekAgo = format(subDays(today, 7), 'yyyy-MM-dd');
        return expenses.filter(e => e.date >= weekAgo && e.date <= format(today, 'yyyy-MM-dd'));
      }
      case 'month': {
        const monthAgo = format(subMonths(today, 1), 'yyyy-MM-dd');
        return expenses.filter(e => e.date >= monthAgo && e.date <= format(today, 'yyyy-MM-dd'));
      }
      case '3months': {
        const threeMonthsAgo = format(subMonths(today, 3), 'yyyy-MM-dd');
        return expenses.filter(e => e.date >= threeMonthsAgo && e.date <= format(today, 'yyyy-MM-dd'));
      }
      default:
        return expenses.filter(e => e.date === date);
    }
  }, [expenses, date, timeRange]);

  const handleAnalyze = async () => {
    if (recordsToAnalyze.length === 0) {
      setError('该时间段内没有记账记录可供分析哦~');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expenses: recordsToAnalyze,
          timeRangeLabel: timeRange === 'today' ? '今日' :
                          timeRange === 'week' ? '近1周' :
                          timeRange === 'month' ? '近1个月' : '近3个月'
        }),
      });

      if (!response.ok) {
        throw new Error('API 请求失败');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      <div className="flex flex-col mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center">
              <Sparkles size={16} className="text-purple-500 mr-1.5" />
              AI 消费分析
            </h4>
            <p className="text-xs text-neutral-500 mt-1">智能评估消费习惯，寻找可优化的开支</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || recordsToAnalyze.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                分析中...
              </>
            ) : (
              '一键分析'
            )}
          </button>
        </div>

        <div className="flex bg-neutral-100/80 rounded-lg p-1 border border-neutral-200 w-full">
          {(['today', 'week', 'month', '3months'] as TimeRange[]).map((range) => {
            const labels: Record<TimeRange, string> = {
              today: '当天',
              week: '近1周',
              month: '近1月',
              '3months': '近3月',
            };
            return (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setAnalysis(null); // Reset analysis on range change
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range ? 'bg-white text-purple-700 shadow-sm border border-black/5' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start p-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-sm text-neutral-700">
          <div className="markdown-body">
            <Markdown>{analysis}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

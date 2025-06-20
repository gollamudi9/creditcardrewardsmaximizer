import { useState, useCallback, useEffect } from 'react';
import { AnalyticsService } from '@/lib/services/analyticsService';
import { apiClient } from '@/lib/api/base';
import { useAuthContext } from '@/context/AuthContext';
import { useNotifications } from './useNotifications';
import { supabase } from '@/lib/supabase';
import {
  ForecastData,
  ForecastPeriod,
  AdhocExpense,
  SpendingTrend,
  BudgetVariance,
  FinancialHealthIndicator,
  CashFlowProjection,
  AnalyticsAlert,
  CustomDateRange,
} from '@/types/analytics';

export function useAnalytics() {
  const { user } = useAuthContext();
  const { showError, showSuccess } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forecast State
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [forecastAccuracy, setForecastAccuracy] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ForecastPeriod['period']>(12);

  // Adhoc Expenses State
  const [adhocExpenses, setAdhocExpenses] = useState<AdhocExpense[]>([]);

  // Analytics State
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [budgetVariances, setBudgetVariances] = useState<BudgetVariance[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthIndicator[]>([]);
  const [cashFlowProjections, setCashFlowProjections] = useState<CashFlowProjection[]>([]);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);

  const analyticsService = new AnalyticsService(apiClient);

  // Initialize API client with auth token
  useEffect(() => {
    const initializeAuth = async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            apiClient.setAuthToken(session.access_token);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      }
    };
    initializeAuth();
  }, [user]);

  // Mock data generators for demo purposes
  const generateMockForecast = (period: number): ForecastData[] => {
    const months = [];
    const baseIncome = 5000;
    const baseExpenses = 3500;
    
    for (let i = 0; i < period; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      const seasonalFactor = 1 + (Math.sin((i * Math.PI) / 6) * 0.1);
      const projectedIncome = baseIncome * seasonalFactor + (Math.random() - 0.5) * 200;
      const projectedExpenses = baseExpenses * seasonalFactor + (Math.random() - 0.5) * 150;
      const netIncome = projectedIncome - projectedExpenses;
      
      months.push({
        month: monthName,
        projectedIncome,
        projectedExpenses,
        netIncome,
        confidenceInterval: {
          lower: netIncome * 0.85,
          upper: netIncome * 1.15,
        },
        seasonalFactor,
      });
    }
    
    return months;
  };

  const generateMockSpendingTrends = (): SpendingTrend[] => {
    const categories = ['Dining', 'Travel', 'Groceries', 'Gas', 'Entertainment', 'Shopping'];
    return categories.map(category => ({
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      amount: Math.random() * 1000 + 200,
      category,
      percentChange: (Math.random() - 0.5) * 40,
    }));
  };

  const generateMockBudgetVariances = (): BudgetVariance[] => {
    const categories = ['Dining', 'Travel', 'Groceries', 'Gas', 'Entertainment'];
    return categories.map(category => {
      const budgeted = Math.random() * 800 + 200;
      const actual = budgeted + (Math.random() - 0.5) * 300;
      const variance = actual - budgeted;
      return {
        category,
        budgeted,
        actual,
        variance,
        percentVariance: (variance / budgeted) * 100,
      };
    });
  };

  const generateMockFinancialHealth = (): FinancialHealthIndicator[] => {
    return [
      {
        name: 'Credit Utilization',
        value: 25,
        status: 'good',
        description: 'Percentage of credit limit used',
        trend: 'down',
      },
      {
        name: 'Savings Rate',
        value: 20,
        status: 'excellent',
        description: 'Percentage of income saved',
        trend: 'up',
      },
      {
        name: 'Debt-to-Income',
        value: 15,
        status: 'good',
        description: 'Monthly debt payments vs income',
        trend: 'stable',
      },
    ];
  };

  const generateMockCashFlow = (months: number): CashFlowProjection[] => {
    const projections = [];
    let cumulativeBalance = 5000;
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      const inflow = 5000 + (Math.random() - 0.5) * 500;
      const outflow = 3500 + (Math.random() - 0.5) * 400;
      const netFlow = inflow - outflow;
      cumulativeBalance += netFlow;
      
      projections.push({
        date: date.toISOString(),
        inflow,
        outflow,
        netFlow,
        cumulativeBalance,
      });
    }
    
    return projections;
  };

  const generateMockAlerts = (): AnalyticsAlert[] => {
    return [
      {
        id: '1',
        type: 'spending_pattern',
        severity: 'medium',
        title: 'Increased Dining Spending',
        message: 'Your dining expenses have increased by 25% this month compared to last month.',
        date: new Date().toISOString(),
        isRead: false,
        actionRequired: false,
      },
      {
        id: '2',
        type: 'budget_overrun',
        severity: 'high',
        title: 'Entertainment Budget Exceeded',
        message: 'You have exceeded your entertainment budget by $150 this month.',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        actionRequired: true,
      },
    ];
  };

  // Forecasting Methods
  const generateForecast = useCallback(async (
    period: ForecastPeriod['period'],
    options?: {
      includeAdhocExpenses?: boolean;
      manualAdjustments?: {
        incomeMultiplier?: number;
        expenseMultiplier?: number;
        seasonalAdjustment?: number;
      };
    }
  ) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockForecast = generateMockForecast(period);
      setForecast(mockForecast);
      setForecastAccuracy(0.85 + Math.random() * 0.1); // 85-95% accuracy
      setSelectedPeriod(period);

      showSuccess('Forecast Updated', `Generated ${period}-month financial forecast`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate forecast';
      setError(errorMessage);
      showError('Forecast Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, showError, showSuccess]);

  const updateForecastVariables = useCallback(async (adjustments: {
    incomeMultiplier?: number;
    expenseMultiplier?: number;
    seasonalAdjustment?: number;
  }) => {
    if (!user) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Regenerate forecast with new variables
      await generateForecast(selectedPeriod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update forecast variables';
      showError('Update Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError]);

  // Adhoc Expense Methods
  const addAdhocExpense = useCallback(async (expense: Omit<AdhocExpense, 'id'>) => {
    if (!user) return;

    try {
      const newExpense: AdhocExpense = {
        ...expense,
        id: Date.now().toString(),
      };
      
      setAdhocExpenses(prev => [...prev, newExpense]);
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Added', 'Adhoc expense added successfully');
      return newExpense.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
      showError('Add Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const updateAdhocExpense = useCallback(async (id: string, expense: Partial<AdhocExpense>) => {
    if (!user) return;

    try {
      setAdhocExpenses(prev => prev.map(exp => 
        exp.id === id ? { ...exp, ...expense } : exp
      ));
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Updated', 'Adhoc expense updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      showError('Update Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const deleteAdhocExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setAdhocExpenses(prev => prev.filter(exp => exp.id !== id));
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Deleted', 'Adhoc expense removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      showError('Delete Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const fetchAdhocExpenses = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demo
      setAdhocExpenses([]);
    } catch (err) {
      console.error('Failed to fetch adhoc expenses:', err);
    }
  }, [user]);

  // Analytics Methods
  const fetchSpendingTrends = useCallback(async (filters: {
    dateRange: CustomDateRange;
    categories?: string[];
  }) => {
    if (!user) return;

    try {
      const mockTrends = generateMockSpendingTrends();
      setSpendingTrends(mockTrends);
    } catch (err) {
      console.error('Failed to fetch spending trends:', err);
    }
  }, [user]);

  const fetchBudgetVariance = useCallback(async (filters: {
    dateRange: CustomDateRange;
  }) => {
    if (!user) return;

    try {
      const mockVariances = generateMockBudgetVariances();
      setBudgetVariances(mockVariances);
    } catch (err) {
      console.error('Failed to fetch budget variance:', err);
    }
  }, [user]);

  const fetchFinancialHealth = useCallback(async () => {
    if (!user) return;

    try {
      const mockHealth = generateMockFinancialHealth();
      setFinancialHealth(mockHealth);
    } catch (err) {
      console.error('Failed to fetch financial health:', err);
    }
  }, [user]);

  const fetchCashFlowProjection = useCallback(async (months: number = 12) => {
    if (!user) return;

    try {
      const mockCashFlow = generateMockCashFlow(months);
      setCashFlowProjections(mockCashFlow);
    } catch (err) {
      console.error('Failed to fetch cash flow projection:', err);
    }
  }, [user]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const mockAlerts = generateMockAlerts();
      setAlerts(mockAlerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [user]);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, []);

  // Export Methods
  const exportReport = useCallback(async (options: {
    format: 'pdf' | 'excel' | 'csv';
    dateRange: CustomDateRange;
    includeCharts?: boolean;
    includeForecasts?: boolean;
  }) => {
    if (!user) return;

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccess('Export Ready', 'Your report is ready for download');
      return 'https://example.com/download/report.pdf';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      showError('Export Error', errorMessage);
    }
  }, [user, showError, showSuccess]);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      const initializeData = async () => {
        try {
          await Promise.all([
            generateForecast(12),
            fetchAdhocExpenses(),
            fetchFinancialHealth(),
            fetchCashFlowProjection(),
            fetchAlerts(),
          ]);
        } catch (error) {
          console.error('Failed to initialize analytics data:', error);
        }
      };

      initializeData();
    }
  }, [user]);

  return {
    // State
    loading,
    error,
    forecast,
    forecastAccuracy,
    selectedPeriod,
    adhocExpenses,
    spendingTrends,
    budgetVariances,
    financialHealth,
    cashFlowProjections,
    alerts,

    // Forecasting Methods
    generateForecast,
    updateForecastVariables,

    // Adhoc Expense Methods
    addAdhocExpense,
    updateAdhocExpense,
    deleteAdhocExpense,
    fetchAdhocExpenses,

    // Analytics Methods
    fetchSpendingTrends,
    fetchBudgetVariance,
    fetchFinancialHealth,
    fetchCashFlowProjection,
    fetchAlerts,
    markAlertAsRead,
    dismissAlert,

    // Export Methods
    exportReport,

    // Utility
    clearError: () => setError(null),
  };
}
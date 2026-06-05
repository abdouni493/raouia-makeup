import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, CheckCircle2, AlertCircle, Users, ShoppingBag, Wallet, Loader, DollarSign, BarChart3, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import * as DataService from '../lib/dataService';

// ============================================================================
// ENHANCED REPORTS COMPONENT
// ============================================================================

const ReportsEnhanced: React.FC = () => {
  // ========== STATE MANAGEMENT ==========
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<'purchases' | 'workers' | 'store' | 'debts' | null>(null);

  const formatCurrencyDisplay = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount).replace('DZD', 'DA');
  }, []);

  // ========== DATA FETCHING ==========
  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!dateRange.from || !dateRange.to) {
        setError('Veuillez sélectionner les deux dates');
        setIsLoading(false);
        return;
      }

      if (new Date(dateRange.from) > new Date(dateRange.to)) {
        setError('La date de début doit être antérieure à la date de fin');
        setIsLoading(false);
        return;
      }

      const startDate = new Date(dateRange.from).toISOString();
      const endDate = new Date(new Date(dateRange.to).getTime() + 86400000).toISOString();

      // Fetch all data in parallel
      const [reservationsRes, purchasesRes, expensesRes, paymentsRes, profilesRes] = await Promise.all([
        supabase
          .from('reservations')
          .select('id, client_name, date, total_price, paid_amount, status, prestation_id')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('purchases')
          .select('id, description, cost, paid_amount, date, supplier_id, suppliers(full_name)')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('expenses')
          .select('id, name, description, cost, date')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('employee_payments')
          .select('id, employee_id, amount, type, description, date, profiles(full_name)')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .limit(500),
      ]);

      const reservations = reservationsRes.data || [];
      const purchases = purchasesRes.data || [];
      const storeExpenses = expensesRes.data || [];
      const employeePayments = paymentsRes.data || [];
      const profiles = profilesRes.data || [];

      // Calculate completed reservations
      const completedReservations = reservations.filter((r: any) => r.status === 'completed' || r.status === 'finalized');

      // REVENUE CALCULATIONS
      const totalRevenue = completedReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.total_price) || 0), 0);
      const totalCollected = completedReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.paid_amount) || 0), 0);
      const totalPending = totalRevenue - totalCollected;

      // EXPENSE CALCULATIONS
      // 1. Employee payments breakdown
      const salaryPayments = employeePayments
        .filter((p: any) => p.type === 'salary')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const acomptePayments = employeePayments
        .filter((p: any) => p.type === 'acompte')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const absencePayments = employeePayments
        .filter((p: any) => p.type === 'absence')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const totalWorkerExpenses = salaryPayments + acomptePayments + absencePayments;

      // 2. Purchase expenses
      const purchaseTotal = purchases.reduce((sum: number, p: any) => sum + (parseFloat(p.cost) || 0), 0);

      // 3. Store expenses
      const storeExpensesTotal = storeExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.cost) || 0), 0);

      // 4. Total expenses
      const totalExpenses = totalWorkerExpenses + purchaseTotal + storeExpensesTotal;

      // PROFIT CALCULATIONS
      const netProfit = totalCollected - totalExpenses;
      const profitMargin = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0;
      const expenseRatio = totalCollected > 0 ? (totalExpenses / totalCollected) * 100 : 0;

      // CLIENT DETAILS
      const clientDebts = completedReservations
        .map((r: any) => ({
          clientName: r.client_name,
          total: parseFloat(r.total_price) || 0,
          paid: parseFloat(r.paid_amount) || 0,
          pending: (parseFloat(r.total_price) || 0) - (parseFloat(r.paid_amount) || 0),
        }))
        .filter((c: any) => c.pending > 0)
        .sort((a: any, b: any) => b.pending - a.pending);

      // PAYMENT DETAILS
      const paymentDetails = employeePayments.map((p: any) => ({
        id: p.id,
        employeeName: p.profiles?.full_name || 'Unknown',
        amount: parseFloat(p.amount) || 0,
        type: p.type,
        description: p.description,
        date: p.date,
      }));

      // PURCHASE DETAILS
      const purchaseDetails = purchases.map((p: any) => ({
        id: p.id,
        description: p.description,
        cost: parseFloat(p.cost) || 0,
        paid: parseFloat(p.paid_amount) || 0,
        pending: (parseFloat(p.cost) || 0) - (parseFloat(p.paid_amount) || 0),
        date: p.date,
        supplier: p.suppliers?.full_name || 'Unknown',
      }));

      // STORE EXPENSE DETAILS
      const storeExpenseDetails = storeExpenses.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        cost: parseFloat(e.cost) || 0,
        date: e.date,
      }));

      const reportPayload = {
        period: { from: dateRange.from, to: dateRange.to },
        reservations: {
          total: reservations.length,
          completed: completedReservations.length,
          pending: reservations.filter((r: any) => r.status === 'pending').length,
          cancelled: reservations.filter((r: any) => r.status === 'cancelled').length,
        },
        revenue: {
          total: totalRevenue,
          collected: totalCollected,
          pending: totalPending,
          collectionRate: totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
        },
        expenses: {
          workers: totalWorkerExpenses,
          salaries: salaryPayments,
          acompte: acomptePayments,
          absence: absencePayments,
          purchases: purchaseTotal,
          store: storeExpensesTotal,
          total: totalExpenses,
          ratio: expenseRatio,
        },
        profit: {
          net: netProfit,
          margin: profitMargin,
          status: netProfit >= 0 ? 'positive' : 'negative',
        },
        details: {
          clientDebts,
          paymentDetails,
          purchaseDetails,
          storeExpenseDetails,
        },
        stats: {
          avgTicket: completedReservations.length > 0 ? totalRevenue / completedReservations.length : 0,
          uniqueClients: new Set(completedReservations.map((r: any) => r.client_name)).size,
        },
      };

      setReportData(reportPayload);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Erreur lors de la génération du rapport. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // ========== RENDER ==========
  return (
    <div className="space-y-8 pb-20">
      {/* Header & Date Selection */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600 mt-2">Analyse détaillée de votre activité sur la période sélectionnée</p>
        </div>

        {/* Date Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            <button
              onClick={generateReport}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Générer
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-600">Revenus Totaux</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-green-700 mb-2">{formatCurrencyDisplay(reportData.revenue.total)}</h3>
              <p className="text-xs text-gray-500">{reportData.reservations.completed} prestations finalisées</p>
            </motion.div>

            {/* Collected */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-600">Collecté</p>
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-blue-700 mb-2">{formatCurrencyDisplay(reportData.revenue.collected)}</h3>
              <p className="text-xs text-gray-500">{reportData.revenue.collectionRate.toFixed(1)}% du total</p>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-600">Dépenses Totales</p>
                <ShoppingBag className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-orange-700 mb-2">{formatCurrencyDisplay(reportData.expenses.total)}</h3>
              <p className="text-xs text-gray-500">{reportData.expenses.ratio.toFixed(1)}% des revenus</p>
            </motion.div>

            {/* Net Profit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'border rounded-xl p-6 bg-gradient-to-br',
                reportData.profit.net >= 0
                  ? 'from-green-50 to-emerald-50 border-green-200'
                  : 'from-red-50 to-orange-50 border-red-200'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-600">Bénéfice Net</p>
                <Wallet className={cn('w-5 h-5', reportData.profit.net >= 0 ? 'text-green-600' : 'text-red-600')} />
              </div>
              <h3 className={cn(
                'text-3xl font-bold mb-2',
                reportData.profit.net >= 0 ? 'text-green-700' : 'text-red-700'
              )}>
                {formatCurrencyDisplay(reportData.profit.net)}
              </h3>
              <p className="text-xs text-gray-500">{reportData.profit.margin.toFixed(1)}% de marge</p>
            </motion.div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Détail des Dépenses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDetail('workers')}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-600 mb-2">Employés</p>
                <h4 className="text-2xl font-bold text-amber-700">{formatCurrencyDisplay(reportData.expenses.workers)}</h4>
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p>Salaires: {formatCurrencyDisplay(reportData.expenses.salaries)}</p>
                  <p>Acomptes: {formatCurrencyDisplay(reportData.expenses.acompte)}</p>
                  <p>Absences: {formatCurrencyDisplay(reportData.expenses.absence)}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDetail('purchases')}
                className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-600 mb-2">Achats</p>
                <h4 className="text-2xl font-bold text-red-700">{formatCurrencyDisplay(reportData.expenses.purchases)}</h4>
                <p className="mt-3 text-xs text-gray-600">{reportData.details.purchaseDetails.length} articles</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDetail('store')}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4 cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-600 mb-2">Magasin</p>
                <h4 className="text-2xl font-bold text-purple-700">{formatCurrencyDisplay(reportData.expenses.store)}</h4>
                <p className="mt-3 text-xs text-gray-600">{reportData.details.storeExpenseDetails.length} charges</p>
              </motion.div>
            </div>
          </div>

          {/* Client Debts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Dettes Clients</h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {formatCurrencyDisplay(reportData.revenue.pending)}
              </span>
            </div>

            {reportData.details.clientDebts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reportData.details.clientDebts.map((debt: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{debt.clientName}</p>
                      <p className="text-xs text-gray-500">Total: {formatCurrencyDisplay(debt.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrencyDisplay(debt.pending)}</p>
                      <p className="text-xs text-gray-500">Payé: {formatCurrencyDisplay(debt.paid)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune dette</p>
            )}
          </div>

          {/* Detailed Lists Modals */}
          <AnimatePresence>
            {selectedDetail === 'workers' && (
              <DetailModal
                title="Détail des Paiements Employés"
                items={reportData.details.paymentDetails}
                formatValue={(item: any) => ({ label: `${item.employeeName} - ${item.type}`, value: formatCurrencyDisplay(item.amount) })}
                onClose={() => setSelectedDetail(null)}
              />
            )}

            {selectedDetail === 'purchases' && (
              <DetailModal
                title="Détail des Achats"
                items={reportData.details.purchaseDetails}
                formatValue={(item: any) => ({ 
                  label: `${item.description} (${item.supplier})`, 
                  value: formatCurrencyDisplay(item.cost),
                  details: `Payé: ${formatCurrencyDisplay(item.paid)} | En attente: ${formatCurrencyDisplay(item.pending)}`
                })}
                onClose={() => setSelectedDetail(null)}
              />
            )}

            {selectedDetail === 'store' && (
              <DetailModal
                title="Détail des Frais Magasin"
                items={reportData.details.storeExpenseDetails}
                formatValue={(item: any) => ({ label: item.name, value: formatCurrencyDisplay(item.cost) })}
                onClose={() => setSelectedDetail(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Sélectionnez une période pour générer un rapport</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DETAIL MODAL COMPONENT
// ============================================================================

interface DetailModalProps {
  title: string;
  items: any[];
  formatValue: (item: any) => { label: string; value: string; details?: string };
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ title, items, formatValue, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="space-y-2 p-6">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const formatted = formatValue(item);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{formatted.label}</p>
                      {formatted.details && <p className="text-xs text-gray-500 mt-1">{formatted.details}</p>}
                    </div>
                    <p className="font-bold text-gray-900 ml-4">{formatted.value}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportsEnhanced;

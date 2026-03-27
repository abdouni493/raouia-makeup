import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  ShoppingBag,
  Wallet,
  BarChart3,
  Loader2,
  Package,
  Building2,
  Download,
  PieChart,
  Play,
  X,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedModal, setSelectedModal] = useState<'purchases' | 'workers' | 'store' | 'debts' | 'benefits' | 'prestation' | null>(null);
  const [selectedPrestationId, setSelectedPrestationId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Validate dates
      if (!startDate || !endDate) {
        setError('Veuillez sélectionner les deux dates');
        setIsGenerating(false);
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        setError('La date de début doit être antérieure à la date de fin');
        setIsGenerating(false);
        return;
      }

      const start = new Date(startDate).toISOString();
      const end = new Date(new Date(endDate).getTime() + 86400000).toISOString();

      const [
        reservationsRes,
        prestationsRes,
        purchasesRes,
        storeExpensesRes,
        employeePaymentsRes,
        profilesRes,
      ] = await Promise.all([
        supabase
          .from('reservations')
          .select(`
            id, 
            client_name, 
            date, 
            total_price, 
            paid_amount, 
            status, 
            prestation_id,
            prestations(id, name)
          `)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .limit(500),
        supabase
          .from('prestations')
          .select('id, name, price')
          .limit(100),
        supabase
          .from('purchases')
          .select('id, description, cost, paid_amount, date, created_at, supplier_id, suppliers(full_name)')
          .gte('date', start)
          .lte('date', end)
          .limit(500),
        supabase
          .from('expenses')
          .select('id, name, description, cost, date, created_at')
          .gte('date', start)
          .lte('date', end)
          .limit(500),
        supabase
          .from('employee_payments')
          .select('id, amount, type, employee_id, date, profiles(full_name)')
          .gte('date', start)
          .lte('date', end)
          .limit(500),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .limit(500),
      ]);

      const reservations = reservationsRes.data || [];
      const prestations = prestationsRes.data || [];
      const purchases = purchasesRes.data || [];
      const storeExpenses = storeExpensesRes.data || [];
      const employeePayments = employeePaymentsRes.data || [];
      const profiles = profilesRes.data || [];

      console.log('Report Data:', {
        reservationsCount: reservations.length,
        reservations,
        purchasesCount: purchases.length,
        purchases,
        storeExpensesCount: storeExpenses.length,
        storeExpenses,
        employeePaymentsCount: employeePayments.length,
        employeePayments,
      });

      // Calculate completed/finalized reservations (status = 'completed')
      const completedReservations = reservations.filter((r: any) => r.status === 'completed');
      
      // Revenue calculations (completed only)
      const totalGains = completedReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.total_price) || 0), 0);
      const totalClientPaid = completedReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.paid_amount) || 0), 0);
      const totalDebt = totalGains - totalClientPaid;

      // Expense calculations from employee_payments table
      const salaryPayments = employeePayments
        .filter((p: any) => p.type === 'salary')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      // Get acompte and absence expenses
      const acompteAndAbsenceExpenses = employeePayments
        .filter((p: any) => p.type === 'acompte' || p.type === 'absence')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const totalWorkerExpenses = salaryPayments + acompteAndAbsenceExpenses;

      // Expense calculations from purchases table (supplies/achats)
      const purchaseExpenses = purchases.map((p: any) => ({
        id: p.id,
        description: p.description,
        cost: parseFloat(p.cost) || 0,
        paid_amount: parseFloat(p.paid_amount) || 0,
        date: p.date,
        created_at: p.created_at,
        supplier: p.suppliers?.full_name || 'Non spécifié'
      }));
      const suppliesExpenses = purchases.reduce((sum: number, p: any) => sum + (parseFloat(p.cost) || 0), 0);
      
      // Store expenses from expenses table (all items in this table are store expenses)
      const storeExpensesData = storeExpenses.map((e: any) => ({
        id: e.id,
        description: e.name || e.description,
        cost: parseFloat(e.cost) || 0,
        date: e.date,
        created_at: e.created_at
      }));
      const storeExpensesTotal = storeExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.cost) || 0), 0);
      
      const totalExpenses = suppliesExpenses + totalWorkerExpenses + storeExpensesTotal;

      // Benefit calculation = Paid - Total Expenses
      const netBenefit = totalClientPaid - totalExpenses;
      const marginPercentage = totalClientPaid > 0 ? (netBenefit / totalClientPaid) * 100 : 0;

      // Client debts breakdown
      const clientDebts = completedReservations
        .map((r: any) => ({
          clientName: r.client_name,
          total: parseFloat(r.total_price) || 0,
          paid: parseFloat(r.paid_amount) || 0,
          debt: (parseFloat(r.total_price) || 0) - (parseFloat(r.paid_amount) || 0)
        }))
        .filter((c: any) => c.debt > 0);

      // Service performance calculation
      const topServices = prestations
        .map((s: any) => {
          const serviceReservations = completedReservations.filter((r: any) => r.prestation_id === s.id);
          const serviceRevenue = serviceReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.total_price) || 0), 0);
          const servicePaid = serviceReservations.reduce((sum: number, r: any) => sum + (parseFloat(r.paid_amount) || 0), 0);
          return {
            name: s.name,
            id: s.id,
            revenue: serviceRevenue,
            paid: servicePaid,
            count: serviceReservations.length,
            color: ['bg-gradient-to-r from-green-400 to-emerald-500', 'bg-gradient-to-r from-blue-400 to-cyan-500', 'bg-gradient-to-r from-purple-400 to-pink-500', 'bg-gradient-to-r from-amber-400 to-orange-500'][prestations.indexOf(s) % 4]
          };
        })
        .filter((s: any) => s.revenue > 0)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      const uniqueClients = new Set(completedReservations.map((r: any) => r.client_name));
      const averageBasket = completedReservations.length > 0 ? totalGains / completedReservations.length : 0;

      setReportData({
        totalGains,
        totalClientPaid,
        totalDebt,
        purchaseCosts: suppliesExpenses,
        purchaseExpenses,
        purchasesPaid: suppliesExpenses,
        workerPayments: salaryPayments,
        acompteAndAbsenceExpenses,
        totalWorkerExpenses,
        storeExpenses: storeExpensesTotal,
        storeExpensesData,
        totalExpenses,
        netBenefit,
        marginPercentage,
        clientDebts,
        topServices,
        allReservations: completedReservations,
        totalReservations: reservations.length,
        completedReservations: completedReservations.length,
        newClients: uniqueClients.size,
        averageBasket,
        employeePayments,
      });
      
      setShowReport(true);
    } catch (error) {
      setError('Erreur lors de la génération du rapport. Veuillez réessayer.');
      console.error('Error fetching report data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 rounded-[3rem]"></div>
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-ink mb-2">Rapports & Statistiques</h2>
              <p className="text-ink/60 font-medium">Sélectionnez une plage de dates et générez votre rapport</p>
            </div>
          </div>

          {/* Date Selection Controls */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date de début
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm font-medium text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <Calendar size={18} className="absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date de fin
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm font-medium text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <Calendar size={18} className="absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={fetchData}
                disabled={isGenerating}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white font-bold text-sm shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[44px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Générer le rapport
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-900 font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!showReport && !isGenerating && !reportData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-[3rem]"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="text-accent" size={40} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-ink mb-2">Aucun rapport généré</h3>
            <p className="text-ink/60 font-medium">Sélectionnez une période et cliquez sur le bouton "Générer le rapport" pour commencer</p>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      {showReport && reportData && !isGenerating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* KPI Overview - 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Revenue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden card-premium p-10 bg-gradient-to-br from-green-50/80 to-emerald-50/40 border-green-200/50"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-200/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-green-100/80 flex items-center justify-center text-green-600 shadow-lg">
                    <TrendingUp size={28} />
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest border bg-green-100/50 text-green-700 border-green-200 uppercase">Revenus</span>
                </div>
                <p className="text-ink/60 text-sm font-medium mb-2">Total des Prestations Finalisées</p>
                <h3 className="text-4xl font-serif font-bold text-green-700 tracking-tight mb-4">{formatCurrency(reportData.totalGains)}</h3>
                <div className="h-1.5 w-full bg-green-200/30 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 font-bold">{reportData.completedReservations} prestations</span>
                  <span className="text-green-600/70 font-semibold">100% finalisées</span>
                </div>
              </div>
            </motion.div>

            {/* Collections Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden card-premium p-10 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 border-blue-200/50"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600 shadow-lg">
                    <CheckCircle2 size={28} />
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest border bg-blue-100/50 text-blue-700 border-blue-200 uppercase">Collecté</span>
                </div>
                <p className="text-ink/60 text-sm font-medium mb-2">Montants Reçus des Clients</p>
                <h3 className="text-4xl font-serif font-bold text-blue-700 tracking-tight mb-4">{formatCurrency(reportData.totalClientPaid)}</h3>
                <div className="h-1.5 w-full bg-blue-200/30 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(reportData.totalClientPaid / reportData.totalGains) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-bold">{reportData.totalGains > 0 ? ((reportData.totalClientPaid / reportData.totalGains) * 100).toFixed(0) : 0}% collectés</span>
                  <span className="text-blue-600/70 font-semibold">De {formatCurrency(reportData.totalGains)}</span>
                </div>
              </div>
            </motion.div>

            {/* Outstanding Debt Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden card-premium p-10 bg-gradient-to-br from-red-50/80 to-orange-50/40 border-red-200/50"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-200/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-red-100/80 flex items-center justify-center text-red-600 shadow-lg">
                    <AlertCircle size={28} />
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest border bg-red-100/50 text-red-700 border-red-200 uppercase">Dettes</span>
                </div>
                <p className="text-ink/60 text-sm font-medium mb-2">Montants en Attente de Paiement</p>
                <h3 className="text-4xl font-serif font-bold text-red-700 tracking-tight mb-4">{formatCurrency(reportData.totalDebt)}</h3>
                <div className="h-1.5 w-full bg-red-200/30 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(reportData.totalDebt / reportData.totalGains) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-400 to-orange-500"
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700 font-bold">{reportData.totalGains > 0 ? ((reportData.totalDebt / reportData.totalGains) * 100).toFixed(0) : 0}% en attente</span>
                  <span className="text-red-600/70 font-semibold">À recouvrer</span>
                </div>
              </div>
            </motion.div>

            {/* Net Profit Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden card-premium p-10 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-lg">
                    <Wallet size={28} />
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest border bg-accent/20 text-accent border-accent/30 uppercase">Bénéfice</span>
                </div>
                <p className="text-ink/60 text-sm font-medium mb-2">Bilan Net Après Dépenses</p>
                <h3 className={cn(
                  "text-4xl font-serif font-bold tracking-tight mb-4",
                  reportData.netBenefit >= 0 ? "text-accent" : "text-red-600"
                )}>{formatCurrency(reportData.netBenefit)}</h3>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn(
                      "h-full",
                      reportData.netBenefit >= 0 ? "bg-accent" : "bg-red-500"
                    )}
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    "font-bold",
                    reportData.netBenefit >= 0 ? "text-accent" : "text-red-700"
                  )}>{reportData.netBenefit >= 0 ? '+' : '-'}{Math.abs(reportData.marginPercentage.toFixed(2))}% de marge</span>
                  <span className="text-ink/40 font-semibold">Net</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Detailed Expenses Cards - Clickable */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Purchase Expenses Card */}
            <motion.div
              onClick={() => setSelectedModal('purchases')}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden card-premium p-8 bg-gradient-to-br from-red-50/80 to-orange-50/40 border-red-200/50 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/60">Achats</p>
                    <p className="text-xl font-serif font-bold text-red-600">{formatCurrency(reportData.purchaseCosts)}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: reportData.totalExpenses > 0 ? `${(reportData.purchaseCosts / reportData.totalExpenses) * 100}%` : '0%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-400 to-red-600"
                  ></motion.div>
                </div>
                <p className="text-xs text-ink/40 mt-3">{reportData.purchaseExpenses?.length || 0} articles • Cliquez pour voir les détails</p>
              </div>
            </motion.div>

            {/* Store Expenses Card */}
            <motion.div
              onClick={() => setSelectedModal('store')}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden card-premium p-8 bg-gradient-to-br from-purple-50/80 to-pink-50/40 border-purple-200/50 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/60">Magasin</p>
                    <p className="text-xl font-serif font-bold text-purple-600">{formatCurrency(reportData.storeExpenses)}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: reportData.totalExpenses > 0 ? `${(reportData.storeExpenses / reportData.totalExpenses) * 100}%` : '0%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                  ></motion.div>
                </div>
                <p className="text-xs text-ink/40 mt-3">{reportData.storeExpensesData?.length || 0} charges • Cliquez pour voir les détails</p>
              </div>
            </motion.div>

            {/* Worker Expenses Card */}
            <motion.div
              onClick={() => setSelectedModal('workers')}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden card-premium p-8 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 border-amber-200/50 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/60">Employés</p>
                    <p className="text-xl font-serif font-bold text-amber-600">{formatCurrency(reportData.totalWorkerExpenses)}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: reportData.totalExpenses > 0 ? `${(reportData.totalWorkerExpenses / reportData.totalExpenses) * 100}%` : '0%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                  ></motion.div>
                </div>
                <p className="text-xs text-ink/40 mt-3">{reportData.employeePayments?.length || 0} paiements • Cliquez pour voir les détails</p>
              </div>
            </motion.div>

            {/* Client Debts Card */}
            <motion.div
              onClick={() => setSelectedModal('debts')}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden card-premium p-8 bg-gradient-to-br from-red-50/80 to-rose-50/40 border-red-200/50 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/60">Dettes</p>
                    <p className="text-xl font-serif font-bold text-red-600">{formatCurrency(reportData.totalDebt)}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-400 to-red-600"
                  ></motion.div>
                </div>
                <p className="text-xs text-ink/40 mt-3">{reportData.clientDebts?.length || 0} clients • Cliquez pour voir les détails</p>
              </div>
            </motion.div>

            {/* Net Benefits Card */}
            <motion.div
              onClick={() => setSelectedModal('benefits')}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden card-premium p-8 bg-gradient-to-br from-green-50/80 to-emerald-50/40 border-green-200/50 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", reportData.netBenefit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/60">Bénéfice</p>
                    <p className={cn("text-xl font-serif font-bold", reportData.netBenefit >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(reportData.netBenefit)}</p>
                  </div>
                </div>
                <div className={cn("h-2 w-full rounded-full overflow-hidden", reportData.netBenefit >= 0 ? 'bg-green-100' : 'bg-red-100')}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn("h-full", reportData.netBenefit >= 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600')}
                  ></motion.div>
                </div>
                <p className="text-xs text-ink/40 mt-3">{reportData.netBenefit >= 0 ? 'Bénéfice' : 'Perte'} • Cliquez pour voir les détails</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Modals Overlay */}
          <AnimatePresence>
            {selectedModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedModal(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-gradient-to-r p-6 border-b border-gray-100 flex items-center justify-between z-10"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, ' + 
                        (selectedModal === 'purchases' ? '#fee2e2, #fed7aa' : 
                         selectedModal === 'store' ? '#fce7f3, #fae8ff' : 
                         selectedModal === 'workers' ? '#fef3c7, #fed7aa' : 
                         selectedModal === 'debts' ? '#fee2e2, #fed7aa' : 
                         '#dcfce7, #d1fae5') + ')'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                        selectedModal === 'purchases' ? 'bg-red-100 text-red-600' :
                        selectedModal === 'store' ? 'bg-purple-100 text-purple-600' :
                        selectedModal === 'workers' ? 'bg-amber-100 text-amber-600' :
                        selectedModal === 'debts' ? 'bg-red-100 text-red-600' :
                        'bg-green-100 text-green-600'
                      )}>
                        {selectedModal === 'purchases' ? <Package size={24} /> :
                         selectedModal === 'store' ? <Building2 size={24} /> :
                         selectedModal === 'workers' ? <Users size={24} /> :
                         selectedModal === 'debts' ? <AlertCircle size={24} /> :
                         <TrendingUp size={24} />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-ink">
                          {selectedModal === 'purchases' ? 'Détail des Achats' :
                           selectedModal === 'store' ? 'Détail des Frais Magasin' :
                           selectedModal === 'workers' ? 'Détail des Rémunérations' :
                           selectedModal === 'debts' ? 'Détail des Dettes' :
                           'Détail des Bénéfices'}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedModal(null)}
                      className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-4">
                    {selectedModal === 'purchases' && (
                      <div className="space-y-4">
                        {reportData.purchaseExpenses && reportData.purchaseExpenses.length > 0 ? (
                          reportData.purchaseExpenses.map((expense: any, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 mt-1">
                                    <Package size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-ink break-words">{expense.description}</p>
                                    <p className="text-xs text-ink/50 mt-1">Fournisseur: <span className="font-medium">{expense.supplier}</span></p>
                                    <div className="flex items-center gap-2 text-xs text-ink/50 mt-1">
                                      <Clock size={14} />
                                      <span>{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-red-600 flex-shrink-0">{formatCurrency(expense.cost)}</p>
                              </div>
                              <div className="h-1 bg-red-100 rounded-full w-full"></div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Package size={40} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-ink/40 font-medium">Aucun achat enregistré</p>
                          </div>
                        )}
                        {reportData.purchaseExpenses && reportData.purchaseExpenses.length > 0 && (
                          <div className="mt-6 p-4 bg-red-100/30 rounded-xl border border-red-200 flex items-center justify-between">
                            <p className="font-bold text-ink">Total Achats</p>
                            <p className="text-2xl font-serif font-bold text-red-600">{formatCurrency(reportData.purchaseCosts)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedModal === 'store' && (
                      <div className="space-y-4">
                        {reportData.storeExpensesData && reportData.storeExpensesData.length > 0 ? (
                          reportData.storeExpensesData.map((expense: any, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-1">
                                    <Building2 size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-ink break-words">{expense.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-ink/50 mt-1">
                                      <Clock size={14} />
                                      <span>{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-purple-600 flex-shrink-0">{formatCurrency(expense.cost)}</p>
                              </div>
                              <div className="h-1 bg-purple-100 rounded-full w-full"></div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Building2 size={40} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-ink/40 font-medium">Aucune dépense enregistrée</p>
                          </div>
                        )}
                        {reportData.storeExpensesData && reportData.storeExpensesData.length > 0 && (
                          <div className="mt-6 p-4 bg-purple-100/30 rounded-xl border border-purple-200 flex items-center justify-between">
                            <p className="font-bold text-ink">Total Frais Magasin</p>
                            <p className="text-2xl font-serif font-bold text-purple-600">{formatCurrency(reportData.storeExpenses)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedModal === 'workers' && (
                      <div className="space-y-4">
                        {reportData.employeePayments && reportData.employeePayments.length > 0 ? (
                          <div className="space-y-4">
                            {reportData.employeePayments.map((payment: any, idx: number) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-1">
                                      <Users size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-ink">{payment.profiles?.full_name || 'Employé'}</p>
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                          payment.type === 'salary' ? 'bg-green-100 text-green-700' :
                                          payment.type === 'acompte' ? 'bg-blue-100 text-blue-700' :
                                          'bg-red-100 text-red-700'
                                        )}>
                                          {payment.type === 'salary' ? 'Salaire' : payment.type === 'acompte' ? 'Acompte' : 'Absence'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-ink/50">
                                        <Clock size={14} />
                                        <span>{new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-lg font-bold text-amber-600 flex-shrink-0">{formatCurrency(payment.amount)}</p>
                                </div>
                                <div className="h-1 bg-amber-100 rounded-full w-full"></div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users size={40} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-ink/40 font-medium">Aucun paiement enregistré</p>
                          </div>
                        )}
                        {reportData.employeePayments && reportData.employeePayments.length > 0 && (
                          <div className="mt-6 p-4 bg-amber-100/30 rounded-xl border border-amber-200 flex items-center justify-between">
                            <p className="font-bold text-ink">Total Rémunérations</p>
                            <p className="text-2xl font-serif font-bold text-amber-600">{formatCurrency(reportData.totalWorkerExpenses)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedModal === 'debts' && (
                      <div className="space-y-4">
                        {reportData.clientDebts && reportData.clientDebts.length > 0 ? (
                          reportData.clientDebts.map((debt: any, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <p className="font-bold text-ink text-lg mb-2">{debt.clientName}</p>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-100">
                                      <span className="text-ink/60">Montant Total</span>
                                      <span className="font-bold text-ink">{formatCurrency(debt.total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100">
                                      <span className="text-ink/60">Montant Payé</span>
                                      <span className="font-bold text-green-600">{formatCurrency(debt.paid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-100">
                                      <span className="text-ink/60">À Percevoir</span>
                                      <span className="font-bold text-red-600">{formatCurrency(debt.debt)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="h-1.5 bg-red-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(debt.paid / debt.total) * 100}%` }}
                                  transition={{ duration: 0.8 }}
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                ></motion.div>
                              </div>
                              <p className="text-xs text-ink/50 text-center mt-2">{((debt.paid / debt.total) * 100).toFixed(0)}% Recouvré</p>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle2 size={40} className="mx-auto text-green-300 mb-2" />
                            <p className="text-ink/40 font-medium">Aucune dette - Tous les clients sont à jour !</p>
                          </div>
                        )}
                        {reportData.clientDebts && reportData.clientDebts.length > 0 && (
                          <div className="mt-6 p-4 bg-red-100/30 rounded-xl border border-red-200 flex items-center justify-between">
                            <p className="font-bold text-ink">Total à Percevoir</p>
                            <p className="text-2xl font-serif font-bold text-red-600">{formatCurrency(reportData.totalDebt)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedModal === 'benefits' && (
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200"
                        >
                          <p className="text-sm text-ink/60 font-semibold mb-3">Calcul du Bénéfice Net</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                              <div className="flex items-center gap-2">
                                <TrendingUp size={18} className="text-green-600" />
                                <span className="font-medium text-ink">Total des Gains</span>
                              </div>
                              <span className="font-bold text-green-600">{formatCurrency(reportData.totalClientPaid)}</span>
                            </div>
                          </div>
                        </motion.div>

                        <div className="space-y-3">
                          <p className="text-sm text-ink/60 font-semibold">Dépenses</p>
                          
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-3 bg-red-50 rounded-lg border border-red-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package size={18} className="text-red-600" />
                                <span className="font-medium text-ink">Achats</span>
                              </div>
                              <span className="font-bold text-red-600">-{formatCurrency(reportData.purchaseCosts)}</span>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="p-3 bg-purple-50 rounded-lg border border-purple-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-purple-600" />
                                <span className="font-medium text-ink">Frais Magasin</span>
                              </div>
                              <span className="font-bold text-purple-600">-{formatCurrency(reportData.storeExpenses)}</span>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users size={18} className="text-amber-600" />
                                <span className="font-medium text-ink">Rémunérations</span>
                              </div>
                              <span className="font-bold text-amber-600">-{formatCurrency(reportData.totalWorkerExpenses)}</span>
                            </div>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className={cn("p-6 rounded-xl border-2", reportData.netBenefit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300')}
                        >
                          <div className="text-center">
                            <p className="text-sm text-ink/60 font-semibold mb-2">Bénéfice Net Final</p>
                            <p className={cn("text-4xl font-serif font-bold", reportData.netBenefit >= 0 ? 'text-green-600' : 'text-red-600')}>
                              {formatCurrency(reportData.netBenefit)}
                            </p>
                            <p className={cn("text-sm font-medium mt-2", reportData.netBenefit >= 0 ? 'text-green-700' : 'text-red-700')}>
                              {reportData.netBenefit >= 0 ? '✓ Bénéfice réalisé' : '✗ Perte réalisée'} • Marge: {reportData.marginPercentage.toFixed(2)}%
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {selectedModal === 'prestation' && selectedPrestationId && (
                      <div className="space-y-4">
                        {(() => {
                          const prestationReservations = reportData.allReservations.filter((r: any) => r.prestation_id === selectedPrestationId);
                          return (
                            <>
                              <div className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                                <p className="text-sm text-ink/60 font-semibold mb-3">Résumé de la Prestation</p>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-ink">Nombre de réservations</span>
                                    <span className="text-lg font-bold text-accent">{prestationReservations.length}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-ink">Total facturé</span>
                                    <span className="text-lg font-bold text-accent">{formatCurrency(prestationReservations.reduce((sum: number, r: any) => sum + parseFloat(r.total_price || 0), 0))}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-ink">Total collecté</span>
                                    <span className="text-lg font-bold text-green-600">{formatCurrency(prestationReservations.reduce((sum: number, r: any) => sum + parseFloat(r.paid_amount || 0), 0))}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {prestationReservations.length > 0 ? (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                  {prestationReservations.map((res: any, idx: number) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="p-4 bg-accent/50 rounded-lg border border-accent/20 hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <div>
                                          <p className="font-bold text-ink">{res.client_name}</p>
                                          <p className="text-sm text-ink/60">{new Date(res.date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-ink">{formatCurrency(res.total_price)}</p>
                                          <p className="text-xs text-green-600 font-semibold">{formatCurrency(res.paid_amount)} payé</p>
                                        </div>
                                      </div>
                                      <div className="h-1 bg-accent/30 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: res.total_price > 0 ? `${(res.paid_amount / res.total_price) * 100}%` : '0%' }}
                                          transition={{ duration: 0.8 }}
                                          className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                        ></motion.div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-ink/40 font-medium">Aucune réservation pour cette prestation</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Client Debts Section */}
          {false && (  
            // Hidden fallback - modals handle display now
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="card-premium p-10"
            >
              {/* Kept for reference but hidden */}
            </motion.div>
          )}

          {/* Prestation Performance Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-serif font-bold text-ink px-2 flex items-center gap-3">
              <Sparkles className="text-accent" size={28} />
              Performances par Prestation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.topServices && reportData.topServices.length > 0 ? (
                reportData.topServices.map((service: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    onClick={() => {
                      setSelectedPrestationId(service.id);
                      setSelectedModal('prestation');
                    }}
                    className="card-premium p-6 cursor-pointer hover:shadow-lg transition-all group overflow-hidden relative"
                  >
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none", service.color)}></div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-ink mb-1">{service.name}</h4>
                          <p className="text-sm text-ink/60">{service.count} prestation{service.count > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-serif font-bold text-accent">{formatCurrency(service.revenue)}</p>
                          <p className="text-xs text-ink/40 font-semibold">Total</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-ink/60">
                          <span>Collecté</span>
                          <span className="font-bold text-green-600">{formatCurrency(service.paid)}</span>
                        </div>
                        <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: service.revenue > 0 ? `${(service.paid / service.revenue) * 100}%` : '0%' }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                          ></motion.div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                        <span className="text-[10px] text-ink/40 font-semibold uppercase tracking-wider">Cliquez pour voir les détails</span>
                        <ChevronRight size={16} className="text-ink/40 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-ink/40">
                  Aucune prestation avec revenus sur cette période
                </div>
              )}
            </div>
          </motion.div>

          {/* Reservation Details Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-premium p-10"
          >
            <h3 className="text-2xl font-serif font-bold text-ink mb-8 flex items-center gap-3">
              <BarChart3 className="text-accent" size={28} />
              Détail des Réservations
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-border/30 bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary-bg/60 text-ink/50 text-[10px] uppercase tracking-widest font-bold sticky top-0 border-b border-border/30">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Prestation</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4 text-right">Payé</th>
                    <th className="px-6 py-4 text-right">Reste</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {reportData.allReservations && reportData.allReservations.length > 0 ? reportData.allReservations.map((res: any, idx: number) => (
                    <tr key={idx} className="hover:bg-accent/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">{res.client_name}</td>
                      <td className="px-6 py-4 text-sm text-ink/60 font-medium">{new Date(res.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm text-ink/60">{res.prestations?.name || res.prestation_id || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-ink text-right">{formatCurrency(res.total_price)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatCurrency(res.paid_amount)}</td>
                      <td className={cn(
                        "px-6 py-4 text-sm font-bold text-right",
                        res.total_price - res.paid_amount > 0 ? "text-red-600" : "text-green-600"
                      )}>{formatCurrency(Math.max(0, res.total_price - res.paid_amount))}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border inline-block",
                          res.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {res.status === 'completed' ? 'Finalisée' : 'En Attente'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-ink/40 font-medium">
                        Aucune réservation dans cette période
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4 justify-center pt-4"
          >
            <button className="px-8 py-3.5 rounded-2xl bg-white border border-gray-300 hover:shadow-lg transition-all flex items-center gap-2 font-bold text-sm text-ink group">
              <Download size={18} className="group-hover:translate-y-1 transition-transform" />
              Télécharger PDF
            </button>
            <button className="px-8 py-3.5 rounded-2xl bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all flex items-center gap-2 font-bold text-sm group">
              <PieChart size={18} className="group-hover:rotate-12 transition-transform" />
              Exporter Données
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;

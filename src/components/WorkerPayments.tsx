import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, Clock, AlertCircle, Check, TrendingUp, Calendar, User
} from 'lucide-react';
import { User as UserType, EmployeePayment } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface WorkerPaymentsProps {
  user: UserType;
}

const WorkerPayments: React.FC<WorkerPaymentsProps> = ({ user }) => {
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [absences, setAbsences] = useState<EmployeePayment[]>([]);
  const [acomptes, setAcomptes] = useState<EmployeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, [user.id]);

  const fetchPaymentData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false });

      if (!error && data) {
        setPayments(data.filter(p => p.type === 'payment'));
        setAbsences(data.filter(p => p.type === 'absence'));
        setAcomptes(data.filter(p => p.type === 'acompte'));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAbsences = absences.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalAcomptes = acomptes.reduce((sum, a) => sum + (a.amount || 0), 0);
  const netAmount = totalEarnings - totalAbsences - totalAcomptes;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          className="card-premium p-6 border-l-4 border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink/60 text-sm font-medium">Paiements Totaux</p>
              <p className="text-3xl font-bold text-ink mt-2">{formatCurrency(totalEarnings)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="text-emerald-500 w-7 h-7" />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          className="card-premium p-6 border-l-4 border-amber-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink/60 text-sm font-medium">Acomptes</p>
              <p className="text-3xl font-bold text-ink mt-2">{formatCurrency(totalAcomptes)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="text-amber-500 w-7 h-7" />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          className="card-premium p-6 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink/60 text-sm font-medium">Absences</p>
              <p className="text-3xl font-bold text-ink mt-2">{formatCurrency(totalAbsences)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="text-red-500 w-7 h-7" />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          whileHover={{ y: -5 }}
          className="card-premium p-6 border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink/60 text-sm font-medium">Net à recevoir</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(netAmount)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="text-blue-500 w-7 h-7" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="text-emerald-500 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">Paiements</h3>
            <span className="ml-auto text-sm font-bold bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full">
              {payments.length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="text-ink/40 text-center py-8">Aucun paiement pour le moment</p>
            ) : (
              payments.map(p => (
                <motion.div
                  key={p.id}
                  whileHover={{ x: 4 }}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-transparent rounded-xl border border-emerald-200/50 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-ink">Paiement</p>
                      <div className="flex items-center gap-2 text-sm text-ink/60 mt-1">
                        <Calendar size={14} />
                        {new Date(p.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {p.description && (
                        <p className="text-xs text-ink/40 mt-2">{p.description}</p>
                      )}
                    </div>
                    <p className="font-bold text-emerald-600 text-lg">{formatCurrency(p.amount)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Acomptes Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="text-amber-500 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink">Acomptes</h3>
            <span className="ml-auto text-sm font-bold bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full">
              {acomptes.length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {acomptes.length === 0 ? (
              <p className="text-ink/40 text-center py-8">Aucun acompte pour le moment</p>
            ) : (
              acomptes.map(a => (
                <motion.div
                  key={a.id}
                  whileHover={{ x: 4 }}
                  className="p-4 bg-gradient-to-r from-amber-50 to-transparent rounded-xl border border-amber-200/50 hover:border-amber-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-ink">Acompte</p>
                      <div className="flex items-center gap-2 text-sm text-ink/60 mt-1">
                        <Calendar size={14} />
                        {new Date(a.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {a.description && (
                        <p className="text-xs text-ink/40 mt-2">{a.description}</p>
                      )}
                    </div>
                    <p className="font-bold text-amber-600 text-lg">{formatCurrency(a.amount)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Absences Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="text-red-500 w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-ink">Absences</h3>
          <span className="ml-auto text-sm font-bold bg-red-500/10 text-red-600 px-3 py-1 rounded-full">
            {absences.length}
          </span>
        </div>

        <div className="space-y-3">
          {absences.length === 0 ? (
            <p className="text-ink/40 text-center py-8">Aucune absence enregistrée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="text-left py-3 px-4 font-bold text-ink text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-ink text-sm">Description</th>
                    <th className="text-right py-3 px-4 font-bold text-ink text-sm">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map(a => (
                    <motion.tr
                      key={a.id}
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.02)' }}
                      className="border-b border-ink/5 transition-colors"
                    >
                      <td className="py-4 px-4 text-ink text-sm">
                        {new Date(a.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-4 text-ink/60 text-sm">{a.description || '-'}</td>
                      <td className="py-4 px-4 text-right font-bold text-red-600">
                        -{formatCurrency(a.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkerPayments;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, User, Phone, MapPin, Briefcase, DollarSign, Calendar, X, Check, AlertCircle, Lock, Mail, MinusCircle, PlusCircle, History } from 'lucide-react';
import { User as Employee, EmployeePayment } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [reservationWorkerEarnings, setReservationWorkerEarnings] = useState<Array<{
    workerId: string;
    amount: number;
    status: 'paid' | 'unpaid';
    reservationId: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; employee: Employee | null }>({
    isOpen: false,
    employee: null
  });

  const [historyData, setHistoryData] = useState<{
    works: Array<{ 
      id: string; 
      name: string; 
      date: string; 
      status?: string;
      price?: number;
      paidAmount?: number;
      paymentType?: string;
      percentage?: number;
      reservationWorkerStatus?: string;
    }>;
    payments: EmployeePayment[];
  }>({
    works: [],
    payments: []
  });
  
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; employee: Employee | null; type: 'acompte' | 'absence' | 'payment' }>({
    isOpen: false,
    employee: null,
    type: 'acompte'
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    role: 'worker' as 'admin' | 'worker',
    paymentType: 'month' as 'days' | 'month' | 'percentage',
    percentage: '',
    dailyRate: '',
    monthlyRate: '',
    username: '',
    email: '',
    password: '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch profiles (employees)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      // Map Supabase snake_case to our camelCase types and filter out admins and super_admin
      const mappedEmployees: Employee[] = (profilesData || [])
        .filter(p => p.role !== 'admin' && p.role !== 'super_admin') // Filter out admin and super_admin users
        .map(p => ({
          id: p.id,
          username: p.username,
          email: p.email || '',
          fullName: p.full_name,
          role: p.role,
          avatarUrl: p.avatar_url,
          phone: p.phone,
          address: p.address,
          paymentType: p.payment_type,
          percentage: p.percentage,
          dailyRate: p.daily_rate,
          monthlyRate: p.monthly_rate,
          createdAt: p.created_at
        }));
      setEmployees(mappedEmployees);
    }

    // Fetch payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('employee_payments')
      .select('*');
    
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    } else {
      const mappedPayments: EmployeePayment[] = (paymentsData || []).map(p => ({
        id: p.id,
        employeeId: p.employee_id,
        amount: p.amount,
        type: p.type,
        description: p.description,
        date: p.date,
        status: p.status || 'unpaid' // Include status field from database
      }));
      setPayments(mappedPayments);
    }

    // Fetch reservation worker earnings
    const { data: reservationWorkersData, error: reservationWorkersError } = await supabase
      .from('reservation_workers')
      .select('worker_id, amount, status, reservation_id');
    
    if (reservationWorkersError) {
      console.error('Error fetching reservation workers - table may not exist:', reservationWorkersError);
      setReservationWorkerEarnings([]);
    } else {
      console.log('Reservation workers fetched:', reservationWorkersData, 'Count:', (reservationWorkersData || []).length);
      const mappedData = (reservationWorkersData || []).map((rw: any) => ({
        workerId: rw.worker_id,
        amount: rw.amount || 0,
        status: rw.status || 'unpaid',
        reservationId: rw.reservation_id
      }));
      console.log('Mapped reservation worker data:', mappedData);
      setReservationWorkerEarnings(mappedData);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEmployee = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.username) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    // For new employees, require email and password
    if (!editingEmployee) {
      if (!formData.email || !formData.password) {
        alert('Veuillez entrer l\'email et le mot de passe');
        return;
      }
    }

    // Validate payment amount is provided
    if (formData.paymentType === 'days' && !formData.dailyRate) {
      alert('Veuillez entrer le salaire journalier');
      return;
    }
    if (formData.paymentType === 'month' && !formData.monthlyRate) {
      alert('Veuillez entrer le salaire mensuel');
      return;
    }
    if (formData.paymentType === 'percentage' && !formData.percentage) {
      alert('Veuillez entrer le pourcentage');
      return;
    }

    const employeeData = {
      username: formData.username,
      full_name: formData.fullName,
      role: formData.role,
      phone: formData.phone,
      address: formData.address,
      payment_type: formData.paymentType,
      percentage: formData.paymentType === 'percentage' ? Number(formData.percentage) : null,
      daily_rate: formData.paymentType === 'days' ? Number(formData.dailyRate) : null,
      monthly_rate: formData.paymentType === 'month' ? Number(formData.monthlyRate) : null,
      created_at: formData.createdAt,
    };

    if (editingEmployee) {
      // Update existing employee profile
      const { error } = await supabase
        .from('profiles')
        .update(employeeData)
        .eq('id', editingEmployee.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        alert('Erreur lors de la mise à jour: ' + error.message);
      } else {
        alert('Employé mis à jour avec succès!');
        setIsModalOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      // For adding a new employee - create auth user first
      try {
        // Create auth user via standard signup (available with anon key)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: formData.username, full_name: formData.fullName }
          }
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          alert('Erreur lors de la création du compte: ' + authError.message);
          return;
        }

        if (!authData?.user?.id) {
          alert('Erreur: Impossible de créer le compte');
          return;
        }

        // Create profile with auth user ID
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            ...employeeData,
            created_at: new Date().toISOString(),
          }]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          alert('Erreur lors de la création du profil: ' + profileError.message);
        } else {
          alert('Employé créé avec succès! Il peut maintenant se connecter avec son email et mot de passe.');
          setIsModalOpen(false);
          resetForm();
          fetchData();
        }
      } catch (error: any) {
        console.error('Error creating employee:', error);
        alert('Erreur: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      role: 'worker',
      paymentType: 'month',
      percentage: '',
      dailyRate: '',
      monthlyRate: '',
      username: '',
      email: '',
      password: '',
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      phone: emp.phone || '',
      address: emp.address || '',
      role: emp.role,
      paymentType: emp.paymentType || 'month',
      percentage: emp.percentage?.toString() || '',
      dailyRate: emp.dailyRate?.toString() || '',
      monthlyRate: emp.monthlyRate?.toString() || '',
      username: emp.username,
      email: '',
      password: '',
      createdAt: emp.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openHistoryModal = async (emp: Employee) => {
    try {
      // Fetch all reservation_workers records for this worker
      const { data: workerReservationsData, error: workerReservationsError } = await supabase
        .from('reservation_workers')
        .select(`
          id,
          reservation_id,
          worker_id,
          payment_type,
          amount,
          percentage,
          status,
          reservations(
            id,
            client_name,
            date,
            status,
            total_price,
            paid_amount
          )
        `)
        .eq('worker_id', emp.id)
        .order('reservations(date)', { ascending: false });

      if (workerReservationsError) {
        console.error('Error fetching worker reservations:', workerReservationsError);
      } else {
        console.log('Worker reservations fetched:', workerReservationsData);
      }

      // Fetch all payments for this employee
      const employeePayments = payments.filter(p => p.employeeId === emp.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Map worker reservations to works
      const works = (workerReservationsData || []).map((wr: any) => ({
        id: wr.reservation_id,
        name: wr.reservations?.client_name || 'Client',
        date: wr.reservations?.date,
        status: wr.reservations?.status,
        price: wr.amount || 0,
        paidAmount: 0,
        paymentType: wr.payment_type,
        percentage: wr.percentage,
        reservationWorkerStatus: wr.status
      }));

      setHistoryData({
        works,
        payments: employeePayments
      });

      setHistoryModal({
        isOpen: true,
        employee: emp
      });
    } catch (error) {
      console.error('Error opening history modal:', error);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirm) return;
    
    try {
      // Delete all associated payments first
      const { error: paymentsError } = await supabase
        .from('employee_payments')
        .delete()
        .eq('employee_id', deleteConfirm.id);

      if (paymentsError) {
        console.error('Error deleting payments:', paymentsError);
        alert('Erreur lors de la suppression des paiements de cet employé');
        setDeleteConfirm(null);
        return;
      }

      // Then delete the employee profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteConfirm.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        alert('Erreur lors de la suppression de l\'employé');
      } else {
        // Refresh data after successful deletion
        await fetchData();
        alert('Employé supprimé avec succès!');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      alert('Une erreur s\'est produite lors de la suppression');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleAddPaymentAction = async () => {
    if (!paymentModal.employee) return;
    
    const paymentData = {
      employee_id: paymentModal.employee.id,
      type: paymentModal.type,
      amount: Number(paymentFormData.amount),
      description: paymentFormData.description,
      date: paymentFormData.date,
      status: 'unpaid' // New acomptes/absences are always unpaid initially
    };

    const { error } = await supabase
      .from('employee_payments')
      .insert([paymentData]);

    if (error) {
      console.error('Error adding payment:', error);
    } else {
      fetchData();
    }

    setPaymentModal({ isOpen: false, employee: null, type: 'acompte' });
    setPaymentFormData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleValidatePayment = async () => {
    if (!paymentModal.employee) return;

    try {
      const employeeId = paymentModal.employee.id;
      
      // Get current calculation details
      const details = paymentModal.employee.paymentType === 'percentage'
        ? calculatePercentageEarnings(employeeId)
        : calculateNetSalary(employeeId);

      // Get the date of the last salary payment to match the calculation logic
      const lastSalaryPayment = payments
        .filter(p => p.employeeId === employeeId && p.type === 'salary')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const lastPaymentDate = lastSalaryPayment ? new Date(lastSalaryPayment.date) : new Date('2000-01-01');

      // Get unpaid acomptes and absences created on or after the last salary payment
      // This matches the calculation logic exactly
      const unpaidDeductions = payments.filter(p =>
        p.employeeId === employeeId &&
        (p.type === 'acompte' || p.type === 'absence') &&
        new Date(p.date) >= lastPaymentDate &&
        (p.status === 'unpaid' || !p.status)
      );

      if (unpaidDeductions.length === 0) {
        alert('Aucune déduction à payer');
        return;
      }

      // Create salary payment record with included deductions info
      const salaryPayment = {
        employee_id: employeeId,
        type: 'salary',
        amount: details.net,
        description: `Paiement du salaire - Déductions incluses: ${unpaidDeductions.length}`,
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
      };

      const { error: salaryError } = await supabase
        .from('employee_payments')
        .insert([salaryPayment]);

      if (salaryError) {
        console.error('Error creating salary payment:', salaryError);
        alert('Erreur lors de la création du paiement');
        return;
      }

      // Mark all unpaid deductions as paid - use a batch update if possible
      let updateCount = 0;
      
      // Try batch update first
      const deductionIds = unpaidDeductions.map(d => d.id);
      console.log('Attempting to mark deductions as paid:', deductionIds);
      const { error: batchError, data: batchData } = await supabase
        .from('employee_payments')
        .update({ status: 'paid' })
        .in('id', deductionIds);

      if (batchError) {
        console.error('Batch update failed, trying individual updates:', batchError);
        // Fallback to individual updates
        for (const deduction of unpaidDeductions) {
          const { error: updateError } = await supabase
            .from('employee_payments')
            .update({ status: 'paid' })
            .eq('id', deduction.id);

          if (updateError) {
            console.error(`Error marking deduction ${deduction.id} as paid:`, updateError);
          } else {
            updateCount++;
          }
        }
      } else {
        updateCount = unpaidDeductions.length;
        console.log(`Batch update successful: ${updateCount} deductions marked as paid`);
      }

      console.log(`Updated ${updateCount} of ${unpaidDeductions.length} deductions to paid status`);

      // Also mark all unpaid reservation worker earnings as paid
      if (paymentModal.employee.paymentType === 'percentage') {
        const unpaidReservationEarnings = reservationWorkerEarnings.filter(
          rw => rw.workerId === employeeId && rw.status === 'unpaid'
        );
        
        if (unpaidReservationEarnings.length > 0) {
          const reservationIds = unpaidReservationEarnings.map(rw => rw.reservationId);
          const { error: reservationUpdateError } = await supabase
            .from('reservation_workers')
            .update({ status: 'paid' })
            .eq('worker_id', employeeId)
            .in('reservation_id', reservationIds);
          
          if (reservationUpdateError) {
            console.error('Error marking reservation worker earnings as paid:', reservationUpdateError);
          } else {
            console.log(`Marked ${unpaidReservationEarnings.length} reservation earnings as paid`);
          }
        }
      }

      // Refresh data and close modal
      await fetchData();
      setPaymentModal({ isOpen: false, employee: null, type: 'acompte' });
     
    } catch (error) {
      console.error('Error during payment validation:', error);
      alert('Une erreur s\'est produite lors de la validation du paiement');
      alert('Une erreur s\'est produite lors de la validation du paiement');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement/acompte/absence?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        console.error('Error deleting payment:', error);
        alert('Erreur lors de la suppression');
        return;
      }

      await fetchData();
      alert('Supprimé avec succès!');
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur s\'est produite');
    }
  };

  const calculateNetSalary = (employeeId: string) => {
    // Get the actual employee to fetch their real salary amount
    const employee = employees.find(emp => emp.id === employeeId);
    
    // Use the real amount based on payment type
    let baseSalary = 0;
    if (employee?.paymentType === 'days' && employee?.dailyRate) {
      baseSalary = employee.dailyRate * 22; // Approximate working days in a month
    } else if (employee?.paymentType === 'month' && employee?.monthlyRate) {
      baseSalary = employee.monthlyRate;
    } else {
      baseSalary = 0;
    }
    
    // Get the date of the last salary payment to only count new deductions after that
    const lastSalaryPayment = payments
      .filter(p => p.employeeId === employeeId && p.type === 'salary')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const lastPaymentDate = lastSalaryPayment ? new Date(lastSalaryPayment.date) : new Date('2000-01-01');
    
    // Only include UNPAID acomptes and absences created on or after the last salary payment
    const empPayments = payments.filter(p => 
      p.employeeId === employeeId && 
      (p.type === 'acompte' || p.type === 'absence') &&
      new Date(p.date) >= lastPaymentDate &&
      (p.status === 'unpaid' || !p.status) // Include unpaid or those without status (backwards compatibility)
    );
    const totalDeductions = empPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      base: baseSalary,
      deductions: totalDeductions,
      net: baseSalary - totalDeductions,
      acomptes: empPayments.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0),
      absences: empPayments.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0)
    };
  };

  const calculatePercentageEarnings = (employeeId: string) => {
    // For percentage workers, calculate earnings based on commission from reservations
    const employee = employees.find(emp => emp.id === employeeId);
    const empPayments = payments.filter(p => p.employeeId === employeeId && p.type === 'salary');
    
    // Get the date of the last salary payment to only count new deductions on or after that
    const lastSalaryPayment = empPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastPaymentDate = lastSalaryPayment ? new Date(lastSalaryPayment.date) : new Date('2000-01-01');
    
    // Only include UNPAID deductions created on or after the last salary payment
    const deductions = payments.filter(p =>
      p.employeeId === employeeId &&
      (p.type === 'acompte' || p.type === 'absence') &&
      new Date(p.date) >= lastPaymentDate &&
      (p.status === 'unpaid' || !p.status) // Include unpaid or those without status
    );
    
    const totalDeductions = deductions.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate earnings from reservation work (unpaid only)
    const allWorksForEmployee = reservationWorkerEarnings.filter(rw => rw.workerId === employeeId);
    const unpaidWorksForEmployee = allWorksForEmployee.filter(rw => rw.status === 'unpaid');
    const reservationEarnings = unpaidWorksForEmployee.reduce((sum, rw) => sum + rw.amount, 0);
    
    console.log(`calculatePercentageEarnings for employee ${employeeId}:`, {
      allWorks: allWorksForEmployee,
      unpaidWorks: unpaidWorksForEmployee,
      totalEarnings: reservationEarnings,
      allReservationWorkerEarnings: reservationWorkerEarnings
    });
    
    return {
      base: reservationEarnings,
      total: reservationEarnings,
      deductions: totalDeductions,
      net: reservationEarnings - totalDeductions,
      acomptes: deductions.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0),
      absences: deductions.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0)
    };
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-ink tracking-tight">Employés</h2>
          <p className="text-ink/40 mt-2 font-medium">Gérez votre équipe, leurs rôles et leurs rémunérations</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingEmployee(null); setIsModalOpen(true); }}
          className="btn-gradient shimmer flex items-center gap-2.5 px-8 py-3"
        >
          <Plus size={20} />
          Ajouter un employé
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map((emp, idx) => (
          <motion.div 
            key={emp.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card-premium p-8 group hover:translate-y-[-4px] transition-all duration-300"
          >
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner group-hover:bg-accent group-hover:text-white transition-all duration-500">
                  <User size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                  <Briefcase size={14} className="text-accent" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-2xl text-ink tracking-tight truncate">{emp.fullName}</h4>
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-1.5 border",
                  emp.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {emp.role === 'admin' ? 'Administrateur' : 'Employé'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-sm text-ink/60 font-medium">
                <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-accent/60">
                  <Phone size={16} />
                </div>
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink/60 font-medium">
                <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-accent/60">
                  <MapPin size={16} />
                </div>
                <span className="truncate">{emp.address}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink/60 font-medium">
                <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-accent/60">
                  <Calendar size={16} />
                </div>
                <span>Embauché le: <span className="text-accent font-bold">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink/60 font-medium">
                <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-accent/60">
                  <DollarSign size={16} />
                </div>
                <span>Rémunération: <span className="text-accent font-bold">{
                  emp.paymentType === 'percentage' ? `${emp.percentage}%` : 
                  emp.paymentType === 'month' ? formatCurrency(emp.monthlyRate || 0) + ' /mois' : 
                  formatCurrency(emp.dailyRate || 0) + ' /jour'
                }</span></span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <button 
                onClick={() => openHistoryModal(emp)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-primary-bg hover:bg-blue-50 text-ink/60 hover:text-blue-500 transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                <History size={16} /> Historique
              </button>
              <button 
                onClick={() => setPaymentModal({ isOpen: true, employee: emp, type: 'acompte' })}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-primary-bg hover:bg-accent/10 text-ink/60 hover:text-accent transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                <PlusCircle size={16} /> Acompte
              </button>
              <button 
                onClick={() => setPaymentModal({ isOpen: true, employee: emp, type: 'absence' })}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-primary-bg hover:bg-red-50 text-ink/60 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                <MinusCircle size={16} /> Absence
              </button>
              <button 
                onClick={() => setPaymentModal({ isOpen: true, employee: emp, type: 'payment' })}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-accent/20"
              >
                <DollarSign size={16} /> Paiement
              </button>
            </div>

            <div className="pt-6 border-t border-border flex gap-3">
              <button 
                onClick={() => openEditModal(emp)}
                className="flex-1 py-3 rounded-xl bg-primary-bg text-ink/60 font-bold text-xs hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit2 size={16} /> Modifier
              </button>
              <button 
                onClick={() => setDeleteConfirm({ isOpen: true, id: emp.id, name: emp.fullName })}
                className="p-3 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment/Acompte/Absence Modal */}
      <AnimatePresence mode="wait">
        {paymentModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPaymentModal({ isOpen: false, employee: null, type: 'acompte' })}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-auto"
            >
              <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-tight">
                    {paymentModal.type === 'acompte' ? 'Nouvel Acompte' : 
                     paymentModal.type === 'absence' ? 'Nouvelle Absence' : 
                     'Calcul du Paiement'}
                  </h3>
                  <button onClick={() => setPaymentModal({ isOpen: false, employee: null, type: 'acompte' })} className="p-2 rounded-xl hover:bg-primary-bg text-ink/20 hover:text-ink transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-primary-bg/50 rounded-2xl border border-border/30">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink/30 uppercase tracking-widest">Employé</p>
                    <p className="font-bold text-ink">{paymentModal.employee?.fullName}</p>
                  </div>
                </div>

                {paymentModal.type === 'payment' ? (
                  <div className="space-y-5">
                    {(() => {
                      const employee = paymentModal.employee!;
                      const details = employee.paymentType === 'percentage' 
                        ? calculatePercentageEarnings(employee.id)
                        : calculateNetSalary(employee.id);
                      
                      return (
                        <>
                          {employee.paymentType === 'percentage' && (
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Paie Pourcentage</p>
                              <p className="text-sm text-blue-600">Rémunération basée sur {employee.percentage}% des services effectués</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center p-4 bg-primary-bg/50 rounded-2xl border border-border/30">
                            <span className="text-sm text-ink/40 font-medium">
                              {employee.paymentType === 'percentage' ? 'Total Gains' : 'Salaire de base'}
                            </span>
                            <span className="font-serif font-bold text-lg text-ink">{formatCurrency(details.base)}</span>
                          </div>
                          
                          {/* Show works breakdown for percentage workers */}
                          {employee.paymentType === 'percentage' && (
                            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20">
                              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Travaux Effectués</p>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(() => {
                                  const worksForEmployee = reservationWorkerEarnings.filter(
                                    rw => rw.workerId === employee.id && rw.status === 'unpaid'
                                  );
                                  const debugTotal = worksForEmployee.reduce((sum, w) => sum + w.amount, 0);
                                  console.log(`DEBUG: Employee ${employee.id}, works:`, worksForEmployee, 'total:', debugTotal);
                                  if (worksForEmployee.length === 0) {
                                    return <p className="text-xs text-ink/40">Aucun travail non payé</p>;
                                  }
                                  return worksForEmployee.map((work, idx) => (
                                    <div key={idx} className="flex justify-between text-xs p-2 bg-white/30 rounded">
                                      <span className="text-ink/60">Réservation #{work.reservationId.substring(0, 8)}</span>
                                      <span className="font-bold text-accent">{formatCurrency(work.amount)}</span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                            <span className="text-sm text-red-500/60 font-medium">Total Acomptes</span>
                            <span className="font-serif font-bold text-lg text-red-500">-{formatCurrency(details.acomptes)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                            <span className="text-sm text-red-500/60 font-medium">Coût Absences</span>
                            <span className="font-serif font-bold text-lg text-red-500">-{formatCurrency(details.absences)}</span>
                          </div>
                          <div className="pt-8 mt-4 border-t border-border flex justify-between items-center">
                            <span className="font-serif font-bold text-xl text-ink">Net à payer</span>
                            <span className="text-3xl font-serif font-bold text-accent tracking-tight">{formatCurrency(details.net)}</span>
                          </div>
                          <button 
                            onClick={handleValidatePayment}
                            className="w-full btn-gradient shimmer mt-8 py-4 flex items-center justify-center gap-3"
                          >
                            <DollarSign size={22} /> Valider le Paiement
                          </button>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest ml-1">
                        {paymentModal.type === 'acompte' ? 'Montant de l\'acompte (DA)' : 'Coût de l\'absence (DA)'}
                      </label>
                      <input 
                        type="number" 
                        value={paymentFormData.amount}
                        onChange={e => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                        className="w-full input-premium" 
                        placeholder="0.00 DA" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest ml-1">Date</label>
                      <input 
                        type="date" 
                        value={paymentFormData.date}
                        onChange={e => setPaymentFormData({...paymentFormData, date: e.target.value})}
                        className="w-full input-premium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest ml-1">Description / Motif</label>
                      <textarea 
                        value={paymentFormData.description}
                        onChange={e => setPaymentFormData({...paymentFormData, description: e.target.value})}
                        className="w-full input-premium h-32 pt-4" 
                        placeholder="Détails..."
                      ></textarea>
                    </div>
                    <button 
                      onClick={handleAddPaymentAction}
                      disabled={!paymentFormData.amount}
                      className="w-full btn-gradient py-4 disabled:opacity-50"
                    >
                      Enregistrer {paymentModal.type === 'acompte' ? 'l\'acompte' : 'l\'absence'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Employee Modal */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col mx-auto"
            >
              <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-tight">
                    {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-primary-bg text-ink/20 hover:text-ink transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Nom Complet</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                      <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        className="w-full input-premium pl-12" 
                        placeholder="Prénom Nom"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full input-premium pl-12" 
                        placeholder="05..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Adresse</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full input-premium pl-12" 
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Poste</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as any})}
                      className="w-full input-premium"
                    >
                      <option value="worker">Employé (Worker)</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Type de Paiement</label>
                    <select 
                      value={formData.paymentType}
                      onChange={e => setFormData({...formData, paymentType: e.target.value as any})}
                      className="w-full input-premium"
                    >
                      <option value="month">Mensuel</option>
                      <option value="days">Journalier</option>
                      <option value="percentage">Pourcentage</option>
                    </select>
                  </div>
                  {formData.paymentType === 'percentage' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Pourcentage (%)</label>
                      <input 
                        type="number" 
                        value={formData.percentage}
                        onChange={e => setFormData({...formData, percentage: e.target.value})}
                        className="w-full input-premium" 
                        placeholder="Ex: 30"
                      />
                    </div>
                  )}
                  {formData.paymentType === 'days' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Salaire Journalier (DA)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                        <input 
                          type="number" 
                          value={formData.dailyRate}
                          onChange={e => setFormData({...formData, dailyRate: e.target.value})}
                          className="w-full input-premium pl-12" 
                          placeholder="Ex: 3000"
                        />
                      </div>
                    </div>
                  )}
                  {formData.paymentType === 'month' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Salaire Mensuel (DA)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                        <input 
                          type="number" 
                          value={formData.monthlyRate}
                          onChange={e => setFormData({...formData, monthlyRate: e.target.value})}
                          className="w-full input-premium pl-12" 
                          placeholder="Ex: 60000"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Date d'embauche</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                      <input 
                        type="date" 
                        value={formData.createdAt}
                        onChange={e => setFormData({...formData, createdAt: e.target.value})}
                        className="w-full input-premium pl-12"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 pt-4 border-t border-border">
                    <h4 className="text-sm font-bold text-ink/40 mb-4">Informations de connexion</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Nom d'utilisateur</label>
                        <input 
                          type="text" 
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                          className="w-full input-premium" 
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                          <input 
                            type="email" 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full input-premium pl-12" 
                            placeholder="email@salon.dz"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30 ml-1">Mot de passe</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                          <input 
                            type="password" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full input-premium pl-12" 
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white border border-border font-bold text-ink/40 hover:text-ink transition-all">Annuler</button>
                  <button 
                    onClick={handleSaveEmployee}
                    className="flex-1 btn-gradient shimmer py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <Check size={20} /> Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence mode="wait">
        {deleteConfirm?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-ink tracking-tight">Confirmer la suppression</h3>
                  <p className="text-ink/40 font-medium">
                    Êtes-vous sûr de vouloir supprimer <span className="text-ink font-bold">"{deleteConfirm.name}"</span> ? Cette action est irréversible.
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 rounded-2xl bg-white border border-border font-bold text-ink/40 hover:text-ink transition-all">Annuler</button>
                  <button 
                    onClick={handleDeleteEmployee}
                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence mode="wait">
        {historyModal.isOpen && historyModal.employee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryModal({ isOpen: false, employee: null })}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border p-5 md:p-8 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-tight">
                    Historique de {historyModal.employee.fullName}
                  </h3>
                  <p className="text-sm text-ink/40 mt-1">Tous les travaux, paiements, acomptes et absences</p>
                </div>
                <button 
                  onClick={() => setHistoryModal({ isOpen: false, employee: null })} 
                  className="p-2 rounded-xl hover:bg-primary-bg text-ink/20 hover:text-ink transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1">
                <div className="p-5 md:p-8 space-y-8">
                  
                  {/* Employee Info Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary-bg rounded-2xl border border-border/30">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-2">Type de Paiement</p>
                      <p className="text-sm font-bold text-accent">
                        {historyModal.employee.paymentType === 'percentage' ? `${historyModal.employee.percentage}%` : 
                         historyModal.employee.paymentType === 'month' ? 'Mensuel' : 'Journalier'}
                      </p>
                    </div>
                    <div className="p-4 bg-primary-bg rounded-2xl border border-border/30">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-2">Total Travaux</p>
                      <p className="text-sm font-bold text-accent">{historyData.works.length}</p>
                    </div>
                    <div className="p-4 bg-primary-bg rounded-2xl border border-border/30">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-2">Total Acomptes</p>
                      <p className="text-sm font-bold text-accent">
                        {formatCurrency(historyData.payments
                          .filter(p => p.type === 'acompte')
                          .reduce((sum, p) => sum + p.amount, 0))}
                      </p>
                    </div>
                    <div className="p-4 bg-primary-bg rounded-2xl border border-border/30">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-2">Total Absences</p>
                      <p className="text-sm font-bold text-red-500">
                        {formatCurrency(historyData.payments
                          .filter(p => p.type === 'absence')
                          .reduce((sum, p) => sum + p.amount, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Tabs or sections */}
                  <div className="space-y-6">
                    {/* Works Section */}
                    <div>
                      <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-accent" />
                        Travaux Effectués ({historyData.works.length})
                      </h4>
                      {historyData.works.length > 0 ? (
                        <div className="space-y-3">
                          {historyData.works.map((work) => (
                            <div key={work.id} className="p-4 bg-primary-bg rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <h5 className="font-bold text-ink">{work.name}</h5>
                                  <p className="text-xs text-ink/40 mt-1">
                                    {new Date(work.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-accent">{formatCurrency(work.price)}</p>
                                  <span className={cn(
                                    "inline-block text-xs font-bold px-3 py-1 rounded-lg mt-2",
                                    work.reservationWorkerStatus === 'paid' ? 'bg-green-50 text-green-600' :
                                    work.reservationWorkerStatus === 'unpaid' ? 'bg-orange-50 text-orange-600' :
                                    'bg-gray-50 text-gray-600'
                                  )}>
                                    {work.reservationWorkerStatus === 'paid' ? 'Payé' :
                                     work.reservationWorkerStatus === 'unpaid' ? 'Non Payé' : 'Statut Inconnu'}
                                  </span>
                                </div>
                              </div>
                              {historyModal.employee.paymentType === 'percentage' && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                 
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-primary-bg rounded-xl text-center text-ink/40">
                          <Briefcase size={32} className="mx-auto opacity-20 mb-2" />
                          <p className="font-medium">Aucun travail enregistré</p>
                        </div>
                      )}
                    </div>

                    {/* Acomptes Section */}
                    <div>
                      <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-blue-600" />
                        Acomptes ({historyData.payments.filter(p => p.type === 'acompte').length})
                      </h4>
                      {historyData.payments.filter(p => p.type === 'acompte').length > 0 ? (
                        <div className="space-y-3">
                          {historyData.payments.filter(p => p.type === 'acompte').map((payment) => (
                            <div key={payment.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-blue-900">Acompte</h5>
                                    <span className={cn(
                                      "inline-block text-xs font-bold px-2 py-1 rounded-md",
                                      payment.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                    )}>
                                      {payment.status === 'paid' ? 'PAYÉ' : 'NON PAYÉ'}
                                    </span>
                                  </div>
                                  {payment.description && (
                                    <p className="text-xs text-blue-600/60">{payment.description}</p>
                                  )}
                                  <p className="text-xs text-blue-600/40 mt-2">
                                    {new Date(payment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                  <p className="text-lg font-bold text-blue-600">+{formatCurrency(payment.amount)}</p>
                                  <button
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50 rounded-xl text-center text-blue-400">
                          <p className="font-medium text-sm">Aucun acompte enregistré</p>
                        </div>
                      )}
                    </div>

                    {/* Absences Section */}
                    <div>
                      <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-600" />
                        Absences ({historyData.payments.filter(p => p.type === 'absence').length})
                      </h4>
                      {historyData.payments.filter(p => p.type === 'absence').length > 0 ? (
                        <div className="space-y-3">
                          {historyData.payments.filter(p => p.type === 'absence').map((payment) => (
                            <div key={payment.id} className="p-4 bg-red-50 rounded-xl border border-red-100 hover:border-red-300 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-red-900">Absence</h5>
                                    <span className={cn(
                                      "inline-block text-xs font-bold px-2 py-1 rounded-md",
                                      payment.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                    )}>
                                      {payment.status === 'paid' ? 'PAYÉ' : 'NON PAYÉ'}
                                    </span>
                                  </div>
                                  {payment.description && (
                                    <p className="text-xs text-red-600/60">{payment.description}</p>
                                  )}
                                  <p className="text-xs text-red-600/40 mt-2">
                                    {new Date(payment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                  <p className="text-lg font-bold text-red-600">-{formatCurrency(payment.amount)}</p>
                                  <button
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50 rounded-xl text-center text-red-400">
                          <p className="font-medium text-sm">Aucune absence enregistrée</p>
                        </div>
                      )}
                    </div>

                    {/* Salary Payments Section */}
                    <div>
                      <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                        <Check size={20} className="text-green-600" />
                        Paiements de Salaire ({historyData.payments.filter(p => p.type === 'salary').length})
                      </h4>
                      {historyData.payments.filter(p => p.type === 'salary').length > 0 ? (
                        <div className="space-y-3">
                          {historyData.payments.filter(p => p.type === 'salary').map((payment) => (
                            <div key={payment.id} className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-300 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-green-900">Paiement</h5>
                                    <span className="inline-block text-xs font-bold px-2 py-1 rounded-md bg-green-50 text-green-600">
                                      PAYÉ
                                    </span>
                                  </div>
                                  {payment.description && (
                                    <p className="text-xs text-green-600/60">{payment.description}</p>
                                  )}
                                  <p className="text-xs text-green-600/40 mt-2">
                                    {new Date(payment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                  <p className="text-lg font-bold text-green-600">+{formatCurrency(payment.amount)}</p>
                                  <button
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 rounded-xl text-center text-green-400">
                          <p className="font-medium text-sm">Aucun paiement enregistré</p>
                        </div>
                      )}
                    </div>

                    {/* Summary for Percentage Payment */}
                    {historyModal.employee.paymentType === 'percentage' && historyData.works.length > 0 && (
                      <div className="p-6 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                        <h5 className="font-bold text-ink mb-4">Résumé des Paiements en Pourcentage</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Total Travaux</p>
                            <p className="font-bold text-accent">
                              {formatCurrency(historyData.works.reduce((sum, w) => sum + (w.price || 0), 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Travaux Non Payés</p>
                            <p className="font-bold text-orange-600">
                              {formatCurrency(historyData.works.filter(w => w.reservationWorkerStatus === 'unpaid').reduce((sum, w) => sum + (w.price || 0), 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Travaux Payés</p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(historyData.works.filter(w => w.reservationWorkerStatus === 'paid').reduce((sum, w) => sum + (w.price || 0), 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Total Acomptes</p>
                            <p className="font-bold text-blue-600">
                              {formatCurrency(historyData.payments.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Total Absences</p>
                            <p className="font-bold text-red-600">
                              {formatCurrency(historyData.payments.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-ink/40 mb-1">Solde</p>
                            <p className={cn(
                              "font-bold",
                              (historyData.works.filter(w => w.reservationWorkerStatus === 'unpaid').reduce((sum, w) => sum + (w.price || 0), 0) - 
                               historyData.payments.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0) +
                               historyData.payments.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatCurrency(
                                historyData.works.filter(w => w.reservationWorkerStatus === 'unpaid').reduce((sum, w) => sum + (w.price || 0), 0) - 
                                historyData.payments.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0) +
                                historyData.payments.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-border p-5 md:p-8 flex gap-4">
                <button 
                  onClick={() => setHistoryModal({ isOpen: false, employee: null })}
                  className="flex-1 py-3 rounded-xl bg-primary-bg text-ink/60 font-bold hover:bg-accent/10 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;

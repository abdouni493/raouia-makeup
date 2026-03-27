export type Role = 'admin' | 'worker' | 'super_admin';

export type Employee = User;

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  phone?: string;
  address?: string;
  paymentType?: 'days' | 'month' | 'percentage';
  percentage?: number;
  dailyRate?: number;
  monthlyRate?: number;
  createdAt: string;
}

export interface Prestation {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  prestationId: string;
  serviceIds: string[];
  date: string;
  time: string;
  totalPrice: number;
  paidAmount: number;
  status: 'pending' | 'finalized' | 'cancelled';
  workerId?: string;
  createdBy: string;
  finalizedAt?: string;
}

export interface Supplier {
  id: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  description: string;
  cost: number;
  paidAmount: number;
  date: string;
}

export interface Expense {
  id: string;
  name: string;
  description: string;
  cost: number;
  date: string;
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  amount: number;
  type: 'salary' | 'acompte' | 'absence';
  description: string;
  date: string;
  status?: 'paid' | 'unpaid'; // Track payment status
  paid?: boolean; // Legacy field for backwards compatibility
}

export interface StoreConfig {
  name: string;
  logo?: string;
  slogan: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  phone: string;
  location: string;
}

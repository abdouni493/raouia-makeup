import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scissors, 
  FileText, 
  Truck, 
  ShoppingBag, 
  Users, 
  Wallet, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Menu,
  Store
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Role, StoreConfig } from '../types';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  config: StoreConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  isCollapsed, 
  setIsCollapsed,
  isMobile,
  config
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'worker', 'super_admin'] },
    { id: 'reservations', label: 'Réservations', icon: CalendarDays, roles: ['admin', 'worker', 'super_admin'] },
    { id: 'my-payments', label: 'Mes Paiements', icon: Wallet, roles: ['worker'] },
    { id: 'prestations', label: 'Prestations & Services', icon: Scissors, roles: ['admin', 'super_admin'] },
    { id: 'invoices', label: 'Factures', icon: FileText, roles: ['admin', 'super_admin'] },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck, roles: ['admin', 'super_admin'] },
    { id: 'purchases', label: 'Achats', icon: ShoppingBag, roles: ['admin', 'super_admin'] },
    { id: 'employees', label: 'Employés', icon: Users, roles: ['admin', 'super_admin'] },
    { id: 'expenses', label: 'Dépenses', icon: Wallet, roles: ['admin', 'super_admin'] },
    { id: 'reports', label: 'Rapports', icon: FileText, roles: ['admin', 'super_admin'] },
    { id: 'config', label: 'Paramètres', icon: Settings, roles: ['admin', 'worker', 'super_admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  const sidebarVariants = {
    open: { 
      x: 0,
      width: isMobile ? '100%' : 280,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: { 
      x: isMobile ? '-100%' : -280,
      width: isMobile ? '100%' : 0,
      opacity: isMobile ? 1 : 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        className={cn(
          "fixed lg:relative h-screen glass border-r border-border flex flex-col z-50 overflow-hidden",
          isCollapsed ? "pointer-events-none lg:pointer-events-auto" : "p-6 pointer-events-auto"
        )}
      >
        <div className="flex items-center justify-between mb-10">
          <motion.div 
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden">
              {config.logo ? (
                <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="text-white w-6 h-6" />
              )}
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-accent">{config.name || "Éclat & Soie"}</span>
          </motion.div>
          
          {isMobile && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-2 rounded-full hover:bg-accent/10 text-accent transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsCollapsed(true);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                activeTab === item.id 
                  ? "text-white" 
                  : "text-ink/60 hover:bg-accent/5 hover:text-accent"
              )}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent shadow-lg shadow-accent/20 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={22} className={cn(
                "transition-transform duration-300 group-active:scale-90",
                activeTab === item.id ? "text-white" : "text-ink/40 group-hover:text-accent"
              )} />
              <span className="font-medium tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-ink/40 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
          >
            <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;

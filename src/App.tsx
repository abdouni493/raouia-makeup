/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Reservations from './components/Reservations';
import Prestations from './components/Prestations';
import Employees from './components/Employees';
import Inventory from './components/Inventory';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import Configuration from './components/Configuration';
import WorkerPayments from './components/WorkerPayments';
import { User, StoreConfig, Role } from './types';
import { supabase } from './lib/supabase';
import { fetchUserProfile } from './lib/utils';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: "Éclat & Soie",
    slogan: "Votre beauté, notre passion",
    phone: "06 12 34 56 78",
    location: "12 Rue de la Beauté, Paris",
    facebook: "eclat.soie",
    instagram: "eclat_soie_salon"
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
          try {
            const profileData = await fetchUserProfile(sessionData.session.user.id);

            if (profileData) {
              setUser({
                id: sessionData.session.user.id,
                username: profileData.username,
                email: sessionData.session.user.email || '',
                fullName: profileData.full_name,
                role: profileData.role as Role,
                avatar: profileData.avatar_url,
                phone: profileData.phone,
                address: profileData.address,
                createdAt: profileData.created_at,
              });
              setIsAuthenticated(true);
              setActiveTab(profileData.role === 'admin' || profileData.role === 'super_admin' ? 'dashboard' : 'reservations');
            } else {
              // No profile found, sign them out and show login
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (err) {
            console.error('Failed to fetch profile:', err);
            // Show login page on error
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setStoreConfig({
          name: data.name,
          slogan: data.slogan,
          phone: data.phone,
          location: data.location,
          facebook: data.facebook,
          instagram: data.instagram,
          logo: data.logo_url
        });
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [activeTab, isMobile]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    setActiveTab(userData.role === 'admin' || userData.role === 'super_admin' ? 'dashboard' : 'reservations');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show same layout for both admin and workers, just hide features based on role
  return (
    <div className="flex min-h-screen bg-primary-bg">
      <Sidebar 
        role={user?.role || 'worker'} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobile={isMobile}
        config={storeConfig}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          user={user!} 
          config={storeConfig} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} user={user} />}
                {activeTab === 'reservations' && <Reservations user={user!} config={storeConfig} />}
                {activeTab === 'my-payments' && <WorkerPayments user={user!} />}
                {activeTab === 'prestations' && <Prestations />}
                {activeTab === 'employees' && <Employees />}
                {activeTab === 'suppliers' && <Inventory initialTab="suppliers" />}
                {activeTab === 'purchases' && <Inventory initialTab="purchases" />}
                {activeTab === 'invoices' && <Inventory initialTab="invoices" />}
                {activeTab === 'expenses' && <Expenses />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'config' && <Configuration user={user!} config={storeConfig} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

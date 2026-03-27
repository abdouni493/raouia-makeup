import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Scissors, ArrowRight } from 'lucide-react';
import { Role } from '../types';
import { supabase } from '../lib/supabase';
import { fetchUserProfile } from '../lib/utils';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('Salon');

  React.useEffect(() => {
    fetchConfigData();
  }, []);

  const fetchConfigData = async () => {
    try {
      const { data, error: err } = await supabase
        .from('store_config')
        .select('logo_url, name')
        .eq('id', 1)
        .single();
      
      if (!err && data) {
        if (data.logo_url) {
          setLogoUrl(data.logo_url);
        }
        if (data.name) {
          setStoreName(data.name);
        }
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        try {
          // Wait a moment and fetch profile
          await new Promise(resolve => setTimeout(resolve, 500));
          const profileData = await fetchUserProfile(data.user.id);

          if (!profileData) {
            setError('Profile not found. Please try signing up again.');
            setIsLoading(false);
            return;
          }

          onLogin({
            id: data.user.id,
            username: profileData.username,
            email: data.user.email,
            fullName: profileData.full_name,
            role: profileData.role,
            avatar: profileData.avatar_url,
            phone: profileData.phone,
            address: profileData.address,
            createdAt: profileData.created_at,
          });
        } catch (profileErr: any) {
          setError(profileErr.message || 'Failed to load profile');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Create profile with admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              full_name: fullName || username,
              role: 'admin',
              phone: '',
              address: '',
              payment_type: 'month',
            },
          ]);

        if (profileError) {
          setError(profileError.message);
          setIsLoading(false);
          return;
        }

        onLogin({
          id: data.user.id,
          username,
          email,
          fullName: fullName || username,
          role: 'admin' as Role,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-light/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md card-premium p-8 md:p-12 relative"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-3xl bg-linear-to-br from-accent to-accent-light flex items-center justify-center shadow-2xl shadow-accent/30 mb-8"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-3xl" />
            ) : (
              <Scissors className="text-white w-10 h-10" />
            )}
          </motion.div>
          <h1 className="text-4xl font-serif font-bold text-ink tracking-tight">
            Bienvenue
          </h1>
          <p className="text-ink/40 mt-3 font-medium text-center">
            Connectez-vous à votre espace salon {storeName}
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-widest text-ink/60 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/30 group-focus-within:text-accent transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@salon.fr"
                className="w-full input-premium pl-14"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-widest text-ink/60 ml-1">Mot de passe</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/30 group-focus-within:text-accent transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full input-premium pl-14"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-gradient shimmer flex items-center justify-center gap-3 group py-4 disabled:opacity-50">
            <span className="tracking-wide">{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;

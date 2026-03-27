import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Star, Clock } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  user?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, user }) => {
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.role === 'admin';
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date', { ascending: false })
        .limit(200);
      
      if (error) {
        console.error('Error fetching reservations:', error);
      } else {
        // Map data and provide defaults for missing fields
        const mappedData = (data || []).map((item: any) => ({
          id: item.id,
          client_name: item.client_name,
          client_phone: item.client_phone,
          prestation_id: item.prestation_id,
          date: item.date,
          time: item.time,
          total_price: item.total_price,
          paid_amount: item.paid_amount,
          status: item.status || 'pending',
          worker_id: item.worker_id,
          created_at: item.created_at,
          finalized_at: item.finalized_at
        }));
        setAppointments(mappedData);
      }
    } catch (err) {
      console.error('Exception fetching reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalReservations = appointments.length;
    const uniqueClients = new Set(appointments.map(apt => apt.client_name)).size;
    const servicesWithPrestation = appointments.filter(apt => apt.prestation_id).length;
    const percentageServicesRate = totalReservations > 0 ? Math.round((servicesWithPrestation / totalReservations) * 100) : 0;
    
    return [
      { label: 'Prestations Pourcentages', value: `${percentageServicesRate}%`, icon: Star, color: 'bg-purple-50 text-purple-600', trend: '+12.5%', isUp: true, isCurrency: false },
      { label: 'Réservations', value: totalReservations, icon: Calendar, color: 'bg-accent/10 text-accent', trend: '+8.2%', isUp: true, isCurrency: false },
      { label: 'Nouveaux Clients', value: uniqueClients, icon: Users, color: 'bg-blue-50 text-blue-600', trend: '-2.4%', isUp: false, isCurrency: false },
      { label: 'Taux de Remplissage', value: '88%', icon: TrendingUp, color: 'bg-amber-50 text-amber-600', trend: '+5.1%', isUp: true, isCurrency: false },
    ];
  }, [appointments]);

  const recentActivities = useMemo(() => {
    return appointments.slice(0, 5).map(apt => ({
      id: apt.id,
      user: apt.client_name,
      service: apt.prestation_id || 'Service',
      time: new Date(apt.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount: apt.total_price,
      status: apt.status === 'finalized' ? 'Finalisé' : 'En attente'
    }));
  }, [appointments]);

  const chartData = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        revenue: 0,
        reservations: 0
      };
    });

    // Only count finalized appointments for revenue (exclude pending)
    appointments.forEach(apt => {
      if (apt.status === 'finalized') {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        const day = last7Days.find(d => d.dateStr === aptDate);
        if (day) {
          day.revenue += Number(apt.total_price) || 0;
          day.reservations += 1;
        }
      }
    });

    return last7Days;
  }, [appointments]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-ink tracking-tight">Tableau de Bord</h2>
          <p className="text-ink/40 mt-2 font-medium">Aperçu de l'activité de votre salon aujourd'hui</p>
        </div>
        <div className="flex p-1.5 bg-primary-bg/50 border border-border/50 rounded-2xl backdrop-blur-sm">
          <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-ink/40 hover:text-accent transition-all duration-300">7 derniers jours</button>
          <button className="px-6 py-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-sm font-bold text-accent transition-all duration-300">Aujourd'hui</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium p-8 group hover:translate-y-[-4px] transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.color} shadow-inner transition-transform duration-500 group-hover:scale-110`}>
                <stat.icon size={28} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border ${stat.isUp ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-ink/40 text-[10px] font-bold uppercase tracking-widest ml-1">{stat.label}</p>
            <h3 className="text-3xl font-serif font-bold text-ink mt-2 tracking-tight">
              {stat.isCurrency ? formatCurrency(stat.value as number) : stat.value}
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className={cn(isAdmin ? "lg:col-span-2" : "lg:col-span-3", "space-y-10")}>
          {isAdmin && (
          <div className="card-premium p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-serif font-bold text-ink tracking-tight">Revenus Hebdomadaires</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  <span className="text-xs font-bold text-ink/40">Revenus (DA)</span>
                </div>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="text-accent text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-all"
                >
                  Voir détails
                </button>
              </div>
            </div>
            <div className="w-full" style={{height: '320px'}}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B76E79" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#B76E79" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(183, 110, 121, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1A1A1A66', fontSize: 11, fontWeight: 600}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#1A1A1A66', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: '1px solid rgba(183, 110, 121, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)'}}
                    itemStyle={{fontSize: '12px', fontWeight: 'bold', color: '#B76E79'}}
                    labelStyle={{fontSize: '11px', fontWeight: 'bold', color: '#1A1A1A66', marginBottom: '4px'}}
                    cursor={{stroke: '#B76E79', strokeWidth: 2}}
                    formatter={(val: number) => [formatCurrency(val), 'Revenu']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#B76E79" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          <div className="card-premium p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-serif font-bold text-ink tracking-tight">Activités Récentes</h3>
              <button 
                onClick={() => setActiveTab('reservations')}
                className="text-accent text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-all"
              >
                Tout voir
              </button>
            </div>
            <div className="space-y-6">
              {recentActivities.map((activity, idx) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="flex items-center justify-between p-5 rounded-2xl bg-primary-bg/30 border border-border/30 hover:bg-white hover:shadow-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-500">
                      <Star size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink">{activity.user}</h4>
                      <p className="text-xs text-ink/40 font-medium">{activity.service} • <span className="text-accent/60">{activity.time}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-serif font-bold text-ink">{formatCurrency(activity.amount)}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      activity.status === 'Confirmé' ? "bg-green-50 text-green-600 border-green-100" :
                      activity.status === 'En attente' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {activity.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {isAdmin && (
        <div className="space-y-10">
          <div className="card-premium p-10 bg-accent text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <h3 className="font-serif font-bold text-2xl mb-8 relative z-10">Volume de Réservations</h3>
            <div className="w-full relative z-10" style={{height: '256px'}}>
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: 600}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', backgroundColor: '#1A1A1A', color: '#FFF'}}
                    itemStyle={{fontSize: '12px', fontWeight: 'bold', color: '#B76E79'}}
                    labelStyle={{fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', marginBottom: '4px'}}
                    cursor={{fill: 'rgba(255, 255, 255, 0.05)', radius: 12}}
                    formatter={(val: number) => [`${val} réservations`, 'Volume']}
                  />
                  <Bar dataKey="reservations" fill="#FFF" radius={[10, 10, 0, 0]} barSize={24} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
              <div>
                <span className="block text-xs text-white/40 font-bold uppercase tracking-widest">Total Semaine</span>
                <span className="text-3xl font-serif font-bold">{chartData.reduce((sum, day) => sum + day.reservations, 0)}</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                <ArrowUpRight size={18} />
                +{Math.round((chartData[chartData.length - 1].reservations / (chartData[0].reservations || 1)) * 100) - 100}%
              </div>
            </div>
          </div>

          <div className="card-premium p-10">
            <h3 className="font-serif font-bold text-2xl text-ink tracking-tight mb-8">Prochains Rendez-vous</h3>
            <div className="space-y-8">
              {appointments
                .filter(apt => {
                  const aptDate = new Date(apt.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  aptDate.setHours(0, 0, 0, 0);
                  return aptDate >= today;
                })
                .sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.time}`);
                  const dateB = new Date(`${b.date}T${b.time}`);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 3)
                .map((apt, i, filteredApts) => {
                  const colors = ['bg-accent', 'bg-rose-400', 'bg-purple-400'];
                  return (
                    <div key={apt.id} className="flex items-center gap-6 group">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-ink">{apt.time}</span>
                        <div className={cn("w-0.5 h-10 bg-border/50 my-1", i === filteredApts.length - 1 && 'hidden')}></div>
                      </div>
                      <div className="flex-1 p-4 rounded-2xl bg-primary-bg/50 border border-border/30 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                        <h4 className="font-bold text-sm text-ink">{apt.client_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("w-2 h-2 rounded-full", colors[i % colors.length])}></div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                            {new Date(`${apt.date}T${apt.time}`).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} • {apt.prestation_id || 'Service'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {appointments.filter(apt => {
                const aptDate = new Date(apt.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate >= today;
              }).length === 0 && (
                <div className="text-center py-8">
                  <Clock className="mx-auto mb-3 text-ink/20" size={24} />
                  <p className="text-sm text-ink/40 font-medium">Aucun rendez-vous prévu</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveTab('reservations')}
              className="w-full mt-10 py-4 rounded-2xl bg-primary-bg text-ink/40 font-bold text-sm hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Calendar size={20} /> Voir l'agenda complet
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

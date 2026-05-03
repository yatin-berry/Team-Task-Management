import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, CheckSquare, BarChart2, Briefcase, Filter, FolderKanban, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const SkeletonLoader = () => (
  <div className="w-full h-full animate-pulse flex flex-col gap-4">
    <div className="h-8 bg-secondary rounded w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-secondary rounded-xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      <div className="h-64 bg-secondary rounded-xl"></div>
      <div className="h-64 bg-secondary rounded-xl"></div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card p-6 flex items-center justify-between relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-${color}-500 blur-2xl group-hover:bg-${color}-400 group-hover:opacity-20 transition-all`} />
    <div>
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-foreground">{value}</h3>
    </div>
    <div className={`p-4 rounded-xl bg-${color}-500/10 text-${color}-400`}>
      <Icon className="h-6 w-6" />
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const projRes = await api.get('/api/projects/');
        setProjects(projRes.data);
        if (projRes.data.length > 0) {
          setSelectedProjectId(projRes.data[0].id.toString());
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching projects', err);
        setError("Failed to load projects.");
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `/api/dashboard/?project_id=${selectedProjectId}`;
        const response = await api.get(url);
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
        setError(err.response?.data?.detail || "Failed to load dashboard statistics.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedProjectId]);

  if (loading && !stats && projects.length === 0) {
    return <SkeletonLoader />;
  }

  if (projects.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
          <FolderKanban className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Welcome to TaskFlow</h2>
        <p className="text-muted-foreground max-w-md">
          You aren't a part of any projects yet. Create a new project or ask your admin to invite you to get started.
        </p>
        <Link to="/projects" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          Go to Projects
        </Link>
      </div>
    );
  }

  const isAdmin = stats?.user_role === 'admin';

  const pieData = stats ? [
    { name: 'To Do', value: stats.todo_tasks || 0, color: '#94a3b8' },
    { name: 'In Progress', value: stats.in_progress_tasks || 0, color: '#3b82f6' },
    { name: 'Done', value: stats.done_tasks || 0, color: '#10b981' },
  ] : [];

  const userBarData = stats?.tasks_per_user ? stats.tasks_per_user.map(item => ({
    name: item.user_name,
    count: item.task_count
  })) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            {stats && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${isAdmin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary/50 text-muted-foreground border-border'}`}>
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdmin ? "Project-wide task analytics and member resource allocation." : "Your assigned tasks overview for the selected project."}
          </p>
        </div>
        
        <div className="flex items-center gap-3 glass-panel px-4 py-2 bg-secondary/30 w-full md:w-auto relative z-20">
          <Filter className="h-4 w-4 text-primary" />
          <select 
            className="custom-select bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer w-full"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && stats ? (
        <div className="opacity-50 pointer-events-none transition-opacity">
          {/* Faded state while reloading */}
        </div>
      ) : null}

      {error ? (
        <div className="glass-panel p-8 flex flex-col items-center justify-center text-center text-rose-500 bg-rose-500/5 border-rose-500/20">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-bold">Access Denied</h3>
          <p className="mt-2 text-sm opacity-80">{error}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard delay={0.1} title={isAdmin ? "Total Tasks" : "My Assigned Tasks"} value={stats.total_tasks} icon={CheckSquare} color="primary" />
            <StatCard delay={0.2} title="In Progress" value={stats.in_progress_tasks} icon={BarChart2} color="blue" />
            <StatCard delay={0.3} title="Completed" value={stats.done_tasks} icon={CheckCircle} color="emerald" />
            <StatCard delay={0.4} title="Overdue Tasks" value={stats.overdue_tasks} icon={Clock} color="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-panel p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Status Breakdown</h3>
              {stats.total_tasks === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <PieChart className="w-12 h-12 mb-4 opacity-20" />
                  <p>No tasks found.</p>
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {isAdmin && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="glass-panel p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-6">Resource Allocation</h3>
                {userBarData.length === 0 ? (
                  <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                    <Briefcase className="w-12 h-12 mb-4 opacity-20" />
                    <p>No assigned tasks to show.</p>
                  </div>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #334155', borderRadius: '8px' }}
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                        />
                        <Bar dataKey="count" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            )}
            
            {!isAdmin && (
              <motion.div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-foreground">Task Overview</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                  Member-specific charts and resource allocation are only available to project admins.
                </p>
              </motion.div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;

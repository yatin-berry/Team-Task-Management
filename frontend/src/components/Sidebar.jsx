import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border shadow-2xl relative z-20">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="bg-primary/20 p-2 rounded-xl">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          {!collapsed && <span className="ml-3 text-xl font-bold text-gradient">TaskFlow</span>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="hidden md:block text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-3">
        {links.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center rounded-xl transition-all duration-300 ${
                collapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              {!collapsed && <span className="ml-3 font-medium">{link.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3 border border-border">
            <div className="flex items-center overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-2">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card p-4 border-b border-border sticky top-0 z-30">
        <div className="flex items-center">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold text-gradient">TaskFlow</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.div 
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden md:block h-screen sticky top-0 flex-shrink-0"
      >
        {sidebarContent}
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

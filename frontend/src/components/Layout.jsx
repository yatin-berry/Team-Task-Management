import React from 'react';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 overflow-y-auto h-screen relative">
        {/* Background elements for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none" />
        
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;

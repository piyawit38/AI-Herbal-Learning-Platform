import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Link, useLocation } from "react-router-dom";
import { Home, Leaf, MessageSquare, HelpCircle } from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const mobileTabs = [
    { label: "หน้าแรก", path: "/", icon: Home },
    
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans pb-16 sm:pb-0">
      {/* Global Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* PWA Mobile Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 z-40 flex items-center justify-around py-2 px-1">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.path || (tab.path !== "/" && location.pathname.startsWith(tab.path));
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
                active
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] font-medium mt-1 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
export default Layout;

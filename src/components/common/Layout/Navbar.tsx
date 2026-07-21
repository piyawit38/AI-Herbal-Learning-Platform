import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useGarden } from "../../../contexts/GardenContext";
import { 
  Sun, 
  Moon, 
  Leaf, 
  Trophy, 
  Shield, 
  LogOut, 
  LogIn, 
  Award, 
  Sparkles, 
  User, 
  HelpCircle, 
  Camera, 
  Menu, 
  X, 
  Info, 
  Home, 
  MessageSquare 
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, loginWithGoogle } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { currentGarden, allGardens, switchGarden } = useGarden();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const menuItems = [
    { label: "เกี่ยวกับสวน", path: "/about", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-lg sm:text-xl tracking-tight">
              <Leaf className="w-6 h-6 fill-teal-500/20" />
              <span className="font-sans">AI Herbal Platform</span>
            </Link>
            
            {/* municipal tag */}
            <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/30">
              1 อปท. 1 สวนสมุนไพร
            </span>
          </div>
          
          {/* Desktop Central Menu */}
          <div className="hidden xl:flex items-center gap-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                      : "text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Controls Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Multi-Tenant Garden Selector (Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 font-medium">สวน:</span>
              <select
                value={currentGarden.gardenId}
                onChange={(e) => switchGarden(e.target.value)}
                className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-200 font-medium max-w-[140px] sm:max-w-[200px]"
              >
                {allGardens.map((g) => (
                  <option key={g.gardenId} value={g.gardenId}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={darkMode ? "เปิดโหมดแสง" : "เปิดโหมดมืด"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Auth Slot (Desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  {/* Admin Quick Entry */}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm font-semibold border border-emerald-100 dark:border-emerald-950"
                      title="ผู้ดูแลระบบ"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}

                  {/* Profile Card and Click to Dashboard */}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="ดูแดชบอร์ด"
                  >
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full border border-teal-500/20 bg-teal-50"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold leading-none mt-1">
                        ⭐ {user.totalScore} คะแนน
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 hover:shadow-teal-500/10 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Collapsible Menu Drawer */}
      {isOpen && (
        <div className="xl:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            
            {/* Multi-Tenant Garden Selector (Mobile View) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800/50">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                เลือกสวนสมุนไพร:
              </label>
              <select
                value={currentGarden.gardenId}
                onChange={(e) => {
                  switchGarden(e.target.value);
                  setIsOpen(false);
                }}
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-slate-200 font-semibold"
              >
                {allGardens.map((g) => (
                  <option key={g.gardenId} value={g.gardenId}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <span className={`${active ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth and Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-1">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full border border-teal-500/20"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {user.displayName}
                      </span>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                        ⭐ {user.totalScore} คะแนนเรียนรู้
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100/55 dark:border-emerald-950 text-center"
                      >
                        <Shield className="w-4 h-4" />
                        <span>แผงควบคุม</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100/55 dark:border-red-950 cursor-pointer text-center"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer transition-colors text-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบเก็บคะแนน</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};

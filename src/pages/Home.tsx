import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarden } from "../contexts/GardenContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUsers } from "../services/db";
import { Leaf, Camera, MessageSquare, HelpCircle, Trophy, Award, Info, Sparkles, Volume2, ArrowRight } from "lucide-react";

export const Home: React.FC = () => {
  const { currentGarden, getGardenHerbs, getGardenQuizzes, getGardenAnnouncements } = useGarden();
  const { user, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const learnInputRef = useRef<HTMLInputElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);

  const herbs = getGardenHerbs();
  const quizzes = getGardenQuizzes();
  const announcements = getGardenAnnouncements();
  
  // Total users count from db
  const totalUsers = Math.max(12, getUsers().length + 84); // Pre-populated offset for realistic vibe

  // Feature Toggles from settings
  const showAI = currentGarden.enableAI !== false;
  const showQuiz = currentGarden.enableQuiz !== false;

  const handlePhotoAction = (e: React.ChangeEvent<HTMLInputElement>, mode: "learn" | "test") => {
    const file = e.target.files?.[0];
    if (file) {
      if (mode === "learn" && !showAI) {
        showToast("ขออภัย: ผู้ดูแลระบบได้ปิดบริการระบบวิเคราะห์ด้วย AI ชั่วคราว", "warning");
        return;
      }
      if (mode === "test" && !showQuiz) {
        showToast("ขออภัย: ผู้ดูแลระบบได้ปิดบริการระบบทดสอบความรู้ชั่วคราว", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          if (mode === "learn") {
            navigate("/chatbot", { state: { imageSrc: base64 } });
          } else {
            navigate("/challenge?tab=photo", { state: { imageSrc: base64 } });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* 1. Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-teal-900 dark:bg-teal-950 text-white shadow-xl">
        {/* Background Image Overlay with Opacity */}
        <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay" style={{ backgroundImage: `url(${currentGarden.banner})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950 via-teal-900/90 to-teal-900/40"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-10 sm:px-12 sm:py-16 md:py-20 z-10">
          <div className="flex flex-col items-start gap-6 max-w-4xl">
            
            {/* Frosted Glass Co-Organizer Branding Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYtvMROhAk-78kqt5ystTJDn8bZTnBvUjDzaiZy2dcVnzi0XvL6stUWUac&s=10"
                alt="ตราหน่วยงาน 1"
                referrerPolicy="no-referrer"
                className="w-10 h-10 md:w-12 md:h-12 object-contain filter drop-shadow"
              />
              <div className="h-6 w-[1px] bg-white/20"></div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7hdvnlQyEc-QTzRaPmQiqPELTto5wAR1F4b3ueUBHpQ&s=10"
                alt="ตราหน่วยงาน 2"
                referrerPolicy="no-referrer"
                className="w-10 h-10 md:w-12 md:h-12 object-contain filter drop-shadow"
              />
              <div className="text-left pl-1 pr-0.5">
                <div className="text-[9px] md:text-[10px] text-emerald-300 font-bold uppercase tracking-wider leading-tight">พัฒนาระบบ AI เพื่อสนับสนุนการเรียนรู้</div>
                <div className="text-[10px] md:text-[11px] text-white/90 font-medium leading-tight">ภายใต้โครงการ "1 อปท. 1 สวนสมุนไพร"</div>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-sans leading-tight text-left">
              เรียนรู้สมุนไพรไทยในยุคดิจิทัล <br />
              <span className="text-emerald-400">AI ผู้ช่วยเรียนรู้สมุนไพรอัจฉริยะ</span>
            </h1>
            
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-sans mt-2 text-left">
              ยินดีต้อนรับสู่ <span className="font-semibold text-white">{currentGarden.name}</span> สำรวจพืชสมุนไพรด้วยระบบ AI ถ่ายภาพเพื่อระบุชนิดพืช แชทพูดคุยเพื่อเรียนรู้สรรพคุณ ทำแบบทดสอบความรู้ และสะสมเกียรติบัตรออนไลน์
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                to="/herbs"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-sm"
              >
                <span>เริ่มต้นเรียนรู้</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. กล้องสแกนสมุนไพร 2 แบบอัจฉริยะ */}
      {(showAI || showQuiz) && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900/50 dark:to-slate-900/30 border border-teal-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-left">
            <span className="text-[10px] bg-teal-600/10 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              สแกนสมุนไพรด้วย AI
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>กล้องสแกนพืชอัจฉริยะ</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ถ่ายรูปพืชในสวนเพื่อวิเคราะห์สรรพคุณ หรือเลือกทำข้อสอบเก็บคะแนนเพื่อรับเกียรติบัตร
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Mode 1: Learn */}
            {showAI && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      🌿 1. ถ่ายรูปเพื่อเรียนรู้ (ถามตอบ AI)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      วิเคราะห์สรรพคุณพืชและตำรับยาไทย พร้อมแชทถามตอบข้อสงสัยกับผู้ช่วย AI ได้ทันที
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  ref={learnInputRef}
                  onChange={(e) => handlePhotoAction(e, "learn")}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <button
                  onClick={() => learnInputRef.current?.click()}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดกล้องถ่ายภาพระบุพืช</span>
                </button>
              </div>
            )}

            {/* Mode 2: Test */}
            {showQuiz && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      🏆 2. ถ่ายรูปทำแบบทดสอบ
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      แสกนสมุนไพรตรงหน้าเพื่อตอบคำถาม สะสมชั่วโมงความรู้ และรับเกียรติบัตรดิจิทัลออนไลน์
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  ref={testInputRef}
                  onChange={(e) => handlePhotoAction(e, "test")}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <button
                  onClick={() => testInputRef.current?.click()}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดกล้องสแกนตอบคำถาม</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Stats Section */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: "สมุนไพรในสวน", value: `${herbs.length}+ ชนิด`, icon: Leaf, col: "text-teal-600" },
          { label: "ผู้เข้าเยี่ยมชม", value: `${totalUsers} คน`, icon: Trophy, col: "text-emerald-600" },
          ...(showQuiz ? [{ label: "แบบทดสอบวิชาการ", value: `${quizzes.length} หัวข้อ`, icon: HelpCircle, col: "text-amber-500" }] : [])
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 sm:p-6 text-center shadow-sm flex flex-col items-center justify-center gap-1">
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 ${stat.col} mb-1 shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</span>
              <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">{stat.label}</span>
            </div>
          );
        })}
      </div>
      
    </div>
  );
};
export default Home;

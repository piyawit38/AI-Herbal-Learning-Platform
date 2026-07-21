import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getHerb, saveHerb, getHerbs } from "../services/db";
import { HERBAL_CATEGORIES } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useGarden } from "../contexts/GardenContext";
import {
  Volume2, VolumeX, Sparkles, AlertTriangle, BookOpen, MapPin,
  QrCode, Info, ChevronLeft, CheckCircle, HelpCircle, Eye, CornerDownRight,
  Leaf, Award, Edit
} from "lucide-react";

export const HerbDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addCompletedHerb } = useAuth();
  const { showToast } = useToast();
  const { currentGarden } = useGarden();

  const [herb, setHerb] = useState(getHerb(id || ""));
  const [activeImg, setActiveImg] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const fetched = getHerb(id || "");
    if (fetched) {
      setHerb(fetched);
      setActiveImg(fetched.images?.[0] || "");
      
      // Increment view count dynamically on load
      const updated = { ...fetched, viewCount: (fetched.viewCount || 0) + 1 };
      saveHerb(updated);
    }
  }, [id]);

  // Clean up speech on page exit
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!herb) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">ไม่พบข้อมูลสมุนไพรนี้ในฐานข้อมูล</h2>
        <button onClick={() => navigate("/herbs")} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">
          กลับสู่ฐานข้อมูล
        </button>
      </div>
    );
  }

  const catInfo = HERBAL_CATEGORIES.find((c) => c.id === herb.category);
  const isLearned = user?.completedHerbs.includes(herb.herbId) || false;

  // TTS Reader logic
  const handleToggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // safety clear

      // Construct complete descriptive Thai text to read aloud
      const textToSpeak = `
        สมุนไพร ${herb.thaiName} หรือที่เรียกกันในท้องถิ่นว่า ${herb.localName || herb.thaiName}
        มีชื่อวิทยาศาสตร์ว่า ${herb.scientificName} จัดอยู่ในวงศ์ ${herb.family}
        ลักษณะทางพฤกษศาสตร์คือ ${herb.description}
        สรรพคุณสำคัญได้แก่ ${herb.properties.join(", ")}
        วิธีใช้คือ ${herb.usage}
        ข้อควรระวังคือ ${herb.precautions}
      `;

      const newUtterance = new SpeechSynthesisUtterance(textToSpeak);
      newUtterance.lang = "th-TH";
      newUtterance.rate = 1.0;
      
      newUtterance.onend = () => {
        setIsPlaying(false);
      };
      newUtterance.onerror = () => {
        setIsPlaying(false);
      };

      setUtterance(newUtterance);
      window.speechSynthesis.speak(newUtterance);
      setIsPlaying(true);
      showToast("กำลังเริ่มอ่านออกเสียงข้อมูลสมุนไพรด้วยเสียงพูดภาษาไทย", "info");
    }
  };

  const handleMarkAsLearned = async () => {
    if (!user) {
      showToast("กรุณาเข้าสู่ระบบก่อนเพื่อสะสมคะแนนการเรียนรู้", "warning");
      return;
    }
    try {
      await addCompletedHerb(herb.herbId);
      showToast(`ยอดเยี่ยม! คุณได้เรียนรู้ "${herb.thaiName}" สำเร็จ และได้รับ 10 คะแนน`, "success");
    } catch (e) {
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  // Get Related Herbs models
  const allHerbs = getHerbs(currentGarden.gardenId);
  const manualRelated = allHerbs.filter(h => herb.relatedHerbs?.includes(h.herbId));
  
  // AI Recommendation fallback: find herbs in the same category or family
  const aiRecommended = allHerbs
    .filter(h => h.herbId !== herb.herbId && (h.category === herb.category || h.family === herb.family))
    .slice(0, 3);
    
  const relatedHerbsModels = manualRelated.length > 0 ? manualRelated : aiRecommended;
  const isAiRecommended = manualRelated.length === 0 && relatedHerbsModels.length > 0;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Back Button and Action Headers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/herbs")}
            className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>ย้อนกลับ</span>
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลสมุนไพรนี้</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* TTS Audio Speaker Button */}
          <button
            onClick={handleToggleSpeech}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isPlaying
                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900"
            }`}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlaying ? "หยุดเสียงบรรยาย" : "ฟังเสียงบรรยายภาษาไทย"}</span>
          </button>

          {/* Ask AI Helper (Context loaded) */}
          <button
            onClick={() => navigate(`/chatbot?herb=${herb.herbId}`)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>คุยถาม AI เกี่ยวกับตัวนี้</span>
          </button>

          {/* Learn Checkbox */}
          <button
            onClick={handleMarkAsLearned}
            disabled={isLearned}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isLearned
                ? "bg-emerald-500 text-white cursor-not-allowed opacity-90"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isLearned ? "เรียนรู้สำเร็จแล้ว" : "ทำเครื่องหมายเรียนรู้แล้ว (+10)"}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left (Images & Map) / Right (Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visual Area (Images, QR Code, Location Map) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 dark:border-slate-850 shadow-sm relative">
              <img src={activeImg || "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop"} alt={herb.thaiName} className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 text-[10px] font-bold bg-slate-900/60 backdrop-blur-xs text-white px-2 py-0.5 rounded flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>มีผู้เข้าชมแล้ว {herb.viewCount || 0} ครั้ง</span>
              </span>
            </div>
            
            {/* Gallery Thumbnail Strip */}
            {herb.images && herb.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {herb.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      activeImg === img ? "border-teal-500" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt={`ภาพประกอบ ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location and QR Code Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span>ตำแหน่งและรหัสคิวอาร์สำหรับพืช</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Auto generated visual QR code mock */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white p-1 rounded border border-slate-200 flex items-center justify-center relative">
                  <QrCode className="w-full h-full text-slate-800" />
                  <div className="absolute inset-0 m-auto w-6 h-6 bg-white border border-teal-100 rounded-md flex items-center justify-center p-0.5">
                    <Leaf className="w-full h-full text-teal-600" />
                  </div>
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-2 tracking-wider">QR_CODE_{herb.herbId}</span>
              </div>

              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">พิกัดทางกายภาพในสวน:</span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {herb.location || "ไม่ได้ระบุตำแหน่งเฉพาะเจาะจง"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  * ท่านสามารถสแกนแผ่น QR Code ที่ติดตั้งอยู่หน้าแปลงสมุนไพรจริงด้วยสมาร์ทโฟนเพื่อเชื่อมต่อมายังหน้านี้โดยตรงได้ทันที
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Information Sheet (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Title Information */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {catInfo && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase flex items-center gap-1" style={{ backgroundColor: catInfo.color }}>
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.name}</span>
                </span>
              )}
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">
                วงศ์: {herb.family}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4.5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {herb.thaiName}
            </h1>

            {herb.localName && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                ชื่อท้องถิ่น: <span className="text-slate-700 dark:text-slate-300">{herb.localName}</span>
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono italic">
              {herb.scientificName}
            </p>
          </div>

          {/* Description Block */}
          <section className="bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>ลักษณะทางพฤกษศาสตร์</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {herb.description}
            </p>
          </section>

          {/* Properties lists & Usage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <section className="space-y-2.5">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Award className="w-4 h-4 text-teal-600" />
                <span>สรรพคุณทางยา</span>
              </h3>
              <ul className="space-y-1.5">
                {herb.properties?.map((prop, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold flex items-start gap-2">
                    <span className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0">✦</span>
                    <span>{prop}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2.5">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>ส่วนที่ใช้ & วิธีใช้</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {herb.usage}
              </p>
            </section>

          </div>

          {/* Warnings and Precautions */}
          {herb.precautions && (
            <section className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-left">
              <h4 className="font-extrabold text-xs sm:text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>ข้อควรระวังสำคัญ</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {herb.precautions}
              </p>
            </section>
          )}

          {/* References info */}
          {herb.reference && herb.reference.length > 0 && (
            <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                แหล่งข้อมูลอ้างอิงทางวิชาการ
              </h4>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                {herb.reference.map((ref, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related Herbs link */}
          {relatedHerbsModels.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                {isAiRecommended ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 dark:text-emerald-400">AI แนะนำพืชที่ควรศึกษาต่อ</span>
                  </>
                ) : (
                  <span>สมุนไพรที่เกี่ยวข้อง</span>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedHerbsModels.map((relHerb) => (
                  <Link
                    key={relHerb.herbId}
                    to={`/herbs/${relHerb.herbId}`}
                    className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 hover:border-teal-500/20 dark:border-slate-800 dark:hover:border-teal-400/20 bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all"
                  >
                    <img src={relHerb.images?.[0]} alt={relHerb.thaiName} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                    <div className="text-left overflow-hidden">
                      <span className="font-bold text-xs sm:text-sm text-slate-850 dark:text-slate-200 block truncate hover:text-teal-600">
                        🌿 {relHerb.thaiName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{relHerb.scientificName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>

      </div>

    </div>
  );
};
export default HerbDetail;

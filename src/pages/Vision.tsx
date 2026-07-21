import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGarden } from "../contexts/GardenContext";
import { useToast } from "../contexts/ToastContext";
import { Camera, Upload, RefreshCw, AlertCircle, Sparkles, Check, ChevronRight, Leaf } from "lucide-react";

interface VisionResult {
  identifiedName: string;
  scientificName: string;
  confidence: number;
  matchedHerbId: string | null;
  similarHerbs: string[];
  analysisText: string;
}

export const Vision: React.FC = () => {
  const { currentGarden, getGardenHerbs } = useGarden();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live streaming states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraActive(true);
    setImageSrc(null);
    setResult(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("เบราว์เซอร์นี้ไม่รองรับการสตรีมกล้องวิดีโอโดยตรง หรือการเข้าถึงถูกบล็อกโดย Iframe");
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      showToast("เปิดระบบกล้องถ่ายสดสำเร็จแล้ว!", "success");
    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMsg = "ไม่สามารถเชื่อมต่อกล้องวิดีโอสดได้";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "เบราว์เซอร์ปฏิเสธการเข้าถึงกล้อง (หรือติดสิทธิ์ความปลอดภัย Iframe Sandbox) กรุณาตรวจสอบว่าอนุญาตให้ใช้กล้องในแอดเดรสบาร์แล้ว หรือสลับไปใช้ 'ถ่ายรูปด่วนผ่านระบบมือถือ' ด้านล่างแทน";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "ไม่พบอุปกรณ์กล้องวิดีโอบนเครื่องนี้";
      } else {
        errorMsg = `ข้อผิดพลาด: ${err.message || err}`;
      }
      setCameraError(errorMsg);
      setIsLiveCameraActive(false);
      showToast("ระบบสลับกลับมาโหมดอัปโหลดรูปภาพหลักให้เรียบร้อยแล้ว", "info");
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsLiveCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        // Set dimensions match video stream
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImageSrc(dataUrl);
        
        // Stop stream
        stopLiveCamera();
        
        // Run analysis
        analyzeImage(dataUrl, "image/jpeg");
      }
    }
  };

  // High-res presets for mock/instant scanning demos
  const presetImages = [
    {
      name: "ใบฟ้าทะลายโจร",
      src: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=400&auto=format&fit=crop",
      type: "image/jpeg"
    },
    {
      name: "ขมิ้นชันหั่นแว่น",
      src: "https://www.dd-productbkk.com/uploads/products/img/cover/l/32_p31.jpg",
      type: "image/jpeg"
    },
    {
      name: "ใบกะเพราสมุนไพร",
      src: "https://images.unsplash.com/photo-1628111623869-7006a8f7122a?q=80&w=400&auto=format&fit=crop",
      type: "image/jpeg"
    }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setResult(null);
          analyzeImage(event.target.result as string, file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = async (src: string, name: string) => {
    try {
      setAnalyzing(true);
      setImageSrc(src);
      setResult(null);
      showToast(`โหลดรูปภาพตัวอย่าง "${name}" แล้ว กำลังวิเคราะห์...`, "info");
      
      // Fetch the preset image and convert to Base64 to send to server
      const response = await fetch(src);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        analyzeImage(reader.result as string, blob.type);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      setAnalyzing(false);
      showToast("ไม่สามารถประมวลผลรูปภาพตัวอย่างได้", "error");
    }
  };

  const analyzeImage = async (base64Payload: string, mimeType: string) => {
    try {
      setAnalyzing(true);
      const herbsList = getGardenHerbs();

      const response = await fetch("/api/gemini/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Payload,
          mimeType,
          gardenName: currentGarden.name,
          herbsList
        })
      });

      if (!response.ok) {
        throw new Error("ระบบวิเคราะห์ขัดข้องชั่วคราว");
      }

      const data: VisionResult = await response.json();
      setResult(data);
      showToast("วิเคราะห์ภาพสำเร็จอัจฉริยะ!", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || "ไม่สามารถวิเคราะห์สมุนไพรได้ กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const resetScanner = () => {
    setImageSrc(null);
    setResult(null);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Title block */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>📷 AI วิเคราะห์ภาพสมุนไพร</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          ถ่ายรูปหรืออัปโหลดรูปพืชพรรณเพื่อตรวจหาว่าตรงกับสมุนไพรชนิดใดในสวน <span className="font-semibold text-teal-600 dark:text-teal-400">{currentGarden.name}</span> ด้วยขุมพลัง AI วิเคราะห์สายพันธุ์
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload Zone (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* If live webcam is active, show the webcam streaming viewfinder */}
          {isLiveCameraActive ? (
            <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-md relative aspect-video border-4 border-teal-600">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-teal-600 text-white font-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white block animate-ping" />
                กล้องถ่ายสดออนไลน์ (Live Camera)
              </div>
              
              {/* Camera Action Overlay Bar */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="px-4 py-2.5 bg-slate-900/90 text-slate-200 hover:bg-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ยกเลิกกล้องสด
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg flex items-center gap-2 transition-all scale-105 active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>กดถ่ายรูปเดี๋ยวนี้</span>
                </button>
              </div>
            </div>
          ) : !imageSrc ? (
            /* Upload and Live selection card */
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-10 text-center shadow-xs flex flex-col items-center justify-center gap-4 transition-all hover:border-teal-500/30">
                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
                  <Camera className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">เข้าถึงกล้องสแกนสมุนไพร</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                    เลือกวิธีที่สะดวกที่สุดของคุณเพื่อถ่ายภาพและระบุสมุนไพรในสวนได้ทันที
                  </p>
                </div>
                
                {/* Dual action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={startLiveCamera}
                    className="w-full sm:w-1/2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 เปิดกล้องวิดีโอสด</span>
                  </button>
                  <button
                    onClick={triggerUpload}
                    className="w-full sm:w-1/2 px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-750"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📁 ถ่ายผ่านระบบมือถือ / อัปโหลด</span>
                  </button>
                </div>

                {/* Explicit Camera permission troubleshooting help guide */}
                <div className="w-full text-left bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-4 mt-2 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>💡 ไม่พบกล้อง หรือปุ่มเปิดกล้องใช้ไม่ได้?</span>
                  </h4>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li>
                      <span className="font-bold text-slate-800 dark:text-slate-200">แนะนำสำหรับมือถือ:</span> ให้คลิกปุ่มสีเทา <span className="font-bold">"ถ่ายผ่านระบบมือถือ / อัปโหลด"</span> ด้านบน ระบบปฏิบัติการ (iOS หรือ Android) จะเปิดอินเทอร์เฟซกล้องถ่ายรูปแบบเนทีฟของตัวเครื่องให้คุณทันที ซึ่งทำงานได้เสถียรที่สุดและไม่ต้องขอสิทธิ์ผ่านเบราว์เซอร์แยก!
                    </li>
                    <li>
                      <span className="font-bold text-slate-800 dark:text-slate-200">สิทธิ์บนเบราว์เซอร์:</span> สำหรับคอมพิวเตอร์ โปรดคลิกที่ไอคอนแม่กุญแจ 🔒 หรือกล้องถ่ายรูปที่มุมซ้ายบนของเบราว์เซอร์ (Address Bar) เพื่อกด <span className="font-bold">"อนุญาต (Allow)"</span> เข้าถึงสิทธิ์กล้องวิดีโอของอุปกรณ์
                    </li>
                  </ul>
                </div>

                {/* Sample presets strip for immediate demo */}
                <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    หรือคลิกเลือกรูปตัวอย่างเพื่อทดสอบระบบสแกน:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {presetImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(img.src, img.name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-150 dark:border-slate-700 cursor-pointer"
                      >
                        🌱 {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Active preview zone */
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm relative">
              <img src={imageSrc} alt="ภาพสมุนไพรที่เลือก" className="w-full h-80 sm:h-[420px] object-cover" />
              
              {/* Overlay states */}
              {analyzing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-4">
                  <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
                  <div className="text-center space-y-1">
                    <p className="font-bold text-base tracking-wide">กำลังประมวลผลรูปภาพด้วย AI</p>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      โปรดรอสักครู่ ระบบคอมพิวเตอร์วิทัศน์กำลังจับคู่ลักษณะใบ ดอก และผลกับพืชพรรณในสวน...
                    </p>
                  </div>
                </div>
              )}

              {/* Clear button */}
              {!analyzing && (
                <button
                  onClick={resetScanner}
                  className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xs text-white hover:bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สแกนใบอื่นใหม่</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Scan Analysis Result (5 Columns) */}
        <div className="lg:col-span-5">
          
          {result ? (
            /* Analysis Display */
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
                  <Sparkles className="w-3.5 h-3.5 fill-teal-500/10" />
                  ผลการวิเคราะห์โดยปัญญาประดิษฐ์
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                  🌿 {result.identifiedName}
                </h2>
                <p className="text-xs font-mono italic text-slate-500 dark:text-slate-400">
                  {result.scientificName}
                </p>
              </div>

              {/* Confidence Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>ความแม่นยำในการคาดการณ์</span>
                  <span className="text-teal-600 dark:text-teal-400">{result.confidence}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${result.confidence}%` }}
                  ></div>
                </div>
              </div>

              {/* Botanical Analysis text details */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500 block">
                  คำอธิบายทางกายภาพและพฤกษศาสตร์:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  {result.analysisText}
                </p>
              </div>

              {/* Matched Database Link */}
              {result.matchedHerbId ? (
                <div className="p-4 rounded-xl bg-teal-600/5 dark:bg-teal-400/5 border border-teal-500/15 flex items-center justify-between text-left">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">พบต้นไม้พันธุ์นี้ในสวน!</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      มีบอร์ดป้ายชื่อเรียนรู้ในระบบ
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/herbs/${result.matchedHerbId}`)}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    ดูข้อมูลพืช
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">ไม่พบข้อมูลในสวนหลัก</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      ขออภัยด้วยครับ พืชสมุนไพรชนิดนี้ยังไม่ได้เพาะปลูกในสวน <span className="font-semibold text-slate-700 dark:text-slate-300">{currentGarden.name}</span> ขณะนี้
                    </p>
                  </div>
                </div>
              )}

              {/* Similar plants list */}
              {result.similarHerbs && result.similarHerbs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500 block">
                    สายพันธุ์ใกล้เคียงหรือสับสนได้ง่าย:
                  </span>
                  <div className="flex flex-col gap-2">
                    {result.similarHerbs.map((sh, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="text-teal-500">🌿</span>
                        <span>{sh}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Standby State */
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-600 dark:text-slate-400">รอรับข้อมูลประมวลผล</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-xs leading-normal mx-auto">
                  เมื่อคุณเลือกถ่ายภาพสมุนไพรหรือใช้ตัวอย่างใบไม้ ผลลัพธ์วิเคราะห์สายพันธุ์จะแสดงขึ้นที่นี่ทันที
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default Vision;

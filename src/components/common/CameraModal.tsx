import React, { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Data: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and update stream when facingMode changes
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    setLoading(true);
    setError(null);

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Camera access failed:", err);
        // Fallback to general camera video if exact environment camera is blocked or unavailable
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((s) => {
            activeStream = s;
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
            setLoading(false);
          })
          .catch((fallbackErr) => {
            console.error("Fallback camera access failed:", fallbackErr);
            setError(
              "ไม่สามารถเข้าถึงกล้องจริงได้ในเบราว์เซอร์นี้ กรุณาลองเปิดแอปในหน้าต่างใหม่ (เปิดในแท็บใหม่แทนที่จะอยู่ใน iFrame) หรือใช้วิธีอัปโหลดรูปภาพจากปุ่ม 'เลือกคลังภาพ/อัลบั้ม' แทน"
            );
            setLoading(false);
          });
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Use natural video dimensions for high resolution
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(dataUrl);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[600px]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 text-left">
            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping"></div>
            <span className="font-extrabold text-sm text-slate-100">กล้องสแกนสมุนไพรสด AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3 z-25">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
              <span className="text-xs font-bold text-slate-300">กำลังเชื่อมต่อกล้องสดของคุณ...</span>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-400 p-6 text-center gap-4 z-25">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500">
                <X className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-300">
                {error}
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
          )}

          {/* High-tech Scanning Grid Overlay */}
          {!loading && !error && (
            <div className="absolute inset-0 pointer-events-none border-[3px] border-teal-500/20 m-6 rounded-xl flex items-center justify-center">
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-80 animate-scan"></div>
              
              {/* Corner Focus Brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-md"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-md"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-md"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-md"></div>
              
              <span className="absolute bottom-4 text-[10px] font-mono tracking-widest text-teal-400 bg-slate-950/80 px-2.5 py-1 rounded-full uppercase">
                AI FOCUS LOCK
              </span>
            </div>
          )}
        </div>

        {/* Control Action Tray */}
        <div className="px-6 py-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          {/* Switch Camera Button */}
          <button
            onClick={toggleFacingMode}
            disabled={!!error || loading}
            type="button"
            className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold border border-slate-700 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">สลับกล้อง หน้า/หลัง</span>
          </button>

          {/* Big Shutter Shutter Circular Button */}
          <button
            onClick={handleCapture}
            disabled={!!error || loading}
            type="button"
            className="w-14 h-14 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 disabled:scale-100 cursor-pointer border-4 border-slate-900 ring-2 ring-teal-500/40"
          >
            <Camera className="w-6 h-6 shrink-0" />
          </button>

          {/* Fallback upload indicator */}
          <div className="text-right text-[10px] text-slate-500 font-medium max-w-[120px] leading-tight">
            จับภาพสมุนไพรให้อยู่ในกรอบเลนส์เพื่อความแม่นยำ
          </div>
        </div>

      </div>
      
      {/* Laser CSS style */}
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0.1; }
          50% { top: 90%; opacity: 0.9; }
          100% { top: 10%; opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

import React, { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw, AlertCircle, ExternalLink, Upload } from "lucide-react";

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

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        "เบราว์เซอร์หรือสภาวะ iFrame ปัจจุบันจำกัดการทำงานของกล้องสแกนสดโดยตรง"
      );
      setLoading(false);
      return;
    }

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
              "เบราว์เซอร์หรือสภาวะ iFrame ปัจจุบันจำกัดการทำงานของกล้องสแกนสดโดยตรง"
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

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onCapture(base64);
      onClose();
    };
    reader.readAsDataURL(file);
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
            <div className={`w-2.5 h-2.5 rounded-full ${error ? 'bg-amber-500' : 'bg-teal-500 animate-ping'}`}></div>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center gap-5 z-25">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <span className="text-sm font-extrabold text-teal-400 block">เปิดระบบถ่ายภาพสำรอง</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  เนื่องจากติดระบบความปลอดภัยของเบราว์เซอร์หรือการจำกัดใน iFrame ของระบบแสดงตัวอย่าง ท่านสามารถเลือกใช้งานได้โดยตรง 2 วิธีดังนี้:
                </p>
              </div>

              <div className="flex flex-col gap-3.5 w-full max-w-xs">
                {/* 1. Launch system native camera via input file */}
                <div className="relative overflow-hidden rounded-xl w-full">
                  <input
                    type="file"
                    onChange={handleNativeFileChange}
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-teal-500 shadow-md">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>📸 ถ่ายภาพด้วยกล้องมือถือตรงๆ</span>
                  </div>
                </div>

                {/* 2. Open in new tab for live WebRTC scanner */}
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.href, "_blank");
                  }}
                  className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>🔗 เปิดในแท็บใหม่เพื่อใช้กล้องสแกนสด AI</span>
                </button>
              </div>
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
          {error ? (
            <div className="text-center w-full text-[10px] text-slate-500 font-semibold leading-relaxed">
              * การถ่ายภาพสดรองรับสมาร์ทโฟนเต็มรูปแบบผ่านกล้องระบบและกล้องในหน้าต่างใหม่
            </div>
          ) : (
            <>
              {/* Switch Camera Button */}
              <button
                onClick={toggleFacingMode}
                disabled={loading}
                type="button"
                className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold border border-slate-700 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">สลับกล้อง หน้า/หลัง</span>
              </button>

              {/* Big Shutter Shutter Circular Button */}
              <button
                onClick={handleCapture}
                disabled={loading}
                type="button"
                className="w-14 h-14 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 disabled:scale-100 cursor-pointer border-4 border-slate-900 ring-2 ring-teal-500/40"
              >
                <Camera className="w-6 h-6 shrink-0" />
              </button>

              {/* Direct native camera shortcut within WebRTC mode as quick fallback */}
              <div className="relative overflow-hidden rounded-xl">
                <input
                  type="file"
                  onChange={handleNativeFileChange}
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ใช้กล้องระบบตรงๆ</span>
                </button>
              </div>
            </>
          )}
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

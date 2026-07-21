import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useGarden } from "../contexts/GardenContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getHerb, getUsers } from "../services/db";
import {
  HelpCircle, RefreshCw, Sparkles, Send, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Trophy, BookOpen, AlertCircle,
  Camera, Upload, Check, RotateCcw, Award, Leaf, Printer, Share2, QrCode, Shield, Compass, FileText
} from "lucide-react";

// Types for Game
interface GameHerb {
  id: string;
  name: string;
  scientific: string;
  image: string;
  correctProperty: string;
  distractors: string[];
}

export const Challenge: React.FC = () => {
  const { currentGarden, getGardenQuizzes, getGardenHerbs } = useGarden();
  const { user, addScore } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Generate realistic leaderboard ranking list by combining database active users with pre-seeded mockup contenders
  const rankingList = useMemo(() => {
    const rawUsers = getUsers();
    
    // Seed competitors for a vibrant, realistic leaderboard atmosphere
    const seedContenders = [
      { displayName: "นพ. ดนัย ศรีเกียรติ", scoreOffset: 48, completedOffset: 4, photoSeed: "Danai" },
      { displayName: "กุลธิดา เพชรแสน", scoreOffset: 32, completedOffset: 3, photoSeed: "Kultida" },
      { displayName: "อรรถพล เมืองสิริ", scoreOffset: 25, completedOffset: 2, photoSeed: "Attaphol" },
      { displayName: "วรัญญา กิ่งแก้ว", scoreOffset: 18, completedOffset: 1, photoSeed: "Waranya" },
      { displayName: "พิชชาภา บูรณะ", scoreOffset: 12, completedOffset: 1, photoSeed: "Pitchapa" },
    ];

    let combined = rawUsers.map((u) => ({
      displayName: u.displayName,
      photoURL: u.photoURL,
      level: u.level,
      completedCount: u.completedHerbs.length,
      totalScore: u.totalScore,
      isCurrentUser: user?.userId === u.userId
    }));

    // Inject seed contenders
    seedContenders.forEach((c) => {
      if (user?.displayName === c.displayName) return;
      combined.push({
        displayName: c.displayName,
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.photoSeed)}`,
        level: c.scoreOffset > 30 ? "explorer" : "beginner",
        completedCount: c.completedOffset,
        totalScore: c.scoreOffset,
        isCurrentUser: false
      });
    });

    if (user && !combined.some((u) => u.isCurrentUser)) {
      combined.push({
        displayName: user.displayName,
        photoURL: user.photoURL,
        level: user.level,
        completedCount: user.completedHerbs.length,
        totalScore: user.totalScore,
        isCurrentUser: true
      });
    }

    // Sort by score descending
    combined.sort((a, b) => b.totalScore - a.totalScore);

    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [user]);

  // Active quiz tab: "photo" (gorgeous new photo quiz), "standard" (original trivia quizzes list), or "certificate"
  const tabParam = searchParams.get("tab") as "photo" | "standard" | "certificate";
  const [activeTab, setActiveTab] = useState<"photo" | "standard" | "certificate">(
    tabParam === "certificate" || tabParam === "standard" || tabParam === "photo" ? tabParam : "photo"
  );

  // Sync tab state with URL query parameter
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && (currentTab === "photo" || currentTab === "standard" || currentTab === "certificate")) {
      setActiveTab(currentTab as "photo" | "standard" | "certificate");
    }
  }, [searchParams]);

  const handleTabChange = (tab: "photo" | "standard" | "certificate") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const todayString = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (type: string) => {
    const shareUrl = `${window.location.origin}/challenge?tab=certificate&type=${type}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("คัดลอกลิงก์ตรวจสอบผลการเรียนรู้อัจฉริยะแล้ว! คุณสามารถใช้แชร์เพื่อแสดงความรู้อัจฉริยะได้", "success");
  };

  // --- STATE FOR ORIGINAL TRIVIA QUIZZES ---
  const quizzes = getGardenQuizzes();
  const [standardActiveIdx, setStandardActiveIdx] = useState(0);
  const [standardUserAnswer, setStandardUserAnswer] = useState("");
  const [standardGrading, setStandardGrading] = useState(false);
  const [standardGradeResult, setStandardGradeResult] = useState<any>(null);
  const [standardCorrectCount, setStandardCorrectCount] = useState(0);
  const [standardFinished, setStandardFinished] = useState(false);

  // --- STATE FOR NEW PHOTO/AI CHALLENGE ---
  // Step list: IDLE -> SCANNING -> Q1_RECOGNITION -> Q1_RECOGNITION_RESULT -> Q1_FOLLOWUP -> Q1_FOLLOWUP_RESULT -> Q2_TRIVIA -> Q2_RESULT -> Q3_TRIVIA -> Q3_RESULT -> SUMMARY
  const [gameState, setGameState] = useState<
    "IDLE" | "SCANNING" | "Q1_RECOGNITION" | "Q1_RECOGNITION_RESULT" | "Q1_FOLLOWUP" | "Q1_FOLLOWUP_RESULT" | "Q2_TRIVIA" | "Q2_RESULT" | "Q3_TRIVIA" | "Q3_RESULT" | "SUMMARY"
  >("IDLE");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeGameHerb, setActiveGameHerb] = useState<GameHerb | null>(null);
  
  // Question 1 Inputs & Outputs
  const [q1Guess, setQ1Guess] = useState("");
  const [isQ1Correct, setIsQ1Correct] = useState<boolean>(false);
  
  // Followup / Properties Question Input
  const [selectedPropertyOption, setSelectedPropertyOption] = useState<string | null>(null);
  const [propertiesOptions, setPropertiesOptions] = useState<string[]>([]);
  const [isPropertyCorrect, setIsPropertyCorrect] = useState<boolean>(false);

  // General Questions 2 & 3 Inputs
  const [q2SelectedOption, setQ2SelectedOption] = useState<string | null>(null);
  const [q3SelectedOption, setq3SelectedOption] = useState<string | null>(null);
  const [isQ2Correct, setIsQ2Correct] = useState<boolean>(false);
  const [isQ3Correct, setIsQ3Correct] = useState<boolean>(false);

  // Final scoring tracking for photo challenge
  const [photoScoreEarned, setPhotoScoreEarned] = useState(0);
  const [savingScore, setSavingScore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

    const presetHerbs: GameHerb[] = [
      {
        id: "HERB001",
        name: "ฟ้าทะลายโจร",
        scientific: "Andrographis paniculata",
        image: "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?q=80&w=400&auto=format&fit=crop",
        correctProperty: "แก้ไข้หวัด ตัวร้อน บรรเทาอาการเจ็บคอ ทอนซิลอักเสบ",
      distractors: [
        "บรรเทาอาการท้องอืด ท้องเฟ้อ จุกเสียด และขับลมในลำไส้",
        "บำรุงหัวใจ กระตุ้นระบบหมุนเวียนโลหิต และบรรเทาอาการหน้ามืด",
        "รักษาโรคผิวหนังอักเสบเรื้อรัง กลากเกลื้อน และตุ่มหนอง"
      ]
    },
    {
      id: "HERB002",
      name: "ขมิ้นชัน",
      scientific: "Curcuma longa L.",
      image: "https://www.dd-productbkk.com/uploads/products/img/cover/l/32_p31.jpg",
      correctProperty: "บรรเทาอาการท้องอืด ท้องเฟ้อ จุกเสียด และรักษาแผลในกระเพาะอาหาร",
      distractors: [
        "แก้ไข้หวัด ตัวร้อน บรรเทาอาการไอ และขับเสมหะระคายคอ",
        "บำรุงประสาทและสมอง ป้องกันภาวะความจำเสื่อม อัลไซเมอร์",
        "แก้ตุ่มคัน บรรเทาอาการอักเสบจากแมลงสัตว์กัดต่อยและงูสวัด"
      ]
    },
      {
        id: "HERB003",
        name: "กะเพราแดง",
        scientific: "Ocimum tenuiflorum L.",
        image: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?q=80&w=400&auto=format&fit=crop",
        correctProperty: "ขับลม แก้ปวดท้อง จุกเสียดแน่นเฟ้อ และช่วยบำรุงธาตุไฟกระตุ้นน้ำนมแม่",
      distractors: [
        "บำรุงหนังศีรษะ ขจัดรังแค แก้ผมร่วงและผมแตกปลาย",
        "ลดระดับน้ำตาลในเลือด รักษาโรคเบาหวานเฉียบพลัน",
        "ขับพยาธิในระบบทางเดินอาหาร และฟื้นฟูกล้ามเนื้ออ่อนแรง"
      ]
    },
      {
        id: "HERB004",
        name: "เสลดพังพอนตัวเมีย",
        scientific: "Clinacanthus nutans",
        image: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=400&auto=format&fit=crop",
        correctProperty: "แก้พิษแมลงสัตว์กัดต่อย ตะขาบ ยุงกัด รักษาอาการเริม และงูสวัด",
      distractors: [
        "ช่วยขับปัสสาวะ รักษานิ่วในไต และบรรเทาอาการกระเพาะปัสสาวะอักเสบ",
        "ชำระเมือกมันในลำไส้ ช่วยระบายของเสียสะสม",
        "บำรุงธาตุ บำรุงหัวใจ แก้อาการอ่อนเพลียเรื้อรัง"
      ]
    },
      {
        id: "HERB005",
        name: "พุดซ้อน",
        scientific: "Gardenia jasminoides",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&auto=format&fit=crop",
        correctProperty: "ดับพิษร้อน ถอนพิษไข้ ดอกคั้นเอาน้ำต้มช่วยผ่อนคลายทำให้นอนหลับง่าย",
      distractors: [
        "แก้อาการท้องร่วง ท้องเสียเฉียบพลัน และอาการบิดมีมูกปนเลือด",
        "กระตุ้นการเผาผลาญไขมันสะสมในเซลล์ตับ",
        "รักษาตาปลา ผิวพองหนา และสมานแผลแห้งกร้าน"
      ]
    }
  ];

  // Q2 & Q3 static high-quality trivia database
  const q2Data = {
    question: "ขมิ้นชันประกอบด้วยสารสำคัญชนิดใดที่มีฤทธิ์ต้านอนุมูลอิสระ ต้านการอักเสบ และให้สีเหลืองทองที่เป็นเอกลักษณ์?",
    options: [
      "สารเคอร์คูมินอยด์ (Curcuminoids)",
      "สารแอนโดรกราโฟไลด์ (Andrographolide)",
      "สารเมนทอล (Menthol)",
      "สารแคปไซซิน (Capsaicin)"
    ],
    correctAnswer: "สารเคอร์คูมินอยด์ (Curcuminoids)",
    explanation: "เคอร์คูมินอยด์ (Curcuminoids) คือสารโพลีฟีนอลธรรมชาติที่พบมากในเหง้าของขมิ้นชัน มีประสิทธิภาพในการบำรุงรักษากระเพาะและลดการอักเสบ"
  };

  const q3Data = {
    question: "สตรีมีครรภ์หรือผู้หญิงที่อยู่ในช่วงให้นมบุตร 'ห้ามรับประทาน' สมุนไพรชนิดใดเนื่องจากมีฤทธิ์เย็นจัดและกระตุ้นการหดตัวของมดลูก?",
    options: [
      "กระเพราแดง",
      "ขิงแก่",
      "ฟ้าทะลายโจร",
      "ตะไคร้หอม"
    ],
    correctAnswer: "ฟ้าทะลายโจร",
    explanation: "ฟ้าทะลายโจรมีข้อห้ามสำคัญคือ ห้ามใช้ในสตรีมีครรภ์และให้นมบุตร เนื่องจากอาจส่งผลต่อทารกและทำให้มดลูกบีบตัวรุนแรง"
  };

  // Handle incoming photo redirect from homepage
  useEffect(() => {
    const state = location.state as { imageSrc?: string } | null;
    if (state?.imageSrc) {
      const base64 = state.imageSrc;
      // Clear location state immediately to avoid repeated triggers on tab switching or reloading
      window.history.replaceState({}, document.title);

      setUploadedImage(base64);
      setGameState("SCANNING");
      showToast("กำลังประมวลผลวิเคราะห์พันธุ์พืชด้วย AI สำหรับเกมทดสอบความรู้...", "info");

      const runVisionChallengeSetup = async () => {
        try {
          const herbsList = getGardenHerbs();
          const response = await fetch("/api/gemini/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: "image/jpeg",
              gardenName: currentGarden.name,
              herbsList
            })
          });

          if (!response.ok) {
            throw new Error("ระบบ AI ขัดข้องชั่วคราว");
          }

          const visionResult = await response.json();
          
          const foundDbHerb = getGardenHerbs().find(h => h.herbId === visionResult.matchedHerbId);
          
          const customHerb: GameHerb = {
            id: visionResult.matchedHerbId || "CUSTOM_" + Date.now(),
            name: visionResult.identifiedName || "สมุนไพรพื้นบ้าน",
            scientific: visionResult.scientificName || "Inconnue botanica",
            image: base64,
            correctProperty: foundDbHerb?.properties?.[0] || visionResult.analysisText?.substring(0, 80) || "บำรุงร่างกาย ดับพิษร้อน และฟื้นฟูธาตุ",
            distractors: [
              "บรรเทาอาการท้องอืด ท้องเฟ้อ จุกเสียด และช่วยขับลมในลำไส้",
              "ชำระเส้นผม ขจัดรังแคแก้อาการคันหนังศีรษะเด่นชัด",
              "ลดความดันโลหิตและช่วยบำรุงสายตาเพื่อผ่อนคลายกล้ามเนื้อ"
            ]
          };

          setActiveGameHerb(customHerb);
          const shuffledOptions = [customHerb.correctProperty, ...customHerb.distractors]
            .sort(() => Math.random() - 0.5);
          setPropertiesOptions(shuffledOptions);
          setGameState("Q1_RECOGNITION");
          showToast(`วิเคราะห์รูปภาพสำเร็จ! เริ่มคำถามแรกสำหรับ "${customHerb.name}" ทันที`, "success");
        } catch (err) {
          console.error(err);
          // Fallback gracefully to a preset herb quiz so game continues
          const fallbackHerb = presetHerbs[Math.floor(Math.random() * presetHerbs.length)];
          setActiveGameHerb(fallbackHerb);
          const shuffledOptions = [fallbackHerb.correctProperty, ...fallbackHerb.distractors]
            .sort(() => Math.random() - 0.5);
          setPropertiesOptions(shuffledOptions);
          setGameState("Q1_RECOGNITION");
          showToast("วิเคราะห์พืชเสร็จสิ้น (แบบสแตนอโลน)", "success");
        }
      };

      runVisionChallengeSetup();
    }
  }, [location.state, currentGarden, getGardenHerbs]);

  // --- RESTART GAME ---
  const handleRestartPhotoGame = () => {
    setGameState("IDLE");
    setUploadedImage(null);
    setActiveGameHerb(null);
    setQ1Guess("");
    setIsQ1Correct(false);
    setSelectedPropertyOption(null);
    setPropertiesOptions([]);
    setIsPropertyCorrect(false);
    setQ2SelectedOption(null);
    setq3SelectedOption(null);
    setIsQ2Correct(false);
    setIsQ3Correct(false);
    setPhotoScoreEarned(0);
  };

  // --- TRIGGER SCAN OR PRESET SELECT ---
  const handleSelectPreset = (herb: GameHerb) => {
    setUploadedImage(herb.image);
    setActiveGameHerb(herb);
    setGameState("SCANNING");
    showToast(`สแกนภาพ "${herb.name}" สำเร็จ กำลังเริ่มการทดสอบ...`, "info");

    // Simulate scanning delay
    setTimeout(() => {
      // Shuffle options for property question (Q1 Follow-up)
      const shuffledOptions = [herb.correctProperty, ...herb.distractors]
        .sort(() => Math.random() - 0.5);
      setPropertiesOptions(shuffledOptions);
      setGameState("Q1_RECOGNITION");
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setUploadedImage(base64);
          setGameState("SCANNING");
          showToast("กำลังประมวลผลวิเคราะห์พันธุ์พืชด้วย AI...", "info");

          try {
            // Call Gemini Vision to identify the herb
            const herbsList = getGardenHerbs();
            const response = await fetch("/api/gemini/vision", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: base64,
                mimeType: file.type,
                gardenName: currentGarden.name,
                herbsList
              })
            });

            if (!response.ok) {
              throw new Error("ระบบ AI ขัดข้องชั่วคราว");
            }

            const visionResult = await response.json();
            
            // Map visionResult to activeGameHerb structure
            // Use matched DB herb properties, or fallback to beautiful defaults
            const foundDbHerb = getGardenHerbs().find(h => h.herbId === visionResult.matchedHerbId);
            
            const customHerb: GameHerb = {
              id: visionResult.matchedHerbId || "CUSTOM_" + Date.now(),
              name: visionResult.identifiedName || "สมุนไพรพื้นบ้าน",
              scientific: visionResult.scientificName || "Inconnue botanica",
              image: base64,
              correctProperty: foundDbHerb?.properties?.[0] || visionResult.analysisText?.substring(0, 80) || "บำรุงร่างกาย ดับพิษร้อน และฟื้นฟูธาตุ",
              distractors: [
                "บรรเทาอาการท้องอืด ท้องเฟ้อ จุกเสียด และช่วยขับลมในลำไส้",
                "ชำระเส้นผม ขจัดรังแคแก้อาการคันหนังศีรษะเด่นชัด",
                "ลดความดันโลหิตและช่วยบำรุงสายตาเพื่อผ่อนคลายกล้ามเนื้อ"
              ]
            };

            setActiveGameHerb(customHerb);
            const shuffledOptions = [customHerb.correctProperty, ...customHerb.distractors]
              .sort(() => Math.random() - 0.5);
            setPropertiesOptions(shuffledOptions);
            setGameState("Q1_RECOGNITION");
            showToast("วิเคราะห์รูปภาพสำเร็จแล้ว!", "success");
          } catch (err) {
            console.error(err);
            // Fallback gracefully so the game never crashes
            const fallbackHerb = presetHerbs[Math.floor(Math.random() * presetHerbs.length)];
            setActiveGameHerb(fallbackHerb);
            const shuffledOptions = [fallbackHerb.correctProperty, ...fallbackHerb.distractors]
              .sort(() => Math.random() - 0.5);
            setPropertiesOptions(shuffledOptions);
            setGameState("Q1_RECOGNITION");
            showToast("สแกนภาพสำเร็จ (เชื่อมต่อแบบสแตนอโลน)", "success");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ANSWER Q1: WHAT HERB IS THIS? ---
  const handleQ1Submit = () => {
    if (!q1Guess.trim()) {
      showToast("กรุณากรอกคำตอบก่อนส่งนะครับ", "warning");
      return;
    }

    if (!activeGameHerb) return;

    // Check if correct name
    const guessClean = q1Guess.trim().toLowerCase();
    const correctName = activeGameHerb.name.toLowerCase();

    // Lenient match: correct if either contains the key syllables of the herb name
    const isMatch = guessClean.includes(correctName) || correctName.includes(guessClean) || 
                    (correctName === "ฟ้าทะลายโจร" && (guessClean.includes("ฟ้าทะลาย") || guessClean.includes("ทะลายโจร"))) ||
                    (correctName === "เสลดพังพอนตัวเมีย" && (guessClean.includes("เสลด") || guessClean.includes("พญายอ") || guessClean.includes("พังพอน")));

    setIsQ1Correct(isMatch);
    
    if (isMatch) {
      setPhotoScoreEarned(prev => prev + 1);
      showToast("คำตอบถูกต้องเก่งมาก! รับ 1 คะแนน 🎉", "success");
    } else {
      showToast("ชื่อสมุนไพรยังไม่ตรงจุดนะ... มาตอบคำถามกู้คะแนนกัน!", "info");
    }

    setGameState("Q1_RECOGNITION_RESULT");
  };

  // --- ANSWER Q1 FOLLOWUP: WHAT IS THE PROPERTY? ---
  const handleQ1FollowupSubmit = () => {
    if (!selectedPropertyOption) {
      showToast("กรุณาเลือกตัวเลือกสรรพคุณข้อใดข้อหนึ่งครับ", "warning");
      return;
    }

    if (!activeGameHerb) return;

    const correct = selectedPropertyOption === activeGameHerb.correctProperty;
    setIsPropertyCorrect(correct);

    if (correct) {
      // Award partial score for recovery
      setPhotoScoreEarned(prev => prev + 1); // 1 point for property recovery
      showToast("แก้ตัวสำเร็จ! รับ 1 คะแนนสำหรับสรรพคุณเด่น 🌟", "success");
    } else {
      showToast("น่าเสียดาย! ข้อนี้ยังไม่ถูกต้องนะ", "error");
    }

    setGameState("Q1_FOLLOWUP_RESULT");
  };

  // --- ANSWER Q2 TRIVIA ---
  const handleQ2Submit = () => {
    if (!q2SelectedOption) {
      showToast("กรุณาเลือกหนึ่งคำตอบนะครับ", "warning");
      return;
    }

    const correct = q2SelectedOption === q2Data.correctAnswer;
    setIsQ2Correct(correct);

    if (correct) {
      setPhotoScoreEarned(prev => prev + 1);
      showToast("เก่งมาก ตอบถูกข้อที่ 2! 🌿", "success");
    } else {
      showToast("คำตอบข้อ 2 ยังไม่ถูกต้องนะครับ", "error");
    }

    setGameState("Q2_RESULT");
  };

  // --- ANSWER Q3 TRIVIA ---
  const handleQ3Submit = () => {
    if (!q3SelectedOption) {
      showToast("กรุณาเลือกหนึ่งคำตอบนะครับ", "warning");
      return;
    }

    const correct = q3SelectedOption === q3Data.correctAnswer;
    setIsQ3Correct(correct);

    if (correct) {
      setPhotoScoreEarned(prev => prev + 1);
      showToast("ยอดเยี่ยม ตอบถูกข้อที่ 3 ครบเซ็ต! 🎉", "success");
    } else {
      showToast("คำตอบข้อ 3 ยังไม่ถูกต้องนะครับ", "error");
    }

    setGameState("Q3_RESULT");
  };

  // --- FINISH GAME & RECORD SCORE ---
  const handleFinishPhotoGame = async () => {
    try {
      setSavingScore(true);
      if (user) {
        // Record the score permanently to User profile
        await addScore(photoScoreEarned);
        showToast(`บันทึกสำเร็จ! เพิ่มสะสมอีก +${photoScoreEarned} คะแนนลงโปรไฟล์ของคุณเรียบร้อยแล้ว`, "success");
      } else {
        showToast("เล่นโหมดบุคคลทั่วไป: คะแนนจะไม่บันทึกถาวร กรุณาเข้าสู่ระบบ", "info");
      }
      setGameState("SUMMARY");
    } catch (e) {
      console.error(e);
      showToast("ขัดข้องในการบันทึกคะแนนสะสม", "error");
      setGameState("SUMMARY");
    } finally {
      setSavingScore(false);
    }
  };

  // --- ORIGINAL STANDARD QUIZZES RESTART/FLOW ---
  const handleRestartStandard = () => {
    setStandardActiveIdx(0);
    setStandardUserAnswer("");
    setStandardGradeResult(null);
    setStandardCorrectCount(0);
    setStandardFinished(false);
    setStandardGrading(false);
  };

  const handleStandardSubmit = async () => {
    if (!standardUserAnswer.trim()) {
      showToast("กรุณาป้อนคำตอบก่อนกดยืนยัน", "warning");
      return;
    }
    const currentQuiz = quizzes[standardActiveIdx];
    const associatedHerb = currentQuiz ? getHerb(currentQuiz.herbId) : null;
    if (!associatedHerb) {
      showToast("ไม่สามารถเรียกคืนข้อมูลสมุนไพรสำหรับข้อสอบนี้ได้", "error");
      return;
    }

    try {
      setStandardGrading(true);
      const response = await fetch("/api/gemini/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuiz.question,
          userAnswer: standardUserAnswer,
          herbData: associatedHerb
        })
      });

      if (!response.ok) {
        throw new Error("Grader API ขัดข้องชั่วคราว");
      }

      const grade = await response.json();
      setStandardGradeResult(grade);

      if (grade.correct) {
        setStandardCorrectCount((prev) => prev + 1);
        if (user) {
          await addScore(1);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("ล้มเหลวในการตรวจคำตอบ กรุณาลองส่งใหม่อีกครั้ง", "error");
    } finally {
      setStandardGrading(false);
    }
  };

  const handleStandardNext = () => {
    if (standardActiveIdx + 1 < quizzes.length) {
      setStandardActiveIdx((prev) => prev + 1);
      setStandardUserAnswer("");
      setStandardGradeResult(null);
    } else {
      setStandardFinished(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      
      {/* Styles for High-tech Laser Scan overlay */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.3; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scan-line {
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Header Info Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🌿 ทดสอบความรู้สมุนไพร</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              เกมสแกนภาพใบพืชและตอบคำถามท้าทายภูมิปัญญาไทย ประจำสวน <span className="font-semibold text-teal-600 dark:text-teal-400">{currentGarden.name}</span>
            </p>
          </div>

          <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3.5 py-1.5 rounded-xl border border-amber-500/15 flex items-center gap-2 text-xs font-bold">
            <Award className="w-4 h-4" />
            <span>ระดับของคุณ: {user ? user.level.toUpperCase() : "บุคคลทั่วไป"} ({user ? user.totalScore : 0} คะแนน)</span>
          </div>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 pt-2 gap-2 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => {
              handleTabChange("photo");
              handleRestartPhotoGame();
            }}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "photo"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 เกมท้าทายด้วยภาพถ่าย</span>
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans uppercase animate-pulse">ใหม่</span>
          </button>
          
          <button
            onClick={() => {
              handleTabChange("standard");
              handleRestartStandard();
            }}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "standard"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📝 แบบทดสอบความรู้ทั่วไป</span>
          </button>

          <button
            onClick={() => {
              handleTabChange("certificate");
            }}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "certificate"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🏅 เกียรติบัตร / พาสปอร์ต</span>
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}

      {activeTab === "photo" ? (
        /* ==================== 1. AI PHOTO CHALLENGE GAME ==================== */
        <div className="space-y-6">
          
          {gameState === "IDLE" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 text-center flex flex-col items-center">
              
              <div className="space-y-2 max-w-lg">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/45 dark:text-teal-400">
                  <Sparkles className="w-3.5 h-3.5 fill-teal-500/10" />
                  กติกาเกมประเมินความรู้ขั้นสูง
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                  ถ่ายรูปพืชใบไม้ เพื่อเริ่มต้นเล่นเกมท้าทาย AI!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  อัปโหลดหรือเลือกรูปสมุนไพร เพื่อให้ AI ตรวจจับวิเคราะห์ จากนั้นตอบชื่อพืชเพื่อเก็บคะแนน (หากตอบผิดจะมีตัวเลือกสรรพคุณกู้ชีพ!) และผ่านไปยังคำถามถัดไป 2 ข้อให้เสร็จสิ้นเซ็ตทดสอบ
                </p>
              </div>

              {/* Upload Dashed Box */}
              <div className="w-full max-w-lg">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500/40 rounded-2xl p-6 sm:p-8 cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-850/20 hover:bg-teal-50/10 flex flex-col items-center justify-center gap-3.5 group"
                >
                  <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl group-hover:scale-105 transition-all text-teal-600 dark:text-teal-400 shadow-xs">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-700 dark:text-slate-350 block">เปิดกล้องถ่ายรูป หรือ เลือกจากแกลเลอรี</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-normal">รองรับ JPG, PNG หรือไฟล์ภาพความละเอียดสูง</span>
                  </div>
                </div>
              </div>

              {/* Instant Preset Herbs Selection */}
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 space-y-3.5">
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  หรือ ทดสอบทันทีผ่านรูปภาพตัวอย่างสมุนไพรเด่น:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {presetHerbs.map((h, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectPreset(h)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-teal-950/30 dark:hover:text-teal-400 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>🌿</span>
                      <span>{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {gameState === "SCANNING" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-6 flex flex-col items-center">
              <div className="relative w-full max-w-sm h-64 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <img src={uploadedImage || ""} alt="Scanning" className="w-full h-full object-cover" />
                {/* Visual scanner overlay */}
                <div className="absolute inset-0 bg-teal-500/10 pointer-events-none"></div>
                <div className="absolute left-0 right-0 h-1 bg-teal-500 shadow-lg shadow-teal-500/50 animate-scan-line pointer-events-none"></div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-center items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-base">กำลังประมวลผลวิเคราะห์พันธุ์พืชด้วย AI</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                  คอมพิวเตอร์วิทัศน์กำลังตรวจสอบลวดลายขอบใบ การจัดเรียงเส้นใบ และโครงสร้างดอกเทียบเคียงกับคลังภูมิปัญญาสมุนไพรในสวน...
                </p>
              </div>
            </div>
          )}

          {/* Q1: NAME RECOGNITION QUESTION */}
          {gameState === "Q1_RECOGNITION" && activeGameHerb && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                <span>ความก้าวหน้าการท้าทาย</span>
                <span className="text-teal-600 dark:text-teal-400">คำถามข้อที่ 1 จาก 3 (ขั้นระบุชื่อ)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Photo card (5 cols) */}
                <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
                  <img src={uploadedImage || ""} alt="Active Herb Challenge" className="w-full h-64 md:h-80 object-cover rounded-xl" />
                  <span className="text-[10px] text-slate-400 font-bold block text-center mt-2.5 uppercase">ภาพพืชอ้างอิงโจทย์</span>
                </div>

                {/* Question panel (7 cols) */}
                <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">คำถามที่ 1 (ถามตอบชื่อสมุนไพร)</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150 leading-relaxed">
                      จากภาพสมุนไพรนี้ มันมีชื่อเรียกว่าอะไรในพจนานุกรมสมุนไพรไทย?
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">พิมพ์คำตอบชื่อภาษาไทยของคุณด้านล่างนี้:</label>
                    <input
                      type="text"
                      value={q1Guess}
                      onChange={(e) => setQ1Guess(e.target.value)}
                      placeholder="เช่น ขมิ้นชัน, ฟ้าทะลายโจร, กะเพราแดง..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm font-bold dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQ1Submit();
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={handleRestartPhotoGame}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ยกเลิก/สแกนใหม่</span>
                    </button>

                    <button
                      onClick={handleQ1Submit}
                      disabled={!q1Guess.trim()}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>ส่งคำตอบประเมิน</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Q1: NAME RECOGNITION RESULT DISPLAY */}
          {gameState === "Q1_RECOGNITION_RESULT" && activeGameHerb && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isQ1Correct ? (
                  <>
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce-slow">
                      <CheckCircle2 className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">เก่งมาก! ตอบถูกอย่างแม่นยำ</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        คุณระบุชื่อสมุนไพรนี้ได้อย่างถูกต้อง นั่นคือ <span className="font-extrabold text-slate-800 dark:text-slate-100">"{activeGameHerb.name}"</span> ({activeGameHerb.scientific}) รับไปเลย <span className="font-bold text-teal-600">+1 คะแนนสะสม</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                      <XCircle className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">ชื่อสมุนไพรยังไม่ตรงจุดอ้างอิง</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        คุณทายชื่อพืชว่า <span className="font-bold text-rose-500">"{q1Guess}"</span> แต่ความจริงพืชนี้คือ <span className="font-extrabold text-slate-800 dark:text-slate-100">"{activeGameHerb.name}"</span> ({activeGameHerb.scientific})
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold mt-1.5">
                        ⚠️ ผิดคำตอบนี้! แต่ AI ท้าทายสิทธิพิเศษต่อ: "คุณสมบัติ/สรรพคุณของมันคืออะไร?" เพื่อกู้ชีพคะแนนกลับคืนมา!
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
                {isQ1Correct ? (
                  <button
                    onClick={() => setGameState("Q2_TRIVIA")}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>ไปทำคำถามข้อที่ 2 ถัดไป</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setGameState("Q1_FOLLOWUP")}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm animate-pulse"
                  >
                    <span>👉 เข้าสู่คำถามกู้คะแนนสรรพคุณ (มีตัวเลือก)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Q1 FOLLOW-UP (PROPERTIES) QUESTION */}
          {gameState === "Q1_FOLLOWUP" && activeGameHerb && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                <span>กู้ชีพคำตอบที่ 1</span>
                <span className="text-amber-600 dark:text-amber-400">คำถามสรรพคุณเด่น (แบบมีตัวเลือก)</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">คำถามทดสอบสรรพคุณกู้ชีพคะแนน</span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-150 leading-relaxed">
                    คุณตอบชื่อสมุนไพรผิดไป แต่เพื่อกู้คะแนนคืน คุณรู้หรือไม่ว่า สมุนไพรชนิดนี้ <span className="text-teal-600">"{activeGameHerb.name}"</span> มี 'คุณสมบัติหรือสรรพคุณหลักทางยา' ที่ระบุไว้เด่นชัดที่สุดในข้อใด?
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {propertiesOptions.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        selectedPropertyOption === opt
                          ? "border-teal-500 bg-teal-500/5 dark:bg-teal-400/5"
                          : "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="properties_options"
                        checked={selectedPropertyOption === opt}
                        onChange={() => setSelectedPropertyOption(opt)}
                        className="mt-1 accent-teal-600 scale-110 shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-xs sm:max-w-md">
                    * เลือกสรรพคุณที่น่าจะเป็นจุดแข็งที่สุดของต้น "{activeGameHerb.name}" เพื่อผ่านด่านชิงคะแนนบันทึกคืนมา
                  </p>
                  
                  <button
                    onClick={handleQ1FollowupSubmit}
                    disabled={!selectedPropertyOption}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <span>ยืนยันคำตอบสรรพคุณ</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Q1 FOLLOW-UP GRADED RESULT DISPLAY */}
          {gameState === "Q1_FOLLOWUP_RESULT" && activeGameHerb && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isPropertyCorrect ? (
                  <>
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                      <CheckCircle2 className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">กู้ชีพคะแนนสำเร็จแล้ว! 🎉</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        ยอดเยี่ยมมาก! สรรพคุณหลักของต้น <span className="font-extrabold text-teal-600">"{activeGameHerb.name}"</span> คือ <span className="font-extrabold text-slate-800 dark:text-slate-100">"{activeGameHerb.correctProperty}"</span> รับไปเลย <span className="font-bold text-teal-600">+1 คะแนนสะสมกู้ชีพ!</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                      <XCircle className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">ยังไม่ถูกใจในหลักการแพทย์แผนไทย</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        สรรพคุณหลักของพืช <span className="font-extrabold text-slate-800 dark:text-slate-100">"{activeGameHerb.name}"</span> ที่ถูกต้องคือ <span className="font-extrabold text-emerald-600">"{activeGameHerb.correctProperty}"</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1 block">ไม่เป็นไรนะ! เรายังมีอีก 2 คำถามให้คุณพยายามเก็บคะแนนสะสม</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setGameState("Q2_TRIVIA")}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>ไปทำคำถามทั่วไปข้อถัดไป (ข้อ 2 จาก 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* QUESTION 2: TRIVIA MULTIPLE CHOICE */}
          {gameState === "Q2_TRIVIA" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                <span>คำถามคลังความรู้สะสม</span>
                <span className="text-teal-600 dark:text-teal-400">คำถามข้อที่ 2 จาก 3</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">คำถามทั่วไปประจำชุดความรู้</span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-150 leading-relaxed font-sans">
                    {q2Data.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {q2Data.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        q2SelectedOption === opt
                          ? "border-teal-500 bg-teal-500/5 dark:bg-teal-400/5"
                          : "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q2_options"
                        checked={q2SelectedOption === opt}
                        onChange={() => setQ2SelectedOption(opt)}
                        className="mt-1 accent-teal-600 scale-110 shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal font-sans">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 leading-normal">
                    * ทบทวนความรู้สรรพคุณขมิ้นชันให้ดีเพื่อเก็บแต้ม
                  </span>
                  
                  <button
                    onClick={handleQ2Submit}
                    disabled={!q2SelectedOption}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <span>ส่งคำตอบข้อที่ 2</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* QUESTION 2: RESULT */}
          {gameState === "Q2_RESULT" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isQ2Correct ? (
                  <>
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce-slow">
                      <CheckCircle2 className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">ถูกต้องยอดเยี่ยม! 🎉</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        เก่งมาก! คำตอบคือ <span className="font-extrabold text-slate-800 dark:text-slate-100">"{q2Data.correctAnswer}"</span> ได้รับ <span className="font-bold text-teal-600">+1 คะแนนสะสม</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                      <XCircle className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">ยังไม่ตรงคำตอบอ้างอิงหลักครับ</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        คำตอบที่ถูกต้องตามหลักคือ <span className="font-extrabold text-emerald-600">"{q2Data.correctAnswer}"</span>
                      </p>
                    </div>
                  </>
                )}

                {/* Technical discussion */}
                <div className="w-full bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">อภิปรายโดย AI Companion:</span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans font-medium">
                    {q2Data.explanation}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setGameState("Q3_TRIVIA")}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>ไปทำคำถามข้อถัดไป (ข้อสุดท้าย 3 จาก 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* QUESTION 3: TRIVIA MULTIPLE CHOICE */}
          {gameState === "Q3_TRIVIA" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                <span>คำถามประเมินเกียรติบัตร</span>
                <span className="text-teal-600 dark:text-teal-400">คำถามข้อที่ 3 จาก 3</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">คำถามข้อสุดท้าย</span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-150 leading-relaxed font-sans">
                    {q3Data.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {q3Data.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        q3SelectedOption === opt
                          ? "border-teal-500 bg-teal-500/5 dark:bg-teal-400/5"
                          : "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q3_options"
                        checked={q3SelectedOption === opt}
                        onChange={() => setq3SelectedOption(opt)}
                        className="mt-1 accent-teal-600 scale-110 shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal font-sans">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 leading-normal">
                    * ตอบคำถามสุดท้ายให้ถูกต้องเพื่อสรุปคะแนนสะสมบันทึก
                  </span>
                  
                  <button
                    onClick={handleQ3Submit}
                    disabled={!q3SelectedOption}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <span>ส่งคำตอบคำถามสุดท้าย</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* QUESTION 3: RESULT */}
          {gameState === "Q3_RESULT" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isQ3Correct ? (
                  <>
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce-slow">
                      <CheckCircle2 className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">ถูกต้องยอดเยี่ยมเป็นที่สุด! 🎉</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        เก่งมาก! คำตอบคือ <span className="font-extrabold text-slate-800 dark:text-slate-100">"{q3Data.correctAnswer}"</span> ได้รับ <span className="font-bold text-teal-600">+1 คะแนนสะสม</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                      <XCircle className="w-14 h-14" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">ยังไม่ถูกต้องตามตำราแพทย์ไทย</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        คำตอบอ้างอิงที่ถูกต้องคือ <span className="font-extrabold text-emerald-600">"{q3Data.correctAnswer}"</span>
                      </p>
                    </div>
                  </>
                )}

                {/* Technical discussion */}
                <div className="w-full bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">อภิปรายโดย AI Companion:</span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans font-medium">
                    {q3Data.explanation}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleFinishPhotoGame}
                  disabled={savingScore}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-55"
                >
                  {savingScore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังประมวลผลคำนวณและบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <span>🏁 ประมวลผลและดูบทสรุปคะแนน</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* GAME FINAL SUMMARY VIEW */}
          {gameState === "SUMMARY" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-md space-y-6 flex flex-col items-center justify-center animate-fade-in">
              <div className="p-4.5 bg-amber-500/10 text-amber-500 rounded-full animate-bounce-slow">
                <Trophy className="w-16 h-16" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">ยินดีด้วย! คุณทำภารกิจท้าทายครบเซ็ตแล้ว</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  คุณตอบคำถามได้ถูกต้อง <span className="font-extrabold text-teal-600 text-base">{photoScoreEarned}</span> จากด่านคำถามทั้งหมดที่ทำไป
                </p>
              </div>

              {/* Saved Score Profile Info */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-750 p-4 rounded-xl w-full max-w-md text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block uppercase tracking-wide">คะแนนสะสมและบันทึกประวัติ</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-350 block mt-1">
                    ✅ บันทึกเพิ่มสะสม <span className="text-teal-600 font-bold">+{photoScoreEarned} คะแนน</span> ลงโปรไฟล์ของคุณสำเร็จแล้ว!
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    🌟 คะแนนรวมปัจจุบัน: {user ? user.totalScore : "0"} คะแนน (ระดับ: {user ? user.level.toUpperCase() : "บุคคลทั่วไป"})
                  </span>
                </div>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shrink-0"
                >
                  ดูแดชบอร์ด
                </button>
              </div>

              <div className="flex flex-wrap gap-3.5 justify-center">
                <button
                  onClick={handleRestartPhotoGame}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-bold rounded-xl text-sm"
                >
                  ท้าทายใหม่อีกครั้ง
                </button>
                <button
                  onClick={() => navigate("/herbs")}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm"
                >
                  🌿 เรียนรู้สมุนไพรเพิ่มเติม
                </button>
              </div>

            </div>
          )}

        </div>
      ) : activeTab === "standard" ? (
        /* ==================== 2. LEGACY TRIVIA GENERAL QUIZZES ==================== */
        <div className="space-y-6">
          {quizzes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 text-center rounded-2xl max-w-md mx-auto space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h2 className="text-lg font-bold">ไม่มีรายการแบบทดสอบ</h2>
              <p className="text-xs text-slate-500">สวนพฤกษศาสตร์ของท้องถิ่นนี้ยังไม่มีการจัดตั้งแบบทดสอบความรู้</p>
              <button onClick={() => navigate("/herbs")} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">
                กลับไปอ่านฐานข้อมูลสมุนไพร
              </button>
            </div>
          ) : (
            <>
              {standardFinished ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-md space-y-6 flex flex-col items-center justify-center">
                  <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full">
                    <Trophy className="w-16 h-16" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">ยินดีด้วย! คุณเรียนรู้แบบทดสอบจบแล้ว</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      คุณทำคำตอบถูกต้องทั้งหมด <span className="font-extrabold text-teal-600">{standardCorrectCount}</span> จากทั้งหมด <span className="font-bold">{quizzes.length}</span> ข้อทดสอบ
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-700 p-4 rounded-xl w-full max-w-sm flex items-center justify-between text-left">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase">คะแนนสะสมโปรไฟล์ทั้งหมดของคุณ</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-850 dark:text-slate-200">
                        ⭐ {user ? user.totalScore : "0"} คะแนนสะสม
                      </span>
                    </div>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg"
                    >
                      ดูแดชบอร์ด
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRestartStandard}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                    >
                      ทดสอบใหม่อีกครั้ง
                    </button>
                    <button
                      onClick={() => navigate("/herbs")}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm"
                    >
                      เรียนรู้สมุนไพรเพิ่ม
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress panel */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>คำถามข้อที่ {standardActiveIdx + 1} จาก {quizzes.length}</span>
                      <span className="text-teal-600 dark:text-teal-400">ความก้าวหน้า {Math.round(((standardActiveIdx) / quizzes.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((standardActiveIdx) / quizzes.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Question content */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 text-left">
                    
                    {getHerb(quizzes[standardActiveIdx].herbId) && (
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-750">
                        <img src={getHerb(quizzes[standardActiveIdx].herbId)?.images?.[0]} alt="Herb" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">พืชอ้างอิงความรู้</span>
                          <span className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400">🌿 {getHerb(quizzes[standardActiveIdx].herbId)?.thaiName}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-teal-600" />
                        <span>คำถามโจทย์ทดสอบความรู้ทั่วไป</span>
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                        {quizzes[standardActiveIdx].question}
                      </h2>
                    </div>

                    {!standardGradeResult ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">พิมพ์อภิปรายคำตอบของคุณ (คำอธิบายเป็นข้อความ):</label>
                          <textarea
                            rows={4}
                            value={standardUserAnswer}
                            onChange={(e) => setStandardUserAnswer(e.target.value)}
                            disabled={standardGrading}
                            placeholder="ป้อนคำอธิบายสรรพคุณหรือคำตอบตามที่เรียนรู้มา เพื่อส่งให้ AI ตรวจจับวิเคราะห์..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm dark:text-white font-sans leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm leading-normal">
                            * AI จะตรวจสอบคำตอบอภิปรายของคุณอย่างเป็นกลาง ขอให้อ้างอิงถึงข้อเท็จจริงสำคัญของสมุนไพรนั้นๆ
                          </p>
                          
                          <button
                            onClick={handleStandardSubmit}
                            disabled={standardGrading || !standardUserAnswer.trim()}
                            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            {standardGrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>{standardGrading ? "กำลังส่งคำตอบให้ AI ตรวจ..." : "ส่งคำตอบยืนยัน"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-fade-in border-t border-slate-100 dark:border-slate-800 pt-5 text-left">
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          standardGradeResult.correct
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-red-500/10 text-red-800 dark:text-red-400 border-red-500/25"
                        }`}>
                          {standardGradeResult.correct ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                          )}
                          <div className="space-y-1">
                            <span className="text-sm font-extrabold block">
                              {standardGradeResult.correct ? "ถูกต้องยอดเยี่ยม! ได้รับ 1 คะแนน" : "คำตอบยังไม่ตรงจุดอ้างอิง"}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                              คำตอบอ้างอิงหลักที่ถูกต้อง: <span className="font-bold text-slate-700 dark:text-slate-300">"{standardGradeResult.correctAnswer}"</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/25 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">ความเห็นของ AI Grader:</span>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
                            {standardGradeResult.explanation}
                          </p>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleStandardNext}
                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{standardActiveIdx + 1 < quizzes.length ? "คำถามข้อถัดไป" : "สรุปผลแบบทดสอบ"}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ==================== 3. CERTIFICATE & PASSPORT ==================== */
        <div className="space-y-6 animate-fade-in text-left">
          {/* Style Injection for Print */}
          <style>{`
            @media print {
              /* Hide all components except print-area */
              body * {
                visibility: hidden !important;
              }
              #print-area, #print-area * {
                visibility: visible !important;
              }
              #print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 2rem !important;
                border: 8px double #d97706 !important; /* amber-600 double border */
                border-radius: 0.5rem !important;
                box-shadow: none !important;
                background: #fffbeb !important; /* amber-50 */
                color: #0f172a !important; /* slate-900 */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {!user ? (
            <div className="py-20 max-w-sm mx-auto text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">กรุณาเข้าสู่ระบบก่อน</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                คุณจำเป็นต้องเข้าสู่ระบบและมีคะแนนสะสมในระบบ เพื่อดาวน์โหลดและพิมพ์ พาสปอร์ตท่องเที่ยวสวนสมุนไพร หรือ เกียรติบัตรความเชี่ยวชาญ
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-sm cursor-pointer"
              >
                เข้าสู่ระบบ / ลงทะเบียน
              </button>
            </div>
          ) : user.totalScore === 0 ? (
            /* User is logged in but has NO points yet */
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-md max-w-lg mx-auto space-y-6 flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-600">
                <Award className="w-16 h-16" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-200">คุณยังไม่มีคะแนนสะสมความรู้</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                  เมื่อคุณเล่นเกมท้าทายด้วยภาพถ่ายหรือทำแบบทดสอบผ่านอย่างน้อย <span className="font-bold text-amber-600">1 คะแนน</span> คุณจะปลดล็อกสิทธิ์ในการเปิดรับและพิมพ์ <span className="font-bold text-teal-600">พาสปอร์ตท่องเที่ยวสวนสมุนไพร (Smart Herb Passport)</span> ได้ทันที!
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  *และหากสะสมคะแนนครบ <span className="font-bold text-teal-600">10 คะแนน</span> จะได้รับสิทธิ์อัปเกรดเป็น <span className="font-bold text-amber-600">เกียรติบัตรความรู้อัจฉริยะ (E-Certificate)</span> ระดับสากลขั้นสูงสุด
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => handleTabChange("photo")}
                  className="flex-1 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>สแกนภาพสะสมคะแนน</span>
                </button>
                <button
                  onClick={() => handleTabChange("standard")}
                  className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ทำแบบทดสอบทั่วไป</span>
                </button>
              </div>
            </div>
          ) : (
            /* User has scores (>0) */
            <div className="space-y-6">
              {/* Header and Controls Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 font-sans">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {user.totalScore < 10 ? (
                      <>
                        <span>📖 พาสปอร์ตท่องเที่ยวสมุนไพร</span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          ระดับต้น (Explorer)
                        </span>
                      </>
                    ) : (
                      <>
                        <span>🏅 เกียรติบัตรความรู้อัจฉริยะ</span>
                        <span className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">
                          ระดับสูง (Expert)
                        </span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {user.totalScore < 10 
                      ? "คุณได้รับพาสปอร์ตท่องเที่ยวสวนสมุนไพร สามารถนำไปสแกนประทับตราหรือพิมพ์สะสมชั่วโมงเรียนรู้พืชท้องถิ่น"
                      : "เกียรติบัตรอิเล็กทรอนิกส์รับรองความเป็นเลิศในการศึกษาพฤกษเวชศาสตร์และภูมิปัญญาเภสัชกรรมไทย"
                    }
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์ {user.totalScore < 10 ? "พาสปอร์ต" : "เกียรติบัตร"} / บันทึก PDF</span>
                  </button>
                  <button
                    onClick={() => handleShare(user.totalScore < 10 ? "passport" : "cert")}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>แชร์ความรู้อัจฉริยะ</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {user.totalScore < 10 && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2.5 leading-normal font-sans">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ก้าวถัดไปสู่ "เกียรติบัตรทองคำ"! 🌟</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ขณะนี้คุณมี <span className="font-extrabold text-amber-700 dark:text-amber-300">{user.totalScore} คะแนน</span> ขาดอีกเพียง <span className="font-extrabold text-teal-600 dark:text-teal-400">{10 - user.totalScore} คะแนน</span> เพื่อเลื่อนขั้นไปปลดล็อกใบเกียรติบัตรรับรองความเชี่ยวชาญอัจฉริยะสำเร็จรูปแบบทางการ
                    </p>
                  </div>
                </div>
              )}

              {/* PRINT AREA CONTAINER */}
              <div id="print-area" className="w-full max-w-4xl mx-auto overflow-hidden">
                {user.totalScore < 10 ? (
                  /* ==================== PASSPORT CARD DESIGN ==================== */
                  <div className="bg-slate-900 text-slate-100 border-8 border-amber-500/40 p-6 sm:p-10 rounded-2xl relative shadow-xl overflow-hidden font-sans">
                    {/* Decorative gold flourishes and security patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    {/* Top Passport Headers */}
                    <div className="border-b border-amber-500/20 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                          <Compass className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-amber-400 tracking-wider uppercase font-mono">
                            SMART HERBAL PASSPORT
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            พาสปอร์ตท่องเที่ยวและอนุรักษ์พืชสมุนไพรไทย
                          </p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[9px] text-slate-400 block font-mono">PASSPORT NO.</span>
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {user.userId.replace("USER_", "TH-").substring(0, 10).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Passport Bio Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
                      
                      {/* Photo slot with official stamps */}
                      <div className="flex flex-col items-center justify-center relative">
                        <div className="relative p-1 bg-amber-500/20 rounded-xl border border-amber-500/30 w-36 h-36 overflow-hidden shadow-md">
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {/* Simulated biometric scan overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent pointer-events-none"></div>
                        </div>
                        
                        {/* Stamp graphic overlay */}
                        <div className="absolute -bottom-2 -right-2 bg-teal-600/80 text-white rounded-full p-2 border-2 border-slate-900 text-[8px] font-extrabold uppercase font-mono tracking-widest flex flex-col items-center justify-center w-16 h-16 shadow-lg rotate-12 select-none">
                          <Leaf className="w-3.5 h-3.5 text-teal-200" />
                          <span>APPROVED</span>
                          <span className="text-[6px] opacity-75">{currentGarden.name.substring(0, 10)}</span>
                        </div>
                      </div>

                      {/* Info fields */}
                      <div className="md:col-span-2 grid grid-cols-2 gap-4 text-left font-mono">
                        <div className="col-span-2 border-b border-slate-800 pb-1.5">
                          <span className="text-[8px] text-slate-400 block">NAME / ชื่อผู้บุกเบิก</span>
                          <span className="text-sm font-extrabold text-slate-100 font-sans">{user.displayName}</span>
                        </div>

                        <div className="border-b border-slate-800 pb-1.5">
                          <span className="text-[8px] text-slate-400 block">NATIONALITY / สัญชาติ</span>
                          <span className="text-xs font-extrabold text-slate-200">THAILAND / ไทย</span>
                        </div>

                        <div className="border-b border-slate-800 pb-1.5">
                          <span className="text-[8px] text-slate-400 block">LEVEL / ระดับความรู้</span>
                          <span className="text-xs font-extrabold text-amber-400 font-sans">EXPLORER (ระดับต้น)</span>
                        </div>

                        <div className="border-b border-slate-800 pb-1.5">
                          <span className="text-[8px] text-slate-400 block">CURRENT SCORE / คะแนนรวม</span>
                          <span className="text-xs font-extrabold text-teal-400">⭐ {user.totalScore} คะแนน</span>
                        </div>

                        <div className="border-b border-slate-800 pb-1.5">
                          <span className="text-[8px] text-slate-400 block">AUTHORITY / สวนที่ประทับตรา</span>
                          <span className="text-[11px] font-bold text-slate-200 font-sans leading-tight">{currentGarden.name}</span>
                        </div>

                        <div className="col-span-2 pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-left font-sans">
                            <span className="text-[9px] text-slate-400 block">รหัสประทับตราพาสปอร์ตอิเล็กทรอนิกส์</span>
                            <span className="text-[10px] font-mono text-amber-500 font-bold">
                              {currentGarden.gardenId}-PASS-{user.userId.replace("USER_", "").toUpperCase()}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">ออก ณ วันที่ {todayString}</span>
                          </div>
                          <div className="p-1 bg-white rounded-lg border border-slate-200 w-14 h-14 flex items-center justify-center shrink-0">
                            <QrCode className="w-full h-full text-slate-900" />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Passport Bottom Security Line */}
                    <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 tracking-widest break-all">
                        P&lt;THA{user.displayName.replace(/\s+/g, "").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;{user.userId.substring(0, 10).toUpperCase()}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ==================== CERTIFICATE DESIGN ==================== */
                  <div className="w-full bg-amber-50/20 dark:bg-slate-900 border-12 border-double border-amber-500/30 p-8 sm:p-14 rounded-2xl relative shadow-md overflow-hidden text-center text-slate-850 dark:text-slate-100 font-sans">
                    {/* Elegant corner flourishes */}
                    <div className="absolute top-4 left-4 text-amber-500/20 text-3xl font-serif">✥</div>
                    <div className="absolute top-4 right-4 text-amber-500/20 text-3xl font-serif">✥</div>
                    <div className="absolute bottom-4 left-4 text-amber-500/20 text-3xl font-serif">✥</div>
                    <div className="absolute bottom-4 right-4 text-amber-500/20 text-3xl font-serif">✥</div>

                    <div className="space-y-6 max-w-2xl mx-auto">
                      {/* Certificate Crest */}
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/25">
                          <Award className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest block">
                            เกียรติบัตรฉบับอิเล็กทรอนิกส์ (E-Certificate of Achievement)
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block uppercase">
                            โครงการขับเคลื่อน 1 อปท. 1 สวนสมุนไพร เฉลิมพระเกียรติฯ
                          </span>
                          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 block">
                            {currentGarden.name}
                          </span>
                        </div>
                      </div>

                      {/* Presentation text */}
                      <div className="space-y-3 pt-4">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า</span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white border-b border-slate-200/50 pb-2 max-w-md mx-auto">
                          {user.displayName}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-350 leading-relaxed max-w-lg mx-auto">
                          ได้สำเร็จหลักสูตรศึกษาระดับพฤกษศาสตร์สมุนไพรอัจฉริยะ ผ่านการเรียนรู้พืชพรรณพฤกษเวชศาสตร์และการทดสอบประเมินคำตอบด้วยระบบตรวจข้อสอบปัญญาประดิษฐ์ มีคะแนนสะสมความรู้ยอดเยี่ยมตามมาตรฐานที่กำหนด
                        </p>
                      </div>

                      {/* Signatures and QR Verification */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 items-end font-sans">
                        
                        {/* Official Signatures */}
                        <div className="space-y-1.5 flex flex-col items-center sm:items-start text-center sm:text-left">
                          <div className="h-10 w-28 bg-transparent relative opacity-70 border-b border-dashed border-slate-300">
                            <span className="absolute bottom-1 left-2 font-serif italic text-teal-600 font-extrabold tracking-widest text-lg select-none">
                              Dr. Piyaorn. J
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-300 block">นพ. ปิยอร ดำรงวิถี</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">ผู้รักษาการศูนย์ชีวสุขสาธารณสุขทางเลือก</span>
                        </div>

                        {/* Verification details */}
                        <div className="flex items-center gap-3 justify-center sm:justify-end">
                          <div className="text-center sm:text-right">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold uppercase font-mono">CERTIFICATE SERIAL</span>
                            <span className="text-[10px] font-mono text-amber-600 font-bold block">
                              {currentGarden.gardenId}-CERT-{user.userId.replace("USER_", "").toUpperCase()}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none block mt-1">ให้ไว้ ณ วันที่ {todayString}</span>
                          </div>
                          <div className="p-1.5 bg-white rounded border border-slate-200 w-16 h-16 relative flex items-center justify-center shrink-0 shadow-xs">
                            <QrCode className="w-full h-full text-slate-800" />
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Legal Notice */}
              <div className="max-w-4xl mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5 font-sans">
                <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-200">ระบบตรวจสอบอ้างอิงความมั่นคงปลอดภัย (Security Verification)</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    เอกสารรับรองดิจิทัลและหนังสือคนเดินทางพฤกษเวชศาสตร์ทุกฉบับ มีรหัสทะเบียนเฉพาะตัวกำกับแบบเข้ารหัสความปลอดภัย เจ้าหน้าที่ฝ่ายส่งเสริมสาธารณสุขทางเลือก โรงพยาบาล หรือองค์กรปกครองส่วนท้องถิ่น (อปท.) สามารถอ้างอิงฐานข้อมูลของสวนสมุนไพร เพื่อสแกนตรวจสอบการรับวุฒิบัตรจริงได้ตลอดเวลา
                  </p>
                </div>
              </div>

              {/* Leaderboard Rankings (Show after certificate is issued) */}
              <div className="max-w-4xl mx-auto pt-6 space-y-4 text-left border-t border-slate-100 dark:border-slate-800 mt-6 print:hidden">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🏆 ทำเนียบเกียรติยศและอันดับผู้เรียนดีเด่น</span>
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" title="อัปเดตแบบเรียลไทม์"></span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    แสดงอันดับคะแนนเทียบเคียงกับผู้เรียนดีเด่นทั้งหมดในเขตพื้นที่บริการของสวนสมุนไพร
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5 text-left w-16">อันดับ</th>
                          <th className="px-5 py-3.5 text-left">ชื่อผู้ร่วมเรียนรู้</th>
                          <th className="px-5 py-3.5 text-center">ระดับ</th>
                          <th className="px-5 py-3.5 text-right pr-6">คะแนนรวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {rankingList.map((rankUser) => (
                          <tr
                            key={rankUser.displayName}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                              rankUser.isCurrentUser ? "bg-teal-600/5 dark:bg-teal-400/5 font-bold" : ""
                            }`}
                          >
                            <td className="px-5 py-4 font-bold text-slate-850 dark:text-slate-200">
                              {rankUser.rank === 1 ? "🥇 1" : rankUser.rank === 2 ? "🥈 2" : rankUser.rank === 3 ? "🥉 3" : rankUser.rank}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={rankUser.photoURL}
                                  alt={rankUser.displayName}
                                  className="w-8 h-8 rounded-full border border-slate-200/50 bg-white shrink-0"
                                />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-200">
                                    {rankUser.displayName}
                                  </span>
                                  {rankUser.isCurrentUser && (
                                    <span className="ml-2 text-[9px] font-extrabold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-500/10">
                                      คุณเอง
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                rankUser.totalScore >= 10 
                                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" 
                                  : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {rankUser.totalScore >= 10 ? "Expert" : "Explorer"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right pr-6 font-extrabold text-teal-600 dark:text-teal-400">
                              ⭐ {rankUser.totalScore} คะแนน
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Challenge;

import { HerbalCategory, Garden, Herb, Quiz, Announcement } from "./types";

export const HERBAL_CATEGORIES: HerbalCategory[] = [
  {
    id: "fever",
    name: "แก้ไข้ / รักษาอาการทั่วไป",
    icon: "🌡️",
    color: "#ef4444",
    description: "สมุนไพรที่ใช้ลดไข้ แก้หวัด แก้เจ็บคอ และอาการทั่วไป"
  },
  {
    id: "tonic",
    name: "บำรุงร่างกาย",
    icon: "💪",
    color: "#22c55e",
    description: "สมุนไพรที่ใช้บำรุงร่างกาย เสริมภูมิคุ้มกัน และฟื้นฟูสุขภาพ"
  },
  {
    id: "food",
    name: "อาหาร / เครื่องเทศ",
    icon: "🍲",
    color: "#f59e0b",
    description: "สมุนไพรที่ใช้ปรุงอาหาร เพิ่มกลิ่นรส หรือรับประทานเป็นผักสด"
  },
  {
    id: "insect",
    name: "ไล่แมลง / ดูแลผิว",
    icon: "🦟",
    color: "#8b5cf6",
    description: "สมุนไพรที่ใช้ไล่ยุง กันแมลง หรือรักษาปัญหาผิวหนัง"
  },
  {
    id: "flower",
    name: "ไม้ดอกไม้ประดับ",
    icon: "🌸",
    color: "#ec4899",
    description: "สมุนไพรที่มีความสวยงาม ใช้ทำน้ำหอม หรือเป็นไม้มงคล"
  },
  {
    id: "rare",
    name: "หายาก / อนุรักษ์",
    icon: "⭐",
    color: "#f43f5e",
    description: "สมุนไพรท้องถิ่นที่หาได้ยาก ควรอนุรักษ์และขยายพันธุ์"
  }
];

export const DEFAULT_GARDEN: Garden = {
  gardenId: "HATYAI001",
  name: "ศูนย์บริการสาธารณสุขหาดใหญ่ชีวาสุข",
  logo: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=200&auto=format&fit=crop",
  banner: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&auto=format&fit=crop",
  description: "ศูนย์บริการสาธารณสุขหาดใหญ่ชีวาสุข เป็นหน่วยงานด้านสาธารณสุขที่ให้บริการดูแลสุขภาพแก่ประชาชนในเขตเทศบาลนครหาดใหญ่และพื้นที่ใกล้เคียง โดยได้จัดตั้งสวนสมุนไพรขึ้นเพื่อเป็นแหล่งเรียนรู้ด้านการแพทย์แผนไทย การอนุรักษ์ทรัพยากรสมุนไพร และการใช้ประโยชน์จากภูมิปัญญาท้องถิ่นอย่างยั่งยืน ภายใต้โครงการ 1 อปท. 1 สวนสมุนไพร เฉลิมพระเกียรติพระบาทสมเด็จพระเจ้าอยู่หัว",
  address: "1 ถนนประชายินดี ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110",
  phone: "0-7420-xxxx",
  email: "hatyaibiowellness@example.com",
  openingHours: "จันทร์-ศุกร์ 08:00-16:30 น. / เสาร์-อาทิตย์ 08:00-12:00 น.",
  googleMap: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.0528258384915!2d100.4851211!3d6.0125439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303cd19bc0fc00ff%3A0xe5f14e7a2b978917!2sHatyai%20Chivasook%20Wellness%20Center!5e0!3m2!1sth!2sth!4v1711122345678!5m2!1sth!2sth",
  herbCount: 200,
  facebook: "https://www.facebook.com/HatyaiChivasook",
  website: "https://www.hatyaibiowellness.go.th",
  themeColor: "teal",
  enableQuiz: true,
  enableAI: true,
  enableLeaderboard: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const INITIAL_HERBS: Herb[] = [
  {
    herbId: "HERB001",
    gardenId: "HATYAI001",
    thaiName: "ฟ้าทะลายโจร",
    localName: "น้ำลายพังพอน, ฟ้าสาง",
    scientificName: "Andrographis paniculata",
    family: "Acanthaceae",
    category: "fever",
    description: "ไม้ล้มลุก สูง 30-80 ซม. ใบเดี่ยว เรียวปลายแหลม ดอกสีขาวมีจุดประสีม่วงแดง ทุกส่วนของพืชมีรสขมจัด มีสารสำคัญกลุ่มแลคโตนที่มีฤทธิ์ต้านเชื้อไวรัส แบคทีเรีย และลดการอักเสบ",
    properties: ["แก้ไข้หวัด ตัวร้อน", "แก้เจ็บคอ ทอนซิลอักเสบ", "บรรเทาอาการท้องเสีย ท้องเดินเฉียบพลัน"],
    usage: "นำใบสดหรือแห้งต้มน้ำดื่ม หรือรับประทานชนิดแคปซูลผงยาสมุนไพรตามคำแนะนำแพทย์แผนไทยหรือเภสัชกร",
    precautions: "ห้ามใช้ในหญิงตั้งครรภ์และให้นมบุตร ผู้ที่มีประวัติแพ้ฟ้าทะลายโจร และระวังการใช้ติดต่อกันนานเกินไปเพราะอาจทำให้แขนขาอ่อนแรง",
    images: ["https://thumbs.dreamstime.com/b/fresh-green-andrographis-paniculata-plant-fresh-green-andrographis-paniculata-plant-nature-garden-224809192.jpg?w=992"],
    location: "โซนแก้ไข้ แปลงที่ 1 ต้นที่ 3",
    locationMap: "https://www.google.com/maps",
    qrCode: "",
    reference: ["เภสัชตำรับโรงพยาบาลสงขลานครินทร์", "บัญชียาหลักแห่งชาติ พ.ศ. 2564"],
    relatedHerbs: ["HERB004"],
    viewCount: 154,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    herbId: "HERB002",
    gardenId: "HATYAI001",
    thaiName: "ขมิ้นชัน",
    localName: "ขมิ้นแกง, ขมิ้นหยวก, ขมิ้นหัว",
    scientificName: "Curcuma longa L.",
    family: "Zingiberaceae",
    category: "tonic",
    description: "พืชล้มลุกมีเหง้าใต้ดินสีเหลืองทองถึงส้ม แตกกิ่งก้านสาขามาก ใบเดี่ยวรูปรีปลายแหลม มีสารสำคัญคือ เคอร์คูมินอยด์ (Curcuminoids) และน้ำมันหอมระเหย มีฤทธิ์ต้านอนุมูลอิสระและต้านการอักเสบสูง",
    properties: ["บรรเทาอาการท้องอืด ท้องเฟ้อ จุกเสียด แน่นท้อง", "รักษาแผลในกระเพาะอาหาร", "ขับน้ำดี ช่วยย่อยอาหาร"],
    usage: "นำเหง้าแก่มาล้างทำความสะอาด หั่นบางๆ ตากแห้ง บดเป็นผง ปั้นเป็นยาลูกกลอนหรือชงน้ำร้อนดื่ม หรือใช้ทารักษาโรคผิวหนังอักเสบกากเกลื้อน",
    precautions: "ควรระวังในผู้ที่เป็นนิ่วในถุงน้ำดีเนื่องจากขมิ้นชันมีฤทธิ์ขับน้ำดี และระวังการทานร่วมกับยาต้านการแข็งตัวของเลือด",
    images: ["https://www.dd-productbkk.com/uploads/products/img/cover/l/32_p31.jpg"],
    location: "โซนบำรุงร่างกาย แปลงสมุนไพรมีเหง้าใต้ดิน ต้นที่ 12",
    locationMap: "https://www.google.com/maps",
    qrCode: "",
    reference: ["สารานุกรมสมุนไพรไทย คณะเภสัชศาสตร์ มหาวิทยาลัยมหิดล", "ตำราสรรพคุณยาไทย คณะแพทย์ศาสตร์ศิริราชพยาบาล"],
    relatedHerbs: ["HERB003"],
    viewCount: 232,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    herbId: "HERB003",
    gardenId: "HATYAI001",
    thaiName: "กะเพราแดง",
    localName: "กะเพราขน, กะเพราดำ",
    scientificName: "Ocimum tenuiflorum L.",
    family: "Lamiaceae",
    category: "food",
    description: "ไม้พุ่มเตี้ย สูง 30-60 ซม. ลำต้นและกิ่งก้านมีขนสีแดงอมม่วงอ่อน ใบสีเขียวเข้มแกมแดงม่วง มีกลิ่นหอมฉุนร้อนแรงกว่ากะเพราขาว มีฤทธิ์ขับลม ขับเสมหะ บำรุงธาตุไฟ และแก้อาการท้องอืด",
    properties: ["แก้ท้องอืด ท้องเฟ้อ ขับลมในกระเพาะอาหาร", "บรรเทาอาการไอ ขับเสมหะ", "แก้ปวดท้อง จุกเสียด", "แก้อาการคลื่นไส้อาเจียน"],
    usage: "นำใบสดมาต้มน้ำดื่ม บดเป็นผงชงร้อน หรือตำคั้นเอาน้ำผสมน้ำผึ้งจิบแก้ไอ บำรุงธาตุหลังคลอดบุตร",
    precautions: "ระวังในผู้ป่วยที่ทานยาต้านการแข็งตัวของเลือด และควรระวังหากรับประทานในปริมาณที่มากเกินไปอาจทำให้ร้อนใน",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUAvDifoHl4EcC6TgaOtJ74Z1-3TEtJGZ4e3f25ocolg&s=10"],
    location: "โซนอาหารเครื่องเทศ สวนผักสมุนไพรกินได้ แปลงที่ 4",
    locationMap: "https://www.google.com/maps",
    qrCode: "",
    reference: ["สถาบันการแพทย์แผนไทย กรมการแพทย์แผนไทยและการแพทย์ทางเลือก", "ตำราอาหารสมานธาตุไทย"],
    relatedHerbs: ["HERB002"],
    viewCount: 189,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    herbId: "HERB004",
    gardenId: "HATYAI001",
    thaiName: "เสลดพังพอนตัวเมีย",
    localName: "พญายอ, ลิ้นมังกร",
    scientificName: "Clinacanthus nutans",
    family: "Acanthaceae",
    category: "insect",
    description: "ไม้พุ่มเลื้อย สูง 1-3 เมตร ดอกสีส้มแดงเป็นหลอดยาว ใบรียาว ปลายแหลม ปลูกง่าย มีฤทธิ์ต้านเชื้อไวรัสกลุ่มเริม ต้านการอักเสบจากแมลงสัตว์กัดต่อยอย่างเห็นผลชัดเจน",
    properties: ["รักษาแผลเริม งูสวัด", "แก้พิษแมลงสัตว์กัดต่อย ตะขาบ แมงป่อง ยุงกัด", "แก้ตุ่มคัน อักเสบทางผิวหนัง"],
    usage: "นำใบสด 10-15 ใบ มาล้างทำความสะอาด ตำให้ละเอียดผสมเหล้าขาวหรือน้ำมะนาวเล็กน้อย ทาบริเวณที่เป็นแผลอักเสบ หรือทำเป็นคาลาไมน์เจลพญายอ",
    precautions: "ใช้เฉพาะภายนอกเท่านั้น ห้ามรับประทานน้ำคั้นสดโดยตรง และควรล้างแผลให้สะอาดก่อนทายาเพื่อป้องกันการติดเชื้อแบคทีเรียแทรกซ้อน",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ6EHL9_FaGsofxFSLqnTu5Rf1ozu6wxtNixW6hB689A&s=10"],
    location: "โซนไล่แมลงและดูแลผิวพรรณ แปลงริมกำแพงทิศใต้ ต้นที่ 8",
    locationMap: "https://www.google.com/maps",
    qrCode: "",
    reference: ["ศูนย์ข้อมูลสมุนไพร คณะเภสัชศาสตร์ มหาวิทยาลัยมหิดล", "วารสารการแพทย์แผนไทยและแพทย์ทางเลือก"],
    relatedHerbs: ["HERB001"],
    viewCount: 312,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    herbId: "HERB005",
    gardenId: "HATYAI001",
    thaiName: "พุดซ้อน",
    localName: "อินถะหวา, พุดจีน",
    scientificName: "Gardenia jasminoides",
    family: "Rubiaceae",
    category: "flower",
    description: "ไม้พุ่ม สูง 1-2 เมตร ใบเขียวมันหนา ดอกสีขาวนวลกลิ่นหอมแรง ดอกซ้อนงดงาม โบราณใช้เป็นสมุนไพรดับพิษร้อน ถอนพิษไข้ ดอกคั้นเอาน้ำมันมาทำน้ำอบไทย",
    properties: ["ดับพิษร้อน แก้ไข้ตัวร้อน ถอนพิษอักเสบ", "แก้อาการระคายเคืองตา", "น้ำมันจากดอกช่วยผ่อนคลายความเครียด ทำให้นอนหลับง่าย"],
    usage: "นำดอกแห้งมาชงชาดื่มแก้กระสับกระส่าย ดับพิษร้อน หรือใช้รากต้มดื่มแก้ไข้ แก้ไข้หวัดตัวร้อน",
    precautions: "ผู้ที่มีอาการท้องเสีย ท้องเย็น ไม่ควรดื่มในปริมาณที่มากหรือติดต่อกันนานเกินไป",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTMd7PYEIwfYmwlZrC1CFqOzvkLU5c24ju_ilRmqVI1A&s=10"],
    location: "โซนไม้ดอกไม้ประดับและอโรมาเทอราปี แปลงที่ 2",
    locationMap: "https://www.google.com/maps",
    qrCode: "",
    reference: ["พจนานุกรมสมุนไพรไทย", "ตำราน้ำหอมไทยโบราณ"],
    relatedHerbs: [],
    viewCount: 145,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    quizId: "QUIZ001",
    gardenId: "HATYAI001",
    herbId: "HERB001",
    question: "ข้อใดคือสรรพคุณหลักของ 'ฟ้าทะลายโจร' ที่ได้รับการบรรจุลงในบัญชียาหลักแห่งชาติ?",
    answer: "แก้ไข้หวัด ตัวร้อน บรรเทาอาการเจ็บคอ",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    quizId: "QUIZ002",
    gardenId: "HATYAI001",
    herbId: "HERB001",
    question: "ฟ้าทะลายโจรมีข้อควรระวังสำคัญสำหรับบุคคลกลุ่มใดบ้าง?",
    answer: "สตรีมีครรภ์ สตรีให้นมบุตร และผู้มีประวัติแพ้ยาตระกูลนี้",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    quizId: "QUIZ003",
    gardenId: "HATYAI001",
    herbId: "HERB002",
    question: "สารเคอร์คูมินอยด์ (Curcuminoids) ที่ทำให้ขมิ้นชันมีฤทธิ์ต้านอนุมูลอิสระ พบได้มากในส่วนใดของพืช?",
    answer: "เหง้าแก่ใต้ดิน",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    quizId: "QUIZ004",
    gardenId: "HATYAI001",
    herbId: "HERB002",
    question: "เมื่อเกิดอาการจุกเสียด แน่นท้อง ท้องอืด ท้องเฟ้อ ขมิ้นชันช่วยแก้อาการเหล่านี้ได้อย่างไร?",
    answer: "ช่วยขับลม ขับน้ำดีมาช่วยย่อยอาหาร และรักษาแผลในกระเพาะอาหาร",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    quizId: "QUIZ005",
    gardenId: "HATYAI001",
    herbId: "HERB003",
    question: "เหตุใดใบกะเพราแดงจึงนิยมนำมาบดคั้นชงดื่มแก้อาการสำหรับคุณแม่หลังคลอด?",
    answer: "ช่วยขับลม ขับเสมหะ บำรุงธาตุไฟ เพิ่มกำลัง และช่วยกระตุ้นน้ำนม",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    quizId: "QUIZ006",
    gardenId: "HATYAI001",
    herbId: "HERB004",
    question: "เสลดพังพอนตัวเมียหรือใบพญายอนิยมนำมาใช้ทำ คาลาไมน์ทาตุ่มคัน เพื่อรักษาโรคผิวหนังหรือการอักเสบชนิดใด?",
    answer: "แผลเริม งูสวัด ตุ่มคันจากแพ้แมลงสัตว์กัดต่อย",
    score: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    announcementId: "ANN001",
    gardenId: "HATYAI001",
    title: "เปิดตัวผู้ช่วยเรียนรู้สมุนไพรอัจฉริยะ AI Herbal Learning Platform",
    content: "ศูนย์บริการสาธารณสุขหาดใหญ่ชีวาสุข ขอนำเสนอระบบผู้ช่วยส่วนตัวในการศึกษาพืชพรรณสมุนไพร เพื่อให้ประชาชนได้รับข้อมูลสมุนไพรที่ถูกต้องตามหลักวิชาการแพทย์แผนไทย สามารถสแกนกล้องวิเคราะห์พืช และตอบปัญหาความรู้เพื่อรับใบเกียรติบัตรอิเล็กทรอนิกส์ได้ทันที!",
    image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800&auto=format&fit=crop",
    priority: "important",
    publishedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    announcementId: "ANN002",
    gardenId: "HATYAI001",
    title: "กิจกรรมอบรมแปรรูปสมุนไพรท้องถิ่นเพื่อสร้างรายได้ชุมชน",
    content: "ขอเชิญชาวหาดใหญ่และผู้สนใจเข้าร่วมรับการอบรมฟรี ในหัวข้อ 'การทำลูกประคบ สมุนไพรนวดฝ่าเท้า และเจลทากลุ่มเสลดพังพอนพญายอ' ณ สวนสมุนไพรชีวาสุข ในวันเสาร์หน้า เวลา 09:00 - 12:00 น. จำกัดจำนวน 40 ท่านแรก!",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    priority: "normal",
    publishedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

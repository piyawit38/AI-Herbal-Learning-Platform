import { Garden, Herb, Quiz, Announcement, User, LearningRecord, Certificate, ChatLog } from "../types";
import { DEFAULT_GARDEN, INITIAL_HERBS, INITIAL_QUIZZES, INITIAL_ANNOUNCEMENTS } from "../constants";

// Helper keys for localStorage
const KEYS = {
  GARDENS: "herbal_platform_gardens",
  HERBS: "herbal_platform_herbs",
  QUIZZES: "herbal_platform_quizzes",
  ANNOUNCEMENTS: "herbal_platform_announcements",
  USERS: "herbal_platform_users",
  LEARNING_RECORDS: "herbal_platform_learning_records",
  CERTIFICATES: "herbal_platform_certificates",
  CHAT_LOGS: "herbal_platform_chat_logs",
  CURRENT_USER: "herbal_platform_current_user",
  CURRENT_GARDEN_ID: "herbal_platform_current_garden_id"
};

// Initialize Database if empty
export function initDB() {
  if (!localStorage.getItem(KEYS.GARDENS)) {
    localStorage.setItem(KEYS.GARDENS, JSON.stringify([DEFAULT_GARDEN]));
  } else {
    try {
      const existingGardens = JSON.parse(localStorage.getItem(KEYS.GARDENS) || "[]") as Garden[];
      let updated = false;
      const updatedGardens = existingGardens.map(existing => {
        if (existing.gardenId === "HATYAI001" && (existing.name === "กลุ่มนักเรียน SMA ญว." || !existing.name)) {
          existing.name = DEFAULT_GARDEN.name;
          existing.description = DEFAULT_GARDEN.description;
          updated = true;
        }
        if (existing.facebook === undefined) {
          existing.facebook = DEFAULT_GARDEN.facebook;
          updated = true;
        }
        if (existing.website === undefined) {
          existing.website = DEFAULT_GARDEN.website;
          updated = true;
        }
        if (existing.themeColor === undefined) {
          existing.themeColor = DEFAULT_GARDEN.themeColor;
          updated = true;
        }
        if (existing.enableQuiz === undefined) {
          existing.enableQuiz = DEFAULT_GARDEN.enableQuiz;
          updated = true;
        }
        if (existing.enableAI === undefined) {
          existing.enableAI = DEFAULT_GARDEN.enableAI;
          updated = true;
        }
        if (existing.enableLeaderboard === undefined) {
          existing.enableLeaderboard = DEFAULT_GARDEN.enableLeaderboard;
          updated = true;
        }
        return existing;
      });
      if (updated) {
        localStorage.setItem(KEYS.GARDENS, JSON.stringify(updatedGardens));
      }
    } catch (e) {
      localStorage.setItem(KEYS.GARDENS, JSON.stringify([DEFAULT_GARDEN]));
    }
  }
  if (!localStorage.getItem(KEYS.HERBS)) {
    localStorage.setItem(KEYS.HERBS, JSON.stringify(INITIAL_HERBS));
  } else {
    try {
      const existingHerbs = JSON.parse(localStorage.getItem(KEYS.HERBS) || "[]") as Herb[];
      let updated = false;
      const updatedHerbs = existingHerbs.map(existing => {
        const initial = INITIAL_HERBS.find(h => h.herbId === existing.herbId);
        if (initial) {
          if (JSON.stringify(existing.images) !== JSON.stringify(initial.images)) {
            existing.images = initial.images;
            updated = true;
          }
          if (existing.thaiName !== initial.thaiName) {
            existing.thaiName = initial.thaiName;
            updated = true;
          }
          if (existing.description !== initial.description) {
            existing.description = initial.description;
            updated = true;
          }
          if (existing.properties.join(",") !== initial.properties.join(",")) {
            existing.properties = initial.properties;
            updated = true;
          }
          if (existing.usage !== initial.usage) {
            existing.usage = initial.usage;
            updated = true;
          }
          if (existing.precautions !== initial.precautions) {
            existing.precautions = initial.precautions;
            updated = true;
          }
        }
        return existing;
      });
      if (updated) {
        localStorage.setItem(KEYS.HERBS, JSON.stringify(updatedHerbs));
      }
    } catch (e) {
      localStorage.setItem(KEYS.HERBS, JSON.stringify(INITIAL_HERBS));
    }
  }
  if (!localStorage.getItem(KEYS.QUIZZES)) {
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
  }
  if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(KEYS.CURRENT_GARDEN_ID)) {
    localStorage.setItem(KEYS.CURRENT_GARDEN_ID, "HATYAI001");
  }
}

// Low-level helper to read from localStorage
function read<T>(key: string, defaultValue: T): T {
  initDB();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

// Low-level helper to write to localStorage
function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- GARDENS OPERATIONS ---
export function getGardens(): Garden[] {
  return read<Garden[]>(KEYS.GARDENS, [DEFAULT_GARDEN]);
}

export function getGarden(gardenId: string): Garden | null {
  const list = getGardens();
  return list.find(g => g.gardenId === gardenId) || null;
}

export function saveGarden(garden: Garden): void {
  const list = getGardens();
  const idx = list.findIndex(g => g.gardenId === garden.gardenId);
  if (idx > -1) {
    list[idx] = { ...garden, updatedAt: new Date().toISOString() };
  } else {
    list.push({ ...garden, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  write(KEYS.GARDENS, list);
}

// --- HERBS OPERATIONS ---
export function getHerbs(gardenId?: string): Herb[] {
  const list = read<Herb[]>(KEYS.HERBS, INITIAL_HERBS);
  if (gardenId) {
    return list.filter(h => h.gardenId === gardenId);
  }
  return list;
}

export function getHerb(herbId: string): Herb | null {
  const list = getHerbs();
  return list.find(h => h.herbId === herbId) || null;
}

export function saveHerb(herb: Herb): void {
  const list = getHerbs();
  const idx = list.findIndex(h => h.herbId === herb.herbId);
  const herbToSave = { ...herb, updatedAt: new Date().toISOString() };

  if (idx > -1) {
    list[idx] = herbToSave;
  } else {
    list.push({
      ...herbToSave,
      createdAt: new Date().toISOString(),
      viewCount: 0
    });
  }
  write(KEYS.HERBS, list);
  
  // Update Herb Count in the garden
  updateGardenHerbCount(herb.gardenId);
}

export function deleteHerb(herbId: string, gardenId: string): void {
  let list = getHerbs();
  list = list.filter(h => h.herbId !== herbId);
  write(KEYS.HERBS, list);
  updateGardenHerbCount(gardenId);

  // Clean quizzes associated
  let quizList = getQuizzes(gardenId);
  quizList = quizList.filter(q => q.herbId !== herbId);
  write(KEYS.QUIZZES, quizList);
}

function updateGardenHerbCount(gardenId: string): void {
  const count = getHerbs(gardenId).length;
  const garden = getGarden(gardenId);
  if (garden) {
    saveGarden({ ...garden, herbCount: count });
  }
}

// --- QUIZZES OPERATIONS ---
export function getQuizzes(gardenId?: string): Quiz[] {
  const list = read<Quiz[]>(KEYS.QUIZZES, INITIAL_QUIZZES);
  if (gardenId) {
    return list.filter(q => q.gardenId === gardenId);
  }
  return list;
}

export function getQuiz(quizId: string): Quiz | null {
  const list = getQuizzes();
  return list.find(q => q.quizId === quizId) || null;
}

export function saveQuiz(quiz: Quiz): void {
  const list = getQuizzes();
  const idx = list.findIndex(q => q.quizId === quiz.quizId);
  if (idx > -1) {
    list[idx] = { ...quiz, updatedAt: new Date().toISOString() };
  } else {
    list.push({ ...quiz, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  write(KEYS.QUIZZES, list);
}

export function deleteQuiz(quizId: string): void {
  let list = getQuizzes();
  list = list.filter(q => q.quizId !== quizId);
  write(KEYS.QUIZZES, list);
}

// --- ANNOUNCEMENTS OPERATIONS ---
export function getAnnouncements(gardenId?: string): Announcement[] {
  const list = read<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  if (gardenId) {
    return list.filter(a => a.gardenId === gardenId);
  }
  return list;
}

export function saveAnnouncement(announcement: Announcement): void {
  const list = read<Announcement[]>(KEYS.ANNOUNCEMENTS, []);
  const idx = list.findIndex(a => a.announcementId === announcement.announcementId);
  if (idx > -1) {
    list[idx] = announcement;
  } else {
    list.push(announcement);
  }
  write(KEYS.ANNOUNCEMENTS, list);
}

// --- USERS OPERATIONS & PROFILE ---
export function getUsers(): User[] {
  return read<User[]>(KEYS.USERS, []);
}

export function getUser(userId: string): User | null {
  const list = getUsers();
  return list.find(u => u.userId === userId) || null;
}

export function saveUser(user: User): void {
  const list = getUsers();
  const idx = list.findIndex(u => u.userId === user.userId);
  if (idx > -1) {
    list[idx] = { ...user, updatedAt: new Date().toISOString() };
  } else {
    list.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  write(KEYS.USERS, list);
  
  // If editing current session user, update session as well
  const curr = getCurrentUser();
  if (curr && curr.userId === user.userId) {
    write(KEYS.CURRENT_USER, user);
  }
}

export function getCurrentUser(): User | null {
  return read<User | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  write(KEYS.CURRENT_USER, user);
}

export function getActiveGardenId(): string {
  return localStorage.getItem(KEYS.CURRENT_GARDEN_ID) || "HATYAI001";
}

export function setActiveGardenId(gardenId: string): void {
  localStorage.setItem(KEYS.CURRENT_GARDEN_ID, gardenId);
}

// --- LEARNING RECORDS ---
export function getLearningRecords(userId?: string): LearningRecord[] {
  const list = read<LearningRecord[]>(KEYS.LEARNING_RECORDS, []);
  if (userId) {
    return list.filter(r => r.userId === userId);
  }
  return list;
}

export function saveLearningRecord(record: LearningRecord): void {
  const list = getLearningRecords();
  const idx = list.findIndex(r => r.recordId === record.recordId);
  if (idx > -1) {
    list[idx] = record;
  } else {
    list.push(record);
  }
  write(KEYS.LEARNING_RECORDS, list);
}

// --- CERTIFICATES ---
export function getCertificates(userId?: string): Certificate[] {
  const list = read<Certificate[]>(KEYS.CERTIFICATES, []);
  if (userId) {
    return list.filter(c => c.userId === userId);
  }
  return list;
}

export function saveCertificate(certificate: Certificate): void {
  const list = getCertificates();
  list.push(certificate);
  write(KEYS.CERTIFICATES, list);
}

// --- CHAT LOGS ---
export function getChatLogs(gardenId?: string): ChatLog[] {
  const list = read<ChatLog[]>(KEYS.CHAT_LOGS, []);
  if (gardenId) {
    return list.filter(l => l.gardenId === gardenId);
  }
  return list;
}

export function saveChatLog(log: ChatLog): void {
  const list = read<ChatLog[]>(KEYS.CHAT_LOGS, []);
  const idx = list.findIndex(l => l.chatId === log.chatId);
  if (idx > -1) {
    list[idx] = log;
  } else {
    list.push(log);
  }
  write(KEYS.CHAT_LOGS, list);
}

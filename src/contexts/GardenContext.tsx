import React, { createContext, useContext, useState, useEffect } from "react";
import { Garden, Herb, Quiz, Announcement } from "../types";
import { getGarden, getActiveGardenId, setActiveGardenId, getHerbs, getQuizzes, getAnnouncements, getGardens } from "../services/db";

interface GardenContextType {
  currentGarden: Garden;
  allGardens: Garden[];
  switchGarden: (gardenId: string) => void;
  getGardenHerbs: () => Herb[];
  getGardenQuizzes: () => Quiz[];
  getGardenAnnouncements: () => Announcement[];
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentGarden, setCurrentGarden] = useState<Garden>(() => {
    const activeId = getActiveGardenId();
    const g = getGarden(activeId);
    if (g) return g;
    // Fallback to first available or standard
    const list = getGardens();
    return list[0];
  });

  const [allGardens, setAllGardens] = useState<Garden[]>([]);

  useEffect(() => {
    // Refresh list of gardens
    setAllGardens(getGardens());
  }, [currentGarden]);

  const switchGarden = (gardenId: string) => {
    const g = getGarden(gardenId);
    if (g) {
      setActiveGardenId(gardenId);
      setCurrentGarden(g);
    }
  };

  const getGardenHerbs = () => getHerbs(currentGarden.gardenId);
  const getGardenQuizzes = () => getQuizzes(currentGarden.gardenId);
  const getGardenAnnouncements = () => getAnnouncements(currentGarden.gardenId);

  return (
    <GardenContext.Provider
      value={{
        currentGarden,
        allGardens,
        switchGarden,
        getGardenHerbs,
        getGardenQuizzes,
        getGardenAnnouncements
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) throw new Error("useGarden must be used within a GardenProvider");
  return context;
};

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initialData,
  timeSlots,
  type AnalysisHistory,
  type AppData,
  type Medication,
  type ScheduleItem,
  type TimeSlot,
  type UserProfile,
} from "@/data/sample";

const STORAGE_KEY = "pill-checker:v1";

const buildEmptyRoutine = (): UserProfile["routines"] =>
  timeSlots.reduce<UserProfile["routines"]>(
    (acc, slot) => ({ ...acc, [slot]: [] }),
    {} as UserProfile["routines"],
  );

const sanitizeCount = (count: number) => Math.max(1, Math.min(count, 10));

export const useAppData = () => {
  const [data, setData] = useState<AppData>(initialData);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: AppData = JSON.parse(raw);
      setData(parsed);
      hasHydrated.current = true;
    } catch {
      // 読み込み失敗時は初期データを維持
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated.current && data === initialData) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 保存できなくてもアプリは継続
    }
  }, [data]);

  const addMedication = useCallback((input: Omit<Medication, "id">) => {
    setData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { ...input, id: crypto.randomUUID() },
      ],
    }));
  }, []);

  const addUser = useCallback(
    (input: { name: string; avatarColor: string; notes?: string }) => {
      setData((prev) => ({
        ...prev,
        userProfiles: [
          ...prev.userProfiles,
          {
            id: crypto.randomUUID(),
            name: input.name || "新しいユーザー",
            avatarColor: input.avatarColor || "#94a3b8",
            notes: input.notes ?? "",
            routines: buildEmptyRoutine(),
          },
        ],
      }));
    },
    [],
  );

  const addScheduleItem = useCallback(
    (payload: {
      userId: string;
      slot: TimeSlot;
      item: ScheduleItem;
    }) => {
      setData((prev) => ({
        ...prev,
        userProfiles: prev.userProfiles.map((user) => {
          if (user.id !== payload.userId) return user;
          const existing = user.routines[payload.slot] ?? [];
          const hasMed = existing.find(
            (entry) => entry.medicationId === payload.item.medicationId,
          );
          const updatedList = hasMed
            ? existing.map((entry) =>
                entry.medicationId === payload.item.medicationId
                  ? { ...entry, count: sanitizeCount(payload.item.count) }
                  : entry,
              )
            : [...existing, { ...payload.item, count: sanitizeCount(payload.item.count) }];

          return {
            ...user,
            routines: {
              ...user.routines,
              [payload.slot]: updatedList,
            },
          };
        }),
      }));
    },
    [],
  );

  const updateMedication = useCallback((id: string, input: Partial<Medication>) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.map((med) =>
        med.id === id ? { ...med, ...input } : med,
      ),
    }));
  }, []);

  const deleteMedication = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.filter((med) => med.id !== id),
      userProfiles: prev.userProfiles.map((user) => ({
        ...user,
        routines: Object.fromEntries(
          Object.entries(user.routines).map(([slot, items]) => [
            slot,
            items.filter((item) => item.medicationId !== id),
          ]),
        ) as UserProfile["routines"],
      })),
    }));
  }, []);

  const updateUser = useCallback(
    (id: string, input: Partial<UserProfile>) => {
      setData((prev) => ({
        ...prev,
        userProfiles: prev.userProfiles.map((user) =>
          user.id === id ? { ...user, ...input } : user,
        ),
      }));
    },
    [],
  );

  const deleteUser = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      userProfiles: prev.userProfiles.filter((user) => user.id !== id),
    }));
  }, []);

  const deleteScheduleItem = useCallback(
    (payload: { userId: string; slot: TimeSlot; medicationId: string }) => {
      setData((prev) => ({
        ...prev,
        userProfiles: prev.userProfiles.map((user) => {
          if (user.id !== payload.userId) return user;
          const existing = user.routines[payload.slot] ?? [];
          return {
            ...user,
            routines: {
              ...user.routines,
              [payload.slot]: existing.filter(
                (item) => item.medicationId !== payload.medicationId,
              ),
            },
          };
        }),
      }));
    },
    [],
  );

  const addAnalysisHistory = useCallback((history: Omit<AnalysisHistory, "id">) => {
    const newHistory: AnalysisHistory = {
      ...history,
      id: crypto.randomUUID(),
    };
    setData((prev) => ({
      ...prev,
      analysisHistory: [newHistory, ...prev.analysisHistory].slice(0, 50), // 最新50件まで保持
    }));
    // 24時間以上古い履歴を削除
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    setData((prev) => ({
      ...prev,
      analysisHistory: prev.analysisHistory.filter(
        (h) => new Date(h.timestamp).getTime() > oneDayAgo,
      ),
    }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    data,
    addMedication,
    updateMedication,
    deleteMedication,
    addUser,
    updateUser,
    deleteUser,
    addScheduleItem,
    deleteScheduleItem,
    addAnalysisHistory,
    resetData,
  };
};


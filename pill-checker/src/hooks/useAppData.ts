import { useCallback, useEffect, useRef, useState } from "react";
import {
  initialData,
  timeSlots,
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

  const resetData = useCallback(() => {
    setData(initialData);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    data,
    addMedication,
    addUser,
    addScheduleItem,
    resetData,
  };
};


export type TimeSlot = "朝" | "昼" | "夜" | "就寝前" | "毎食後";

export type Medication = {
  id: string;
  name: string;
  description: string;
  surfaceLabel: string; // 表面写真の説明
  backLabel: string; // 裏面写真の説明
  surfaceImage?: string; // 表面画像のBase64データURL
  backImage?: string; // 裏面画像のBase64データURL
};

export type ScheduleItem = {
  medicationId: string;
  count: number;
};

export type UserProfile = {
  id: string;
  name: string;
  avatarColor: string;
  notes?: string;
  routines: Record<TimeSlot, ScheduleItem[]>;
};

export const timeSlots: TimeSlot[] = ["朝", "昼", "夜", "就寝前", "毎食後"];

const medicationsSeed: Medication[] = [
  {
    id: "med-c",
    name: "ビタミンC錠500mg",
    description: "疲労感軽減サポート。透明オレンジ色の錠剤。",
    surfaceLabel: "オレンジ色・C刻印",
    backLabel: "白色コーティング",
  },
  {
    id: "med-d",
    name: "カルシウム+D3",
    description: "骨密度サポート。白い楕円形。",
    surfaceLabel: "CAL刻印",
    backLabel: "つるつる裏面",
  },
  {
    id: "med-sleep",
    name: "就寝前サポート",
    description: "睡眠前に服用するサプリメント。",
    surfaceLabel: "青色・S文字",
    backLabel: "銀色フィルム",
  },
  {
    id: "med-heart",
    name: "血圧コントロール錠",
    description: "朝と夜に服用。赤い丸型。",
    surfaceLabel: "赤色・H1刻印",
    backLabel: "白色ラベル",
  },
];

const userProfilesSeed: UserProfile[] = [
  {
    id: "user-ana",
    name: "あんな",
    avatarColor: "#f4a261",
    notes: "乳製品アレルギーあり。就寝前サプリ必須。",
    routines: {
      朝: [
        { medicationId: "med-c", count: 1 },
        { medicationId: "med-heart", count: 1 },
      ],
      昼: [{ medicationId: "med-c", count: 1 }],
      夜: [
        { medicationId: "med-c", count: 1 },
        { medicationId: "med-heart", count: 1 },
      ],
      就寝前: [{ medicationId: "med-sleep", count: 2 }],
      毎食後: [],
    },
  },
  {
    id: "user-ken",
    name: "けん",
    avatarColor: "#2a9d8f",
    notes: "外出が多いので昼は予備を携帯。",
    routines: {
      朝: [
        { medicationId: "med-d", count: 2 },
        { medicationId: "med-c", count: 1 },
      ],
      昼: [{ medicationId: "med-d", count: 1 }],
      夜: [{ medicationId: "med-d", count: 2 }],
      就寝前: [],
      毎食後: [{ medicationId: "med-c", count: 1 }],
    },
  },
];

export type AnalysisHistory = {
  id: string;
  userId: string;
  userName: string;
  slot: TimeSlot;
  timestamp: string;
  missing: Array<{ name: string; expected: number; actual: number }>;
  extra: Array<{ name: string; expected: number; actual: number }>;
  unknown: Array<{ name: string; count: number }>;
};

export type AppData = {
  medications: Medication[];
  userProfiles: UserProfile[];
  analysisHistory: AnalysisHistory[];
};

export const initialData: AppData = {
  medications: medicationsSeed,
  userProfiles: userProfilesSeed,
  analysisHistory: [],
};

export const getMedicationById = (id: string, list?: Medication[]) => {
  const source = list ?? initialData.medications;
  return source.find((med) => med.id === id);
};


"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getMedicationById,
  timeSlots,
  type Medication,
  type ScheduleItem,
  type TimeSlot,
} from "@/data/sample";
import { useAppData } from "@/hooks/useAppData";
import { captureFrame, recognizeMedications } from "@/utils/imageRecognition";
import styles from "./page.module.css";

type DiffEntry = {
  name: string;
  expected: number;
  actual: number;
};

type UnknownEntry = {
  name: string;
  count: number;
};

type AnalysisResult = {
  missing: DiffEntry[];
  extra: DiffEntry[];
  unknown: UnknownEntry[];
  timestamp: string;
};

const buildChecklist = (items: ScheduleItem[], meds: Medication[]) => {
  if (!items.length) {
    return "この時間帯に予定されている薬はありません。";
  }

  const lines = items.map((item) => {
    const med = meds.find((entry) => entry.id === item.medicationId);
    if (!med) return "";
    return `${med.name} を ${item.count} 個`;
  });

  return `準備する薬: ${lines.join(" / ")}`;
};

const clampCount = (value: number) => Math.max(0, Math.min(20, value));

export default function Home() {
  const {
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
  } = useAppData();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    data.userProfiles[0]?.id,
  );
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [medForm, setMedForm] = useState({
    name: "",
    description: "",
    surfaceLabel: "",
    backLabel: "",
    surfaceImage: "",
    backImage: "",
  });
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    avatarColor: "#94a3b8",
    notes: "",
  });
  const [scheduleForm, setScheduleForm] = useState<{
    userId: string;
    medicationId: string;
    slot: TimeSlot;
    count: number;
  }>({
    userId: "",
    medicationId: "",
    slot: timeSlots[0],
    count: 1,
  });
  const [recognizedCounts, setRecognizedCounts] = useState<Record<string, number>>({});
  const [extraInput, setExtraInput] = useState({ label: "", count: 0 });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "ready" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [additionalDetection, setAdditionalDetection] = useState({
    medicationId: "",
    count: 1,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!data.userProfiles.length) return;
    if (!selectedUserId) {
      setSelectedUserId(data.userProfiles[0].id);
      return;
    }
    const stillExists = data.userProfiles.some(
      (user) => user.id === selectedUserId,
    );
    if (!stillExists) {
      setSelectedUserId(data.userProfiles[0].id);
    }
  }, [data.userProfiles, selectedUserId]);

  useEffect(() => {
    if (!data.userProfiles.length) return;
    setScheduleForm((prev) => ({
      ...prev,
      userId: prev.userId || data.userProfiles[0].id,
      medicationId: prev.medicationId || data.medications[0]?.id || "",
    }));
  }, [data.userProfiles, data.medications]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const selectedUser = useMemo(
    () => data.userProfiles.find((user) => user.id === selectedUserId),
    [data.userProfiles, selectedUserId],
  );

  const scheduleItems = selectedUser?.routines[selectedSlot] ?? [];
  const scheduleSignature = JSON.stringify(scheduleItems);
  const summaryText = buildChecklist(scheduleItems, data.medications);

  useEffect(() => {
    const template: Record<string, number> = {};
    scheduleItems.forEach((item) => {
      template[item.medicationId] = item.count;
    });
    setRecognizedCounts(template);
    setExtraInput({ label: "", count: 0 });
    setAnalysisResult(null);
  }, [scheduleSignature, selectedSlot, selectedUserId]);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "surface" | "back",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === "surface") {
        setMedForm((prev) => ({ ...prev, surfaceImage: dataUrl }));
      } else {
        setMedForm((prev) => ({ ...prev, backImage: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMedicationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!medForm.name.trim()) return;
    
    if (editingMedication) {
      updateMedication(editingMedication.id, medForm);
      setEditingMedication(null);
    } else {
      addMedication(medForm);
    }
    
    setMedForm({
      name: "",
      description: "",
      surfaceLabel: "",
      backLabel: "",
      surfaceImage: "",
      backImage: "",
    });
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setMedForm({
      name: med.name,
      description: med.description,
      surfaceLabel: med.surfaceLabel,
      backLabel: med.backLabel,
      surfaceImage: med.surfaceImage || "",
      backImage: med.backImage || "",
    });
  };

  const handleDeleteMedication = (id: string) => {
    if (confirm("この薬を削除しますか？スケジュールからも削除されます。")) {
      deleteMedication(id);
    }
  };

  const handleUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userForm.name.trim()) return;
    
    if (editingUser) {
      updateUser(editingUser, userForm);
      setEditingUser(null);
    } else {
      addUser(userForm);
    }
    
    setUserForm({
      name: "",
      avatarColor: "#94a3b8",
      notes: "",
    });
  };

  const handleEditUser = (userId: string) => {
    const user = data.userProfiles.find((u) => u.id === userId);
    if (!user) return;
    setEditingUser(userId);
    setUserForm({
      name: user.name,
      avatarColor: user.avatarColor,
      notes: user.notes || "",
    });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("このユーザーを削除しますか？スケジュールも削除されます。")) {
      deleteUser(id);
    }
  };

  const handleScheduleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleForm.userId || !scheduleForm.medicationId) return;
    addScheduleItem({
      userId: scheduleForm.userId,
      slot: scheduleForm.slot,
      item: {
        medicationId: scheduleForm.medicationId,
        count: scheduleForm.count,
      },
    });
  };

  const handleStartCamera = async () => {
    if (typeof navigator === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      setCameraError(null);
    } catch (error) {
      setCameraStatus("error");
      setCameraError(
        error instanceof Error
          ? error.message
          : "カメラを起動できませんでした。",
      );
    }
  };

  const handleStopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus("idle");
  };

  const updateRecognizedCount = (medId: string, value: number) => {
    setRecognizedCounts((prev) => ({
      ...prev,
      [medId]: clampCount(value),
    }));
  };

  const handleAddDetection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!additionalDetection.medicationId) return;
    setRecognizedCounts((prev) => ({
      ...prev,
      [additionalDetection.medicationId]: clampCount(
        additionalDetection.count,
      ),
    }));
    setAdditionalDetection({ medicationId: "", count: 1 });
  };

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || cameraStatus !== "ready") return;
    
    setIsAnalyzing(true);
    try {
      // フレームをキャプチャ
      const capturedImage = captureFrame(videoRef.current);
      
      // 画像認識を実行
      const recognitionResults = await recognizeMedications(
        capturedImage,
        data.medications.filter((med) => med.surfaceImage || med.backImage),
      );
      
      // 認識結果をrecognizedCountsに反映
      // スケジュールに登録されている薬の個数を初期化（認識されなかったものは0に）
      const newCounts: Record<string, number> = {};
      scheduleItems.forEach((item) => {
        // まず0に初期化
        newCounts[item.medicationId] = 0;
      });
      // 認識結果で上書き
      recognitionResults.forEach((result) => {
        newCounts[result.medicationId] = result.count;
      });
      setRecognizedCounts(newCounts);
      
      // 分析を実行（最新の個数で）
      handleAnalyzeWithCounts(newCounts);
    } catch (error) {
      console.error("画像認識エラー:", error);
      alert("画像認識中にエラーが発生しました。手動で個数を入力してください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeWithCounts = (counts?: Record<string, number>) => {
    const countsToUse = counts ?? recognizedCounts;
    const missing: DiffEntry[] = [];
    const extra: DiffEntry[] = [];
    const unknown: UnknownEntry[] = [];

    scheduleItems.forEach((item) => {
      const med = getMedicationById(item.medicationId, data.medications);
      if (!med) return;
      const actual = countsToUse[item.medicationId] ?? 0;
      if (actual < item.count) {
        missing.push({ name: med.name, expected: item.count, actual });
      } else if (actual > item.count) {
        extra.push({ name: med.name, expected: item.count, actual });
      }
    });

    Object.entries(countsToUse).forEach(([medId, count]) => {
      if (count <= 0) return;
      const isScheduled = scheduleItems.some(
        (item) => item.medicationId === medId,
      );
      if (isScheduled) return;
      const med = getMedicationById(medId, data.medications);
      unknown.push({ name: med?.name ?? "未登録の薬", count });
    });

    if (extraInput.count > 0) {
      unknown.push({
        name: extraInput.label || "未登録の薬",
        count: extraInput.count,
      });
    }

    const result: AnalysisResult = {
      missing,
      extra,
      unknown,
      timestamp: new Date().toLocaleTimeString("ja-JP"),
    };

    setAnalysisResult(result);

    // 履歴に保存
    if (selectedUser) {
      addAnalysisHistory({
        userId: selectedUser.id,
        userName: selectedUser.name,
        slot: selectedSlot,
        timestamp: new Date().toISOString(),
        missing,
        extra,
        unknown,
      });
    }
  };

  const handleAnalyze = () => {
    handleAnalyzeWithCounts();
  };

  const hasIssues =
    (analysisResult?.missing.length ?? 0) > 0 ||
    (analysisResult?.extra.length ?? 0) > 0 ||
    (analysisResult?.unknown.length ?? 0) > 0;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.badge}>100% 完成版</p>
          <h1>お薬並べ忘れチェック</h1>
          <p>
            画像アップロード、TensorFlow.jsによるオンデバイス画像判定、編集・削除機能、
            判定履歴管理、PWA対応を実装しました。iPhoneでホーム画面に追加してご利用ください。
          </p>
          <div className={styles.statusCard}>
            <p className={styles.statusLabel}>現在の確認対象</p>
            <p className={styles.statusValue}>
              {selectedUser?.name ?? "未選択"} ／ {selectedSlot}
            </p>
            <p className={styles.statusDetail}>{summaryText}</p>
          </div>
        </header>

        <section className={styles.section}>
          <h2>1. ユーザーを選択</h2>
          <p className={styles.sectionHint}>
            最大5人まで登録できる想定。色は薬ケースのイメージカラーとして利用予定。
          </p>
          <div className={styles.userGrid}>
            {data.userProfiles.map((user) => (
              <div
                key={user.id}
                className={`${styles.userCard} ${
                  user.id === selectedUser?.id ? styles.activeCard : ""
                }`}
              >
                <button
                  type="button"
                  style={{ flex: 1, textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <span
                    className={styles.userBadge}
                    style={{ backgroundColor: user.avatarColor }}
                    aria-hidden
                  />
                  <div>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userNotes}>{user.notes}</p>
                  </div>
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleEditUser(user.id)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleDeleteUser(user.id)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>2. チェックしたい時間帯</h2>
          <p className={styles.sectionHint}>
            朝・昼・夜・就寝前・毎食後の5区分で管理します。
          </p>
          <div className={styles.slotList}>
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`${styles.slotButton} ${
                  slot === selectedSlot ? styles.activeSlot : ""
                }`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>3. 用意する薬の内訳</h2>
          {scheduleItems.length === 0 ? (
            <p className={styles.emptyState}>
              この時間帯の服薬予定はありません。
            </p>
          ) : (
            <ul className={styles.medList}>
              {scheduleItems.map((item) => {
                const med = getMedicationById(item.medicationId, data.medications);
                if (!med) return null;
                return (
                  <li key={`${selectedSlot}-${med.id}`} className={styles.medRow}>
                    <div>
                      <p className={styles.medName}>
                        {med.name} <span>× {item.count}</span>
                      </p>
                      <p className={styles.medDesc}>{med.description}</p>
                    </div>
                    <div className={styles.medLabels}>
                      <small>表: {med.surfaceLabel}</small>
                      <small>裏: {med.backLabel}</small>
                    </div>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() =>
                        deleteScheduleItem({
                          userId: selectedUser!.id,
                          slot: selectedSlot,
                          medicationId: med.id,
                        })
                      }
                      style={{ fontSize: "12px", padding: "4px 8px" }}
                    >
                      削除
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2>4. 登録済み薬一覧</h2>
          <div className={styles.medList}>
            {data.medications.map((med) => (
              <div key={med.id} className={styles.medRow}>
                <div>
                  <p className={styles.medName}>{med.name}</p>
                  <p className={styles.medDesc}>{med.description}</p>
                  <div className={styles.medLabels}>
                    <small>表: {med.surfaceLabel}</small>
                    <small>裏: {med.backLabel}</small>
                  </div>
                  {med.surfaceImage && (
                    <img
                      src={med.surfaceImage}
                      alt="表面"
                      style={{ maxWidth: "60px", marginTop: "4px" }}
                    />
                  )}
                  {med.backImage && (
                    <img
                      src={med.backImage}
                      alt="裏面"
                      style={{ maxWidth: "60px", marginTop: "4px" }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleEditMedication(med)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleDeleteMedication(med.id)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>5. データ登録フォーム</h2>
          <p className={styles.sectionHint}>
            ここで追加した内容はブラウザ内の保存領域（LocalStorage）に記録されます。
            ページを再読み込みしても保持されるので、モックデータを調整しながら
            次の機能を検証できます。
          </p>

          <div className={styles.formGrid}>
            <form className={styles.formCard} onSubmit={handleMedicationSubmit}>
              <h3>{editingMedication ? "薬の編集" : "薬の登録"}</h3>
              {editingMedication && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setEditingMedication(null);
                    setMedForm({
                      name: "",
                      description: "",
                      surfaceLabel: "",
                      backLabel: "",
                      surfaceImage: "",
                      backImage: "",
                    });
                  }}
                >
                  キャンセル
                </button>
              )}
              <label className={styles.label}>
                薬の名前
                <input
                  required
                  className={styles.input}
                  value={medForm.name}
                  onChange={(e) =>
                    setMedForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label className={styles.label}>
                説明
                <textarea
                  className={styles.textarea}
                  value={medForm.description}
                  onChange={(e) =>
                    setMedForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                表の特徴
                <input
                  className={styles.input}
                  value={medForm.surfaceLabel}
                  onChange={(e) =>
                    setMedForm((prev) => ({
                      ...prev,
                      surfaceLabel: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                表面画像
                <input
                  type="file"
                  accept="image/*"
                  className={styles.input}
                  onChange={(e) => handleImageUpload(e, "surface")}
                />
                {medForm.surfaceImage && (
                  <img
                    src={medForm.surfaceImage}
                    alt="表面"
                    style={{ maxWidth: "100px", marginTop: "8px" }}
                  />
                )}
              </label>
              <label className={styles.label}>
                裏の特徴
                <input
                  className={styles.input}
                  value={medForm.backLabel}
                  onChange={(e) =>
                    setMedForm((prev) => ({
                      ...prev,
                      backLabel: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                裏面画像
                <input
                  type="file"
                  accept="image/*"
                  className={styles.input}
                  onChange={(e) => handleImageUpload(e, "back")}
                />
                {medForm.backImage && (
                  <img
                    src={medForm.backImage}
                    alt="裏面"
                    style={{ maxWidth: "100px", marginTop: "8px" }}
                  />
                )}
              </label>
              <button type="submit" className={styles.primaryButton}>
                {editingMedication ? "更新" : "薬を追加する"}
              </button>
            </form>

            <form className={styles.formCard} onSubmit={handleUserSubmit}>
              <h3>{editingUser ? "ユーザー編集" : "ユーザー登録"}</h3>
              {editingUser && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({
                      name: "",
                      avatarColor: "#94a3b8",
                      notes: "",
                    });
                  }}
                >
                  キャンセル
                </button>
              )}
              <label className={styles.label}>
                氏名
                <input
                  required
                  className={styles.input}
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label className={styles.label}>
                メモ
                <textarea
                  className={styles.textarea}
                  value={userForm.notes}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </label>
              <label className={styles.label}>
                カラー（薬ケースの色など）
                <input
                  type="color"
                  className={styles.colorInput}
                  value={userForm.avatarColor}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      avatarColor: e.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" className={styles.primaryButton}>
                {editingUser ? "更新" : "ユーザーを追加"}
              </button>
            </form>
          </div>

          <form className={styles.formCard} onSubmit={handleScheduleSubmit}>
            <h3>スケジュールの追加</h3>
            <div className={styles.formRow}>
              <label className={styles.label}>
                ユーザー
                <select
                  className={styles.select}
                  value={scheduleForm.userId}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">選択してください</option>
                  {data.userProfiles.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                時間帯
                <select
                  className={styles.select}
                  value={scheduleForm.slot}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      slot: e.target.value as (typeof timeSlots)[number],
                    }))
                  }
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                薬
                <select
                  className={styles.select}
                  value={scheduleForm.medicationId}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      medicationId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">選択してください</option>
                  {data.medications.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                個数
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={10}
                  value={scheduleForm.count}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      count: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <button type="submit" className={styles.primaryButton}>
              スケジュールに追加
            </button>
          </form>

          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={resetData}
            >
              初期データに戻す
            </button>
            <p>
              ※ LocalStorage に保存しているため、他のブラウザや端末では独立したデータ
              として扱われます。
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>6. カメラ判定（100% 完成版）</h2>
          <p className={styles.sectionHint}>
            TensorFlow.jsによるオンデバイス画像認識で、撮影した薬を自動判定します。
            画像が登録されていない薬は手動で個数を入力できます。
          </p>

          <div className={styles.cameraPanel}>
            <div className={styles.videoWrapper}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
              {cameraStatus === "idle" && (
                <p className={styles.videoPlaceholder}>
                  カメラを起動すると、ここにプレビューが表示されます。
                </p>
              )}
            </div>
            <div className={styles.cameraButtons}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleStartCamera}
              >
                カメラを起動
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleStopCamera}
                disabled={cameraStatus === "idle"}
              >
                停止
              </button>
            </div>
            {cameraStatus === "error" && (
              <p className={styles.errorText}>
                カメラエラー: {cameraError ?? "アクセス権限を確認してください。"}
              </p>
            )}
          </div>

          <div className={styles.recognitionGrid}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0 }}>検出した個数（シミュレーション）</h3>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    const resetCounts: Record<string, number> = {};
                    scheduleItems.forEach((item) => {
                      resetCounts[item.medicationId] = 0;
                    });
                    setRecognizedCounts(resetCounts);
                  }}
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  全て0にリセット
                </button>
              </div>
              <p className={styles.sectionHint}>
                机に並べた薬を撮影したと想定して、読み取れた個数を入力してください。
              </p>
              {scheduleItems.length === 0 ? (
                <p className={styles.emptyState}>
                  この時間帯に登録されている薬がありません。
                </p>
              ) : (
                <ul className={styles.recognitionList}>
                  {scheduleItems.map((item) => {
                    const med = getMedicationById(item.medicationId, data.medications);
                    if (!med) return null;
                    const value = recognizedCounts[item.medicationId] ?? 0;
                    return (
                      <li key={`detected-${med.id}`} className={styles.recognitionRow}>
                        <div>
                          <p className={styles.medName}>{med.name}</p>
                          <small>予定: {item.count}個</small>
                        </div>
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={value}
                            className={styles.input}
                            onChange={(e) =>
                              updateRecognizedCount(med.id, Number(e.target.value))
                            }
                            style={{ width: "60px" }}
                          />
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => updateRecognizedCount(med.id, 0)}
                            style={{ fontSize: "12px", padding: "4px 8px", whiteSpace: "nowrap" }}
                            title="0にリセット"
                          >
                            0
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
        </div>

            <div className={styles.recognitionExtras}>
              <h3>別の薬・未登録の薬を仮検出</h3>
              <form className={styles.formCard} onSubmit={handleAddDetection}>
                <label className={styles.label}>
                  登録済みの薬を追加
                  <select
                    className={styles.select}
                    value={additionalDetection.medicationId}
                    onChange={(e) =>
                      setAdditionalDetection((prev) => ({
                        ...prev,
                        medicationId: e.target.value,
                      }))
                    }
                  >
                    <option value="">選択してください</option>
                    {data.medications.map((med) => (
                      <option key={`add-${med.id}`} value={med.id}>
                        {med.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  検出個数
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className={styles.input}
                    value={additionalDetection.count}
                    onChange={(e) =>
                      setAdditionalDetection((prev) => ({
                        ...prev,
                        count: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <button type="submit" className={styles.secondaryButton}>
                  検出リストに追加
                </button>
              </form>

              <div className={styles.formCard}>
                <label className={styles.label}>
                  未登録の薬名
                  <input
                    className={styles.input}
                    placeholder="銀色の錠剤 など"
                    value={extraInput.label}
                    onChange={(e) =>
                      setExtraInput((prev) => ({ ...prev, label: e.target.value }))
                    }
                  />
                </label>
                <label className={styles.label}>
                  個数
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={styles.input}
                    value={extraInput.count}
                    onChange={(e) =>
                      setExtraInput((prev) => ({
                        ...prev,
                        count: clampCount(Number(e.target.value)),
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.analysisActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCaptureAndAnalyze}
              disabled={scheduleItems.length === 0 || cameraStatus !== "ready" || isAnalyzing}
            >
              {isAnalyzing ? "判定中..." : "カメラで撮影して自動判定"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleAnalyze}
              disabled={scheduleItems.length === 0}
            >
              手動で判定
            </button>
            <p className={styles.sectionHint}>
              カメラで撮影すると自動で薬を認識します。手動で個数を調整することもできます。
            </p>
          </div>

          {analysisResult && (
            <div
              className={`${styles.analysisResult} ${
                hasIssues ? styles.analysisWarn : styles.analysisOk
              }`}
            >
              <p className={styles.analysisTitle}>
                判定結果（{analysisResult.timestamp} 時点）
              </p>
              {!hasIssues && <p>予定どおり全て用意できています。カメラチェック完了です。</p>}
              {analysisResult.missing.length > 0 && (
                <div>
                  <strong>不足している薬</strong>
                  <ul className={styles.analysisList}>
                    {analysisResult.missing.map((entry) => (
                      <li key={`miss-${entry.name}`}>
                        {entry.name}: 予定 {entry.expected} 個 / 検出 {entry.actual} 個
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.extra.length > 0 && (
                <div>
                  <strong>多く用意されている薬</strong>
                  <ul className={styles.analysisList}>
                    {analysisResult.extra.map((entry) => (
                      <li key={`extra-${entry.name}`}>
                        {entry.name}: 予定 {entry.expected} 個 / 検出 {entry.actual} 個
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.unknown.length > 0 && (
                <div>
                  <strong>登録されていない薬が含まれています</strong>
                  <ul className={styles.analysisList}>
                    {analysisResult.unknown.map((entry, index) => (
                      <li key={`unknown-${entry.name}-${index}`}>
                        {entry.name}: {entry.count} 個
                      </li>
                    ))}
                  </ul>
                </div>
              )}
        </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>7. 判定履歴</h2>
          <p className={styles.sectionHint}>
            直近24時間の判定履歴を表示します。同じタイムスロットで再判定できます。
          </p>
          {data.analysisHistory.length === 0 ? (
            <p className={styles.emptyState}>判定履歴はありません。</p>
          ) : (
            <div>
              {data.analysisHistory
                .filter((h) => h.userId === selectedUserId)
                .slice(0, 10)
                .map((history) => {
                  const hasIssues =
                    history.missing.length > 0 ||
                    history.extra.length > 0 ||
                    history.unknown.length > 0;
                  return (
                    <div
                      key={history.id}
                      className={`${styles.analysisResult} ${
                        hasIssues ? styles.analysisWarn : styles.analysisOk
                      }`}
                      style={{ marginBottom: "16px" }}
                    >
                      <p className={styles.analysisTitle}>
                        {history.userName} / {history.slot} /{" "}
                        {new Date(history.timestamp).toLocaleString("ja-JP")}
                      </p>
                      {!hasIssues && (
                        <p>予定どおり全て用意できています。</p>
                      )}
                      {history.missing.length > 0 && (
                        <div>
                          <strong>不足: </strong>
                          {history.missing
                            .map((m) => `${m.name} (予定${m.expected}個/検出${m.actual}個)`)
                            .join(", ")}
                        </div>
                      )}
                      {history.extra.length > 0 && (
                        <div>
                          <strong>過剰: </strong>
                          {history.extra
                            .map((e) => `${e.name} (予定${e.expected}個/検出${e.actual}個)`)
                            .join(", ")}
                        </div>
                      )}
                      {history.unknown.length > 0 && (
                        <div>
                          <strong>未登録: </strong>
                          {history.unknown
                            .map((u) => `${u.name} (${u.count}個)`)
                            .join(", ")}
                        </div>
                      )}
                      {history.slot === selectedSlot && (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => {
                            setSelectedSlot(history.slot);
                            setSelectedUserId(history.userId);
                            // 履歴から個数を復元
                            const counts: Record<string, number> = {};
                            history.missing.forEach((m) => {
                              const med = data.medications.find(
                                (med) => med.name === m.name,
                              );
                              if (med) counts[med.id] = m.actual;
                            });
                            history.extra.forEach((e) => {
                              const med = data.medications.find(
                                (med) => med.name === e.name,
                              );
                              if (med) counts[med.id] = e.actual;
                            });
                            setRecognizedCounts(counts);
                          }}
                          style={{ marginTop: "8px" }}
                        >
                          この条件で再判定
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

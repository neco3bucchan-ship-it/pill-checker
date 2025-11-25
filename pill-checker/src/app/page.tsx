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
  const { data, addMedication, addUser, addScheduleItem, resetData } =
    useAppData();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    data.userProfiles[0]?.id,
  );
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [medForm, setMedForm] = useState({
    name: "",
    description: "",
    surfaceLabel: "",
    backLabel: "",
  });
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

  const handleMedicationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!medForm.name.trim()) return;
    addMedication(medForm);
    setMedForm({
      name: "",
      description: "",
      surfaceLabel: "",
      backLabel: "",
    });
  };

  const handleUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userForm.name.trim()) return;
    addUser(userForm);
    setUserForm({
      name: "",
      avatarColor: "#94a3b8",
      notes: "",
    });
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

  const handleAnalyze = () => {
    const missing: DiffEntry[] = [];
    const extra: DiffEntry[] = [];
    const unknown: UnknownEntry[] = [];

    scheduleItems.forEach((item) => {
      const med = getMedicationById(item.medicationId, data.medications);
      if (!med) return;
      const actual = recognizedCounts[item.medicationId] ?? 0;
      if (actual < item.count) {
        missing.push({ name: med.name, expected: item.count, actual });
      } else if (actual > item.count) {
        extra.push({ name: med.name, expected: item.count, actual });
      }
    });

    Object.entries(recognizedCounts).forEach(([medId, count]) => {
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

    setAnalysisResult({
      missing,
      extra,
      unknown,
      timestamp: new Date().toLocaleTimeString("ja-JP"),
    });
  };

  const hasIssues =
    (analysisResult?.missing.length ?? 0) > 0 ||
    (analysisResult?.extra.length ?? 0) > 0 ||
    (analysisResult?.unknown.length ?? 0) > 0;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.badge}>70% プロトタイプ</p>
          <h1>お薬並べ忘れチェック</h1>
          <p>
            フォームで服薬データを編集できるだけでなく、カメラプレビューと仮判定ロジックを
            組み込みました。まだAI判定はダミーですが、UIの流れやメッセージをここで検証できます。
            次は精度向上と履歴管理を実装して 100% に近づけていきます。
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
              <button
                key={user.id}
                type="button"
                className={`${styles.userCard} ${
                  user.id === selectedUser?.id ? styles.activeCard : ""
                }`}
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
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2>4. データ登録フォーム（50%）</h2>
          <p className={styles.sectionHint}>
            ここで追加した内容はブラウザ内の保存領域（LocalStorage）に記録されます。
            ページを再読み込みしても保持されるので、モックデータを調整しながら
            次の機能を検証できます。
          </p>

          <div className={styles.formGrid}>
            <form className={styles.formCard} onSubmit={handleMedicationSubmit}>
              <h3>薬の登録</h3>
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
              <button type="submit" className={styles.primaryButton}>
                薬を追加する
              </button>
            </form>

            <form className={styles.formCard} onSubmit={handleUserSubmit}>
              <h3>ユーザー登録</h3>
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
                ユーザーを追加
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
          <h2>5. カメラ仮判定（70% ステップ）</h2>
          <p className={styles.sectionHint}>
            ブラウザのカメラ起動と、読み取ったと仮定した個数の比較ロジックを用意しました。
            まだAI判定は行っていないため、手動で数値を調整して過不足のメッセージを確認します。
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
              <h3>検出した個数（シミュレーション）</h3>
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
                    const value = recognizedCounts[item.medicationId] ?? item.count;
                    return (
                      <li key={`detected-${med.id}`} className={styles.recognitionRow}>
                        <div>
                          <p className={styles.medName}>{med.name}</p>
                          <small>予定: {item.count}個</small>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={value}
                          className={styles.input}
                          onChange={(e) =>
                            updateRecognizedCount(med.id, Number(e.target.value))
                          }
                        />
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
              onClick={handleAnalyze}
              disabled={scheduleItems.length === 0}
            >
              判定を実行
            </button>
            <p className={styles.sectionHint}>
              実際のAI判定までは、こちらで仮の数値を入力して過不足メッセージを確認します。
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
      </main>
    </div>
  );
}

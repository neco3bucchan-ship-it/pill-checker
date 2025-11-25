"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getMedicationById,
  timeSlots,
  type Medication,
  type ScheduleItem,
  type TimeSlot,
} from "@/data/sample";
import { useAppData } from "@/hooks/useAppData";
import styles from "./page.module.css";

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

  const selectedUser = useMemo(
    () => data.userProfiles.find((user) => user.id === selectedUserId),
    [data.userProfiles, selectedUserId],
  );

  const scheduleItems = selectedUser?.routines[selectedSlot] ?? [];
  const summaryText = buildChecklist(scheduleItems, data.medications);

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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.badge}>50% 進行中</p>
          <h1>お薬並べ忘れチェック</h1>
          <p>
            服薬データを画面から登録・編集できるようになりました。LocalStorage に
            保存されるため、ブラウザを閉じても内容が残ります。ここまでで「30%→50%」
            の進捗に到達です。次のステップではカメラ判定や履歴などを拡張予定です。
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
      </main>
    </div>
  );
}

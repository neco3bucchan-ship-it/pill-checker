"use client";

import { useMemo, useState } from "react";
import {
  getMedicationById,
  timeSlots,
  userProfiles,
  type ScheduleItem,
} from "@/data/sample";
import styles from "./page.module.css";

const getChecklist = (items: ScheduleItem[]) => {
  if (!items.length) {
    return "この時間帯に予定されている薬はありません。";
  }

  const lines = items.map((item) => {
    const med = getMedicationById(item.medicationId);
    if (!med) return "";
    return `${med.name} を ${item.count} 個`;
  });

  return `準備する薬: ${lines.join(" / ")}`;
};

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState(userProfiles[0]?.id);
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);

  const selectedUser = useMemo(
    () => userProfiles.find((user) => user.id === selectedUserId),
    [selectedUserId],
  );

  const scheduleItems = selectedUser?.routines[selectedSlot] ?? [];
  const summaryText = getChecklist(scheduleItems);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.badge}>30% プロトタイプ</p>
          <h1>お薬並べ忘れチェック</h1>
          <p>
            まずは登録済みデータを使って、「誰が」「どの時間帯に」「どの薬を何個」で
            服薬するかを確認できる土台を用意しました。表示が整えば、次のステップで
            カメラ判定や編集フォームを追加できます。
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
            {userProfiles.map((user) => (
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
                const med = getMedicationById(item.medicationId);
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
          <h2>4. 次の作業メモ</h2>
          <ul className={styles.todoList}>
            <li>フォーム入力で薬やユーザーを追加できるようにする</li>
            <li>カメラ起動ボタンと判定結果画面を差し込み</li>
            <li>IndexedDB に保存して再読み込みしても残るようにする</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

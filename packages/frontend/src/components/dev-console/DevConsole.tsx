"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import styles from "./DevConsole.module.css";
import { devConsoleStore, type ApiLogEntry, type ApiLogStatusFilter } from "@/lib/debug/dev-console-store";
import { formatDuration } from "@/lib/logging/utils";

const useDevConsoleState = () =>
  useSyncExternalStore(devConsoleStore.subscribe, devConsoleStore.getState, devConsoleStore.getState);

const filterEntries = (entries: ApiLogEntry[], filter: ApiLogStatusFilter) => {
  if (filter === "all") return entries;
  if (filter === "success") return entries.filter((entry) => entry.ok);
  return entries.filter((entry) => entry.ok === false);
};

export default function DevConsole() {
  const { entries, isOpen, filter } = useDevConsoleState();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const visibleEntries = useMemo(() => filterEntries(entries, filter), [entries, filter]);

  const toggleEntry = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggle = () => devConsoleStore.toggleOpen();
  const handleClear = () => devConsoleStore.clear();
  const handleFilterChange = (nextFilter: ApiLogStatusFilter) => devConsoleStore.setFilter(nextFilter);

  if (!isOpen) {
    return (
      <button className={styles.toggleButton} onClick={handleToggle}>
        Dev Console
      </button>
    );
  }

  return (
    <div className={styles.devConsole}>
      <div className={styles.header}>
        <div className={styles.title}>Dev Console</div>
        <div className={styles.actions}>
          <button className={styles.button} onClick={handleClear}>
            Clear
          </button>
          <button
            className={`${styles.button} ${filter === "all" ? styles.buttonActive : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            All
          </button>
          <button
            className={`${styles.button} ${filter === "success" ? styles.buttonActive : ""}`}
            onClick={() => handleFilterChange("success")}
          >
            Success
          </button>
          <button
            className={`${styles.button} ${filter === "error" ? styles.buttonActive : ""}`}
            onClick={() => handleFilterChange("error")}
          >
            Errors
          </button>
          <button className={styles.button} onClick={handleToggle}>
            Close
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {visibleEntries.length === 0 && <div>No API calls yet.</div>}

        {visibleEntries.map((entry) => {
          const isExpanded = expanded[entry.id];
          const statusClass = entry.ok ? styles.success : styles.error;

          return (
            <div key={entry.id} className={styles.entry} onClick={() => toggleEntry(entry.id)}>
              <div className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  <span className={statusClass}>{entry.method}</span>
                  <span>{entry.status ?? "-"}</span>
                  <span>{formatDuration(entry.durationMs)}</span>
                </div>
                <span className={entry.ok ? styles.success : styles.error}>
                  {entry.ok ? "OK" : "ERROR"}
                </span>
              </div>
              <div className={styles.url}>{entry.url}</div>
              {isExpanded && (
                <div className={styles.details}>
                  {entry.requestBody && (
                    <div>
                      <strong>Request:</strong> {entry.requestBody}
                    </div>
                  )}
                  {entry.responseBody && (
                    <div>
                      <strong>Response:</strong> {entry.responseBody}
                    </div>
                  )}
                  {entry.error && (
                    <div className={styles.error}>
                      <strong>Error:</strong> {entry.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

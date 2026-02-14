import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Simple Exam Web App (single-file starter)
 * - Sheet management (create/select/duplicate/export/import)
 * - Exam mode: user inputs answers; each submission appends a new row automatically
 * - Per-row input type toggle: input vs textarea
 * - Grading mode: left = user's answer, right = correct answer; mismatch highlights
 * - Persistence via IndexedDB (minimal wrapper)
 *
 * UX improvements in this version:
 * - Enter-to-submit (draft input) and Enter-to-next-field navigation for input fields
 * - Ctrl/Cmd+Enter for textarea submit / next-field (Enter keeps newline)
 * - More consistent, calmer color system + focus rings + cursor-pointer
 * - Better mobile / tall (9:21) ergonomics: sticky header + sticky bottom input bar
 */

// ------------------------------
// Types
// ------------------------------

type InputKind = "input" | "textarea";

type QA = {
  id: string;
  createdAt: number;
  prompt?: string;
  userAnswer: string;
  correctAnswer: string;
  inputKind: InputKind;
};

type Sheet = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  items: QA[];
};

type DBState = {
  version: 1;
  activeSheetId: string | null;
  sheets: Sheet[];
};

// ------------------------------
// Utils
// ------------------------------

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}_${Date.now()}`);

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatKST = (ts: number) => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const now = () => Date.now();

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

// ------------------------------
// IndexedDB minimal wrapper
// ------------------------------

const DB_NAME = "exam_app_db";
const DB_VERSION = 1;
const STORE = "state";
const STATE_KEY = "root";

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetState(): Promise<DBState | null> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const st = tx.objectStore(STORE);
    const req = st.get(STATE_KEY);
    req.onsuccess = () => resolve((req.result as DBState) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSetState(state: DBState): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    const req = st.put(state, STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ------------------------------
// Default state
// ------------------------------

function makeEmptySheet(name: string): Sheet {
  const t = now();
  return { id: uid(), name, createdAt: t, updatedAt: t, items: [] };
}

function makeInitialState(): DBState {
  const sheet = makeEmptySheet("내 첫 시험지");
  return { version: 1, activeSheetId: sheet.id, sheets: [sheet] };
}

// ------------------------------
// UI Components
// ------------------------------

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cx(
        "relative inline-flex h-8 w-14 items-center rounded-full border transition",
        "cursor-pointer select-none",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        value ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
      )}
      aria-pressed={value}
    >
      <span
        className={cx(
          "inline-block h-6 w-6 transform rounded-full shadow transition",
          value ? "translate-x-7 bg-white" : "translate-x-1 bg-slate-900"
        )}
      />
      <span className="sr-only">toggle</span>
    </button>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "ghost",
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm shadow-sm transition cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50";
  const style =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : variant === "danger"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
  return (
    <button type="button" className={cx(base, style, className)} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

function SegButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-lg border px-2 py-1 text-xs transition cursor-pointer select-none",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function TextField({
  kind,
  value,
  onChange,
  placeholder,
  onKeyDown,
  inputRef,
}: {
  kind: InputKind;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
}) {
  const common =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
  if (kind === "input") {
    return (
      <input
        ref={inputRef as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown as any}
        className={common}
        placeholder={placeholder}
      />
    );
  }
  return (
    <textarea
      ref={inputRef as any}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown as any}
      className={cx(common, "min-h-[96px] resize-y")}
      placeholder={placeholder}
    />
  );
}

// ------------------------------
// Main App
// ------------------------------

export default function App() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<DBState>(() => makeInitialState());

  const [mode, setMode] = useState<"exam" | "grading">("exam");
  const [newSheetName, setNewSheetName] = useState("");

  // current entry buffer (exam mode)
  const [draftUser, setDraftUser] = useState("");
  const [draftKind, setDraftKind] = useState<InputKind>("input");

  // import/export
  const fileRef = useRef<HTMLInputElement | null>(null);

  // focus refs
  const draftRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const userRefs = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());
  const correctRefs = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());

  const activeSheet = useMemo(() => {
    return state.sheets.find((s) => s.id === state.activeSheetId) ?? null;
  }, [state]);

  // load
  useEffect(() => {
    (async () => {
      try {
        const saved = await idbGetState();
        if (saved) {
          setState(saved);
        } else {
          const init = makeInitialState();
          setState(init);
          await idbSetState(init);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // persist (debounced-ish)
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      idbSetState(state).catch(() => {
        /* ignore */
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [state, ready]);

  function selectSheet(id: string) {
    setState((prev) => ({ ...prev, activeSheetId: id }));
    setMode("exam");
    setDraftUser("");
    setDraftKind("input");
    // focus after paint
    setTimeout(() => draftRef.current?.focus(), 0);
  }

  function createSheet() {
    const name = newSheetName.trim();
    if (!name) return;
    const sheet = makeEmptySheet(name);
    setState((prev) => ({
      ...prev,
      activeSheetId: sheet.id,
      sheets: [sheet, ...prev.sheets],
    }));
    setNewSheetName("");
    setMode("exam");
    setTimeout(() => draftRef.current?.focus(), 0);
  }

  function duplicateSheet(sheetId: string) {
    const src = state.sheets.find((s) => s.id === sheetId);
    if (!src) return;
    const t = now();
    const copy: Sheet = {
      ...src,
      id: uid(),
      name: `${src.name} — 복사본 (${formatKST(t)})`,
      createdAt: t,
      updatedAt: t,
      // keep correct answers; reset user answers
      items: src.items.map((it) => ({
        ...it,
        id: uid(),
        createdAt: t,
        userAnswer: "",
      })),
    };
    setState((prev) => ({
      ...prev,
      activeSheetId: copy.id,
      sheets: [copy, ...prev.sheets],
    }));
    setMode("exam");
    setTimeout(() => draftRef.current?.focus(), 0);
  }

  function deleteSheet(sheetId: string) {
    setState((prev) => {
      const sheets = prev.sheets.filter((s) => s.id !== sheetId);
      const active =
        prev.activeSheetId === sheetId
          ? sheets[0]?.id ?? null
          : prev.activeSheetId;
      return { ...prev, sheets, activeSheetId: active };
    });
  }

  function upsertActiveSheet(updater: (s: Sheet) => Sheet) {
    setState((prev) => {
      const idx = prev.sheets.findIndex((s) => s.id === prev.activeSheetId);
      if (idx < 0) return prev;
      const nextSheets = [...prev.sheets];
      const updated = updater({ ...nextSheets[idx] });
      updated.updatedAt = now();
      nextSheets[idx] = updated;
      return { ...prev, sheets: nextSheets };
    });
  }

  function appendAnswer() {
    if (!activeSheet) return;
    const answer = draftUser;
    if (!answer.trim()) return;

    upsertActiveSheet((s) => {
      const item: QA = {
        id: uid(),
        createdAt: now(),
        userAnswer: answer,
        correctAnswer: "",
        inputKind: draftKind,
      };
      return { ...s, items: [...s.items, item] };
    });

    setDraftUser("");
    // keep kind as-is
    // keep focus
    setTimeout(() => draftRef.current?.focus(), 0);
  }

  function setItemKind(itemId: string, kind: InputKind) {
    upsertActiveSheet((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === itemId ? { ...it, inputKind: kind } : it)),
    }));
  }

  function setUserAnswer(itemId: string, v: string) {
    upsertActiveSheet((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === itemId ? { ...it, userAnswer: v } : it)),
    }));
  }

  function setCorrectAnswer(itemId: string, v: string) {
    upsertActiveSheet((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === itemId ? { ...it, correctAnswer: v } : it)),
    }));
  }

  function removeItem(itemId: string) {
    upsertActiveSheet((s) => ({ ...s, items: s.items.filter((it) => it.id !== itemId) }));
  }

  function exportJSON() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam_app_export_${formatKST(now()).replace(/[: ]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    fileRef.current?.click();
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DBState;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.sheets)) {
        throw new Error("invalid");
      }
      const normalized: DBState = {
        version: 1,
        activeSheetId: parsed.activeSheetId ?? parsed.sheets[0]?.id ?? null,
        sheets: parsed.sheets.map((s) => ({
          id: s.id || uid(),
          name: s.name || "(이름 없음)",
          createdAt: s.createdAt || now(),
          updatedAt: s.updatedAt || now(),
          items: (s.items || []).map((it: any) => ({
            id: it.id || uid(),
            createdAt: it.createdAt || now(),
            prompt: it.prompt,
            userAnswer: String(it.userAnswer ?? ""),
            correctAnswer: String(it.correctAnswer ?? ""),
            inputKind: it.inputKind === "textarea" ? "textarea" : "input",
          })),
        })),
      };
      setState(normalized);
      await idbSetState(normalized);
      setTimeout(() => draftRef.current?.focus(), 0);
    } catch {
      alert("JSON 가져오기에 실패했어요. 파일 형식을 확인해 주세요.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const stats = useMemo(() => {
    if (!activeSheet) return { total: 0, mismatched: 0 };
    const total = activeSheet.items.length;
    const mismatched = activeSheet.items.filter(
      (it) => it.correctAnswer.trim() !== "" && it.userAnswer.trim() !== it.correctAnswer.trim()
    ).length;
    return { total, mismatched };
  }, [activeSheet]);

  const canSubmit = draftUser.trim().length > 0;

  function focusEl(el: HTMLElement | null | undefined) {
    if (!el) return;
    el.focus();
    // place caret at end (inputs / textarea)
    try {
      const anyEl = el as any;
      if (typeof anyEl.selectionStart === "number") {
        const len = (anyEl.value as string)?.length ?? 0;
        anyEl.setSelectionRange(len, len);
      }
    } catch {
      // ignore
    }
  }

  function focusNextFromItem(itemId: string, field: "user" | "correct") {
    if (!activeSheet) return;
    const ids = activeSheet.items.map((x) => x.id);
    const idx = ids.indexOf(itemId);
    if (idx < 0) return;

    // Navigation policy:
    // - Exam mode: Enter on a row's user input => next row's user input; if last, go to draft
    // - Grading mode: Enter on user => same row correct; Enter on correct => next row user; if last correct => draft

    if (mode === "exam") {
      const nextId = ids[idx + 1];
      if (nextId) {
        focusEl(userRefs.current.get(nextId) ?? null);
      } else {
        focusEl(draftRef.current);
      }
      return;
    }

    if (field === "user") {
      focusEl(correctRefs.current.get(itemId) ?? null);
      return;
    }

    const nextId = ids[idx + 1];
    if (nextId) {
      focusEl(userRefs.current.get(nextId) ?? null);
    } else {
      focusEl(draftRef.current);
    }
  }

  function handleEnterNav(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    opts: { kind: InputKind; itemId?: string; field?: "user" | "correct"; isDraft?: boolean }
  ) {
    const isTextarea = opts.kind === "textarea";
    const wantsSubmitOrMove = isTextarea ? (e.ctrlKey || e.metaKey) : e.key === "Enter";

    if (e.key !== "Enter") return;

    if (isTextarea) {
      // Enter = newline, Ctrl/Cmd+Enter = submit/next
      if (!wantsSubmitOrMove) return;
      e.preventDefault();
    } else {
      // input: Enter moves/submit
      e.preventDefault();
    }

    if (opts.isDraft) {
      // draft: submit
      appendAnswer();
      return;
    }

    if (opts.itemId && opts.field) {
      focusNextFromItem(opts.itemId, opts.field);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-[100svh] bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-slate-700">로딩 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-slate-50">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col">
        {/* Sticky header for tall screens */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
          <details className="p-4 md:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <summary className="space-y-1">
                  <h1 className="text-xl font-semibold text-slate-900">간단한 시험 웹앱</h1>
                  <p className="text-sm text-slate-600">
                    시험지 선택 → 시험모드 입력 → 채점모드에서 정답 입력/비교 (IndexedDB 저장)
                  </p>
                </summary>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip>Sheets: {state.sheets.length}</Chip>
                  <Chip>Items: {stats.total}</Chip>
                  {mode === "grading" && <Chip>Mismatch: {stats.mismatched}</Chip>}
                  <Btn onClick={exportJSON}>JSON 추출</Btn>
                  <Btn onClick={triggerImport}>JSON 가져오기</Btn>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {/* sheet toolbar */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createSheet();
                        }
                      }}
                      placeholder="새 시험지 이름 입력"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <Btn variant="primary" onClick={createSheet} disabled={!newSheetName.trim()}>
                      만들기
                    </Btn>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    시험지 복사: <span className="font-medium text-slate-800">정답 유지</span> + 사용자 답안 초기화 +
                    복사 시각 부제목
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">모드</span>
                    <div className="flex items-center gap-2">
                      <span className={cx("text-xs", mode === "exam" ? "font-semibold text-slate-900" : "text-slate-500")}>
                        시험
                      </span>
                      <Toggle value={mode === "grading"} onChange={(v) => setMode(v ? "grading" : "exam")} />
                      <span
                        className={cx(
                          "text-xs",
                          mode === "grading" ? "font-semibold text-slate-900" : "text-slate-500"
                        )}
                      >
                        채점
                      </span>
                    </div>
                  </div>
                  {activeSheet ? (
                    <div className="text-xs text-slate-600">
                      선택됨: <span className="font-medium text-slate-900">{activeSheet.name}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600">시험지를 만들어 주세요.</div>
                  )}
                </div>
              </div>

              {/* quick hint */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <Chip>input: Enter → 다음/제출</Chip>
                <Chip>textarea: Ctrl/Cmd+Enter → 다음/제출</Chip>
                <Chip>9:21 대응: 하단 입력 바 고정</Chip>
              </div>
            </div>
          </details>
        </header>

        {/* body */}
        <div className="flex-1 px-4 pb-28 md:px-6 md:pb-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: sheet list (mobile-friendly) */}
            <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-[172px] lg:h-[calc(100svh-220px)] lg:overflow-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">시험지 목록</h2>
                <Chip>{state.sheets.length}</Chip>
              </div>

              <div className="space-y-2">
                {state.sheets.map((s) => {
                  const isActive = s.id === state.activeSheetId;
                  return (
                    <div
                      key={s.id}
                      className={cx(
                        "rounded-xl border p-3 transition",
                        isActive
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <button
                        className="w-full cursor-pointer text-left"
                        onClick={() => selectSheet(s.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">{s.name}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                              <span>문항: {s.items.length}</span>
                              <span>수정: {formatKST(s.updatedAt)}</span>
                            </div>
                          </div>
                          {isActive && <Chip>선택</Chip>}
                        </div>
                      </button>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn className="!rounded-lg !px-2 !py-1 !text-xs" onClick={() => duplicateSheet(s.id)}>
                          복사
                        </Btn>
                        <Btn
                          className="!rounded-lg !px-2 !py-1 !text-xs"
                          variant="danger"
                          onClick={() => deleteSheet(s.id)}
                          disabled={state.sheets.length <= 1}
                          title={state.sheets.length <= 1 ? "최소 1개 시험지는 남겨야 해요" : ""}
                        >
                          삭제
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Right: main */}
            <main className="lg:col-span-2">
              {!activeSheet ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
                  시험지를 먼저 선택하거나 생성해 주세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Items list */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">문항 목록</h3>
                        <p className="text-xs text-slate-600">
                          {mode === "exam"
                            ? "문항 input에서 Enter → 다음 문항으로 이동 (마지막이면 하단 입력으로)"
                            : "채점: 내 답(Enter→정답) / 정답(Enter→다음 내 답)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip>{activeSheet.items.length}</Chip>
                        <Btn
                          className="!rounded-lg !px-2 !py-1 !text-xs"
                          onClick={() => {
                            if (confirm("이 시험지의 내 답안을 모두 비울까요?")) {
                              upsertActiveSheet((s) => ({
                                ...s,
                                items: s.items.map((it) => ({ ...it, userAnswer: "" })),
                              }));
                              setTimeout(() => draftRef.current?.focus(), 0);
                            }
                          }}
                        >
                          내 답안 초기화
                        </Btn>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {activeSheet.items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
                          아직 문항이 없어요. 아래 입력 바에서 답을 입력해 추가해 보세요.
                        </div>
                      ) : (
                        activeSheet.items.map((it, idx) => {
                          const mismatch =
                            mode === "grading" &&
                            it.correctAnswer.trim() !== "" &&
                            it.userAnswer.trim() !== it.correctAnswer.trim();

                          const panelCls = mismatch
                            ? "border-rose-200 bg-rose-50"
                            : "border-slate-200 bg-white";

                          return (
                            <div key={it.id} className="rounded-2xl border border-slate-200 p-3">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                  <Chip>#{idx + 1}</Chip>
                                  <span className="text-xs text-slate-600">{formatKST(it.createdAt)}</span>
                                  {mismatch && <Chip>불일치</Chip>}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-slate-600">입력</span>
                                  <SegButton active={it.inputKind === "input"} onClick={() => setItemKind(it.id, "input")}>
                                    input
                                  </SegButton>
                                  <SegButton
                                    active={it.inputKind === "textarea"}
                                    onClick={() => setItemKind(it.id, "textarea")}
                                  >
                                    textarea
                                  </SegButton>
                                  <Btn
                                    className="!rounded-lg !px-2 !py-1 !text-xs"
                                    variant="danger"
                                    onClick={() => removeItem(it.id)}
                                  >
                                    삭제
                                  </Btn>
                                </div>
                              </div>

                              {mode === "exam" ? (
                                <div className="mt-3">
                                  <TextField
                                    kind={it.inputKind}
                                    value={it.userAnswer}
                                    onChange={(v) => setUserAnswer(it.id, v)}
                                    placeholder="내 답"
                                    inputRef={(el) => {
                                      if (!el) userRefs.current.delete(it.id);
                                      else userRefs.current.set(it.id, el as any);
                                    }}
                                    onKeyDown={(e) =>
                                      handleEnterNav(e, {
                                        kind: it.inputKind,
                                        itemId: it.id,
                                        field: "user",
                                      })
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <div className={cx("rounded-xl border p-3", panelCls)}>
                                    <div className="mb-2 text-xs font-medium text-slate-700">내가 입력한 답</div>
                                    <TextField
                                      kind={it.inputKind}
                                      value={it.userAnswer}
                                      onChange={(v) => setUserAnswer(it.id, v)}
                                      inputRef={(el) => {
                                        if (!el) userRefs.current.delete(it.id);
                                        else userRefs.current.set(it.id, el as any);
                                      }}
                                      onKeyDown={(e) =>
                                        handleEnterNav(e, {
                                          kind: it.inputKind,
                                          itemId: it.id,
                                          field: "user",
                                        })
                                      }
                                    />
                                  </div>
                                  <div className={cx("rounded-xl border p-3", panelCls)}>
                                    <div className="mb-2 text-xs font-medium text-slate-700">실제 정답</div>
                                    <TextField
                                      kind={it.inputKind}
                                      value={it.correctAnswer}
                                      onChange={(v) => setCorrectAnswer(it.id, v)}
                                      placeholder="정답 입력"
                                      inputRef={(el) => {
                                        if (!el) correctRefs.current.delete(it.id);
                                        else correctRefs.current.set(it.id, el as any);
                                      }}
                                      onKeyDown={(e) =>
                                        handleEnterNav(e, {
                                          kind: it.inputKind,
                                          itemId: it.id,
                                          field: "correct",
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
                    <div className="font-medium text-slate-800">구현된 UX</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>input: Enter → 다음 필드/다음 문항/제출</li>
                      <li>textarea: Enter는 줄바꿈, Ctrl/Cmd+Enter → 다음/제출</li>
                      <li>헤더 고정 + 하단 입력 바 고정 (세로 긴 화면에서 편안)</li>
                      <li>버튼/클릭 요소 cursor-pointer + focus ring</li>
                    </ul>
                  </section>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Sticky bottom input bar (great for 9:21) */}
        {activeSheet && mode === "exam" && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto max-w-6xl p-3 md:px-6">
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-start">
                <div className="flex w-full items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">시험모드 입력</div>
                    <div className="text-xs text-slate-600">
                      input은 Enter 제출 · textarea는 Ctrl/Cmd+Enter 제출
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">입력 형태</span>
                    <SegButton active={draftKind === "input"} onClick={() => setDraftKind("input")}>
                      input
                    </SegButton>
                    <SegButton active={draftKind === "textarea"} onClick={() => setDraftKind("textarea")}>
                      textarea
                    </SegButton>
                  </div>
                </div>

                <div className="w-full md:flex md:items-start md:gap-2">
                  <div className="w-full">
                    <TextField
                      kind={draftKind}
                      value={draftUser}
                      onChange={setDraftUser}
                      placeholder="정답(내가 입력)"
                      inputRef={(el) => {
                        draftRef.current = el as any;
                      }}
                      onKeyDown={(e) =>
                        handleEnterNav(e, {
                          kind: draftKind,
                          isDraft: true,
                        })
                      }
                    />
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Btn variant="primary" onClick={appendAnswer} disabled={!canSubmit} className="h-10 w-full md:w-auto">
                      추가
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

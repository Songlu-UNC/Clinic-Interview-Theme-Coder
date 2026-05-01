import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_THEMES = [
  "Cognitive Load",
  "Duplication",
  "Navigation Burden",
  "Documentation Time",
  "Information Fragmentation",
  "Workflow Interruption",
];

const SAMPLE_TRANSCRIPT =
  "Paste an interview transcript here, or upload a .txt file.\n\nExample:\nClinician: I often have to open multiple tabs to understand one patient story. The information is technically there, but it is scattered.\nInterviewer: How does that affect your workflow?\nClinician: It slows me down and increases documentation time because I keep re-entering details in different places.";

const ICON_PATHS = {
  upload: "M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  download: "M12 4v12m0 0 4-4m-4 4-4-4M4 20h16",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3",
  tag: "M20 12l-8 8-8-8V4h8l8 8ZM8 8h.01",
  chart: "M5 19V9m7 10V5m7 14v-7",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6",
  clipboard: "M9 4h6M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 12h6M9 16h6",
  search: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function escapeCsvValue(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows) {
  const header = ["Theme", "Quote", "Memo", "Created At"];
  const body = rows.map((row) => [row.theme, row.quote, row.memo, row.createdAt].map(escapeCsvValue).join(","));
  return [header.join(","), ...body].join("\n");
}

export function cleanSelection(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `code-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function downloadCsv(rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "coded_interview_excerpts.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function runUtilityTests() {
  const tests = [
    {
      name: "cleanSelection collapses whitespace",
      actual: cleanSelection("  quote\nwith   spaces  "),
      expected: "quote with spaces",
    },
    {
      name: "escapeCsvValue quotes commas",
      actual: escapeCsvValue("A, B"),
      expected: '"A, B"',
    },
    {
      name: "escapeCsvValue escapes double quotes",
      actual: escapeCsvValue('The clinician said "slow"'),
      expected: '"The clinician said ""slow"""',
    },
    {
      name: "buildCsv includes header and row",
      actual: buildCsv([{ theme: "Cognitive Load", quote: "Many tabs", memo: "Navigation issue", createdAt: "Today" }]),
      expected: "Theme,Quote,Memo,Created At\nCognitive Load,Many tabs,Navigation issue,Today",
    },
  ];

  tests.forEach((test) => {
    console.assert(test.actual === test.expected, `${test.name}: expected ${test.expected}, received ${test.actual}`);
  });
}

export default function ClinicalInterviewThemeCoder() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEMES[0]);
  const [newTheme, setNewTheme] = useState("");
  const [memo, setMemo] = useState("");
  const [codes, setCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    runUtilityTests();
  }, []);

  const themeCounts = useMemo(() => {
    return themes.map((theme) => ({
      theme,
      count: codes.filter((code) => code.theme === theme).length,
    }));
  }, [themes, codes]);

  const maxCount = Math.max(1, ...themeCounts.map((item) => item.count));

  const filteredCodes = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return codes;
    return codes.filter(
      (code) =>
        code.theme.toLowerCase().includes(query) ||
        code.quote.toLowerCase().includes(query) ||
        code.memo.toLowerCase().includes(query)
    );
  }, [codes, searchTerm]);

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setTranscript(String(e.target?.result || ""));
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function addTheme() {
    const trimmed = newTheme.trim();
    if (!trimmed || themes.some((theme) => theme.toLowerCase() === trimmed.toLowerCase())) return;
    setThemes((prev) => [...prev, trimmed]);
    setActiveTheme(trimmed);
    setNewTheme("");
  }

  function getTextareaSelection() {
    const element = textareaRef.current;
    if (!element) return "";
    return cleanSelection(element.value.slice(element.selectionStart, element.selectionEnd));
  }

  function addCodeFromSelection() {
    const browserSelection = typeof window !== "undefined" ? cleanSelection(window.getSelection()?.toString() || "") : "";
    const textareaSelection = getTextareaSelection();
    const quote = textareaSelection || browserSelection;

    if (!quote) return;

    setCodes((prev) => [
      {
        id: createId(),
        theme: activeTheme,
        quote,
        memo: memo.trim(),
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setMemo("");
  }

  function deleteCode(id) {
    setCodes((prev) => prev.filter((code) => code.id !== id));
  }

  function clearAllCodes() {
    setCodes([]);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                <Icon name="clipboard" size={16} /> Qualitative Coding Tool
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Clinical Interview Theme Coder</h1>
              <p className="mt-2 max-w-3xl text-slate-600">
                Organize interview transcripts, tag meaningful quotes by theme, count recurring pain points, and export coded excerpts for analysis.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50">
                <Icon name="upload" size={16} /> Upload .txt
                <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
              </label>
              <Button className="rounded-2xl" onClick={() => downloadCsv(codes)} disabled={!codes.length}>
                <Icon name="download" size={16} className="mr-2" /> Export CSV
              </Button>
            </div>
          </div>
        </motion.header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Icon name="file" size={20} /> Transcript
                  </h2>
                  <p className="text-sm text-slate-500">Highlight text in the box, choose a theme, then click “Code selected quote.”</p>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                className="min-h-[520px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 leading-7 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Paste interview transcript here..."
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Icon name="tag" size={20} /> Coding Panel
                </h2>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Select theme</label>
                  <select
                    value={activeTheme}
                    onChange={(event) => setActiveTheme(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                  >
                    {themes.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Optional analytic memo</label>
                  <textarea
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Why is this quote important?"
                  />
                </div>

                <Button className="w-full rounded-2xl py-6" onClick={addCodeFromSelection}>
                  <Icon name="plus" size={16} className="mr-2" /> Code selected quote
                </Button>

                <div className="rounded-2xl bg-slate-100 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-600">Add custom theme</label>
                  <div className="flex gap-2">
                    <input
                      value={newTheme}
                      onChange={(event) => setNewTheme(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && addTheme()}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                      placeholder="e.g., Alert fatigue"
                    />
                    <Button variant="secondary" className="rounded-xl" onClick={addTheme}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Icon name="chart" size={20} /> Theme Frequency
                </h2>
                <div className="space-y-3">
                  {themeCounts.map((item) => (
                    <div key={item.theme}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.theme}</span>
                        <span className="text-slate-500">{item.count}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / maxCount) * 100}%` }}
                          className="h-full rounded-full bg-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Coded Excerpts</h2>
                <p className="text-sm text-slate-500">Review, search, delete, or export coded quotes.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-slate-400 sm:w-72"
                    placeholder="Search codes..."
                  />
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={clearAllCodes} disabled={!codes.length}>
                  <Icon name="trash" size={16} className="mr-2" /> Clear all
                </Button>
              </div>
            </div>

            {filteredCodes.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCodes.map((code) => (
                  <motion.article
                    key={code.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{code.theme}</span>
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Delete coded excerpt"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                    <blockquote className="border-l-4 border-slate-200 pl-4 leading-7 text-slate-700">“{code.quote}”</blockquote>
                    {code.memo && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Memo: {code.memo}</p>}
                    <p className="mt-3 text-xs text-slate-400">Created: {code.createdAt}</p>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                No coded excerpts yet. Highlight a quote in the transcript and code it by theme.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

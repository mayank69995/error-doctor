import React, { useState, useRef } from "react";

const SAMPLE = `function getUserNames(users) {
  return users.map(u => u.name);
}

const data = fetchUsers(); // returns undefined until promise resolves
console.log(getUserNames(data));`;

export default function ErrorDoctor() {
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState("hinglish");
  const resultRef = useRef(null);

  async function diagnose() {
    if (!code.trim()) return;
    setLoading(true);
    setFailed(false);
    setResult(null);

    const languageInstruction = mode === "hinglish"
      ? "Write all explanation fields (diagnosis, whyItHappens, fix) in warm, conversational Hinglish (Hindi-English mix) the way a friendly senior developer would explain to a junior colleague. Avoid heavy pure-Hindi vocabulary, keep technical terms in English."
      : "Write all explanation fields (diagnosis, whyItHappens, fix) in concise, technical English. No fluff, no pleasantries. Assume the reader is an experienced developer who wants the fastest path to the fix.";

    const systemPrompt = `You are "Error Doctor", an expert developer assistant that explains code errors across any mainstream programming language (JavaScript, TypeScript, Python, Java, C/C++, C#, PHP, Go, Ruby, Kotlin, Swift, SQL, HTML/CSS, React/JSX, etc). Auto-detect the language from the pasted code.

${languageInstruction}

The user will paste a code snippet, and optionally an error message they saw.

Respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape:
{
  "language": "detected programming language",
  "lineNumber": <integer line number where the main issue is, 1-indexed, or null if not localizable>,
  "issueLine": "the exact text of that line, trimmed, or null",
  "diagnosis": "1-2 sentence plain explanation of WHAT is wrong",
  "whyItHappens": "1-2 sentence explanation of WHY this happens / root cause",
  "fix": "concrete fix instructions, 1-3 sentences",
  "fixedCode": "the corrected version of the relevant snippet (just the fixed lines or fixed function, not necessarily the whole file), as a code string",
  "severity": "one of: critical, warning, style"
}

If there are multiple issues, focus on the single most important / blocking one. If the code actually has no error, set lineNumber to null and explain in diagnosis that the code looks fine, with whyItHappens and fix empty strings and fixedCode empty string.`;

    const userContent = errorMsg.trim()
      ? `Error message:\n${errorMsg}\n\nCode:\n${code}`
      : `Code (no separate error message given, find the bug yourself):\n${code}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }]
        })
      });
      const data = await response.json();
      const text = data.content.map(b => b.text || "").join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const codeLines = code.split("\n");

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #6b5d4f; }
        textarea:focus, input:focus { outline: none; box-shadow: 0 0 0 2px #d98e3a44; }
        ::selection { background: #d98e3a55; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>{"</>"}</span>
            <span style={styles.logoText}>Error Doctor</span>
          </div>
          <p style={styles.tagline}>Code paste karo. Kaha galti hai, woh hum dhoondte hain.</p>
          <div style={styles.modeToggle}>
            <button
              style={{ ...styles.modeBtn, ...(mode === "hinglish" ? styles.modeBtnActive : {}) }}
              onClick={() => setMode("hinglish")}
            >
              Beginner — Hinglish
            </button>
            <button
              style={{ ...styles.modeBtn, ...(mode === "pro" ? styles.modeBtnActive : {}) }}
              onClick={() => setMode("pro")}
            >
              Pro — English
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.inputPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.dotRed}></span>
            <span style={styles.dotYellow}></span>
            <span style={styles.dotGreen}></span>
            <span style={styles.panelLabel}>your-code.txt</span>
          </div>
          <textarea
            style={styles.textarea}
            placeholder={`Apna code yahan paste karo...\n\nExample:\n${SAMPLE}`}
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
          />
          <div style={styles.errorRow}>
            <span style={styles.errorLabel}>Error message (optional)</span>
            <input
              style={styles.errorInput}
              placeholder="e.g. TypeError: Cannot read property 'map' of undefined"
              value={errorMsg}
              onChange={e => setErrorMsg(e.target.value)}
            />
          </div>
          <button
            style={{ ...styles.button, ...(loading || !code.trim() ? styles.buttonDisabled : {}) }}
            onClick={diagnose}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <span style={{ ...styles.dot, animation: "pulse-dot 1s infinite" }}>●</span>
                {" "}Diagnose ho raha hai...
              </>
            ) : (
              "Diagnose karo →"
            )}
          </button>
          {failed && (
            <p style={styles.failText}>Kuch gadbad ho gayi. Dobara try karo.</p>
          )}
        </section>

        {result && (
          <section style={styles.resultPanel} ref={resultRef}>
            <div style={styles.chartHeader}>
              <span style={styles.chartLabel}>DIAGNOSIS CHART</span>
              <span style={{
                ...styles.severityBadge,
                ...(result.severity === "critical" ? styles.sevCritical : result.severity === "warning" ? styles.sevWarning : styles.sevStyle)
              }}>
                {result.severity === "critical" ? "Critical" : result.severity === "warning" ? "Warning" : result.lineNumber ? "Style" : "All clear"}
              </span>
            </div>

            {result.lineNumber && (
              <div style={styles.codeBlock}>
                {codeLines.map((line, i) => {
                  const lineNo = i + 1;
                  const isFlagged = lineNo === result.lineNumber;
                  return (
                    <div key={i} style={{ ...styles.codeLine, ...(isFlagged ? styles.codeLineFlagged : {}) }}>
                      <span style={styles.lineNum}>{lineNo}</span>
                      {isFlagged && <span style={styles.marker}>▸</span>}
                      <span style={styles.lineText}>{line || " "}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.notesGrid}>
              <div style={styles.noteCard}>
                <span style={styles.noteLabel}>Kya galat hai</span>
                <p style={styles.noteText}>{result.diagnosis}</p>
              </div>
              {result.whyItHappens && (
                <div style={styles.noteCard}>
                  <span style={styles.noteLabel}>Kyun hua</span>
                  <p style={styles.noteText}>{result.whyItHappens}</p>
                </div>
              )}
              {result.fix && (
                <div style={styles.noteCard}>
                  <span style={styles.noteLabel}>Kaise theek karein</span>
                  <p style={styles.noteText}>{result.fix}</p>
                </div>
              )}
            </div>

            {result.fixedCode && (
              <div style={styles.fixBlock}>
                <span style={styles.fixLabel}>Sahi code</span>
                <pre style={styles.fixCode}>{result.fixedCode}</pre>
              </div>
            )}
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <span>Error Doctor — har bug ka ek check-up hota hai.</span>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1c1812",
    color: "#f0e6d6",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    borderBottom: "1px solid #3a3127",
    padding: "28px 20px 24px"
  },
  headerInner: { maxWidth: 880, margin: "0 auto" },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logoMark: {
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#d98e3a",
    fontSize: 20,
    fontWeight: 600
  },
  logoText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#f0e6d6"
  },
  tagline: { color: "#a89a85", fontSize: 14.5, margin: "0 0 14px" },
  modeToggle: { display: "inline-flex", gap: 6, background: "#181410", border: "1px solid #3a3127", borderRadius: 8, padding: 3 },
  modeBtn: {
    background: "transparent",
    border: "none",
    color: "#a89a85",
    fontSize: 12.5,
    fontFamily: "'IBM Plex Mono', monospace",
    padding: "7px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  modeBtnActive: { background: "#d98e3a", color: "#1c1812", fontWeight: 600 },

  main: { flex: 1, maxWidth: 880, margin: "0 auto", padding: "32px 20px 60px", width: "100%", boxSizing: "border-box" },

  inputPanel: {
    background: "#221c14",
    border: "1px solid #3a3127",
    borderRadius: 10,
    overflow: "hidden"
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 14px",
    background: "#181410",
    borderBottom: "1px solid #3a3127"
  },
  dotRed: { width: 9, height: 9, borderRadius: "50%", background: "#c0564a" },
  dotYellow: { width: 9, height: 9, borderRadius: "50%", background: "#d9a93a" },
  dotGreen: { width: 9, height: 9, borderRadius: "50%", background: "#7a9a5a" },
  panelLabel: { marginLeft: 8, fontSize: 12.5, color: "#6b5d4f", fontFamily: "'IBM Plex Mono', monospace" },

  textarea: {
    width: "100%",
    minHeight: 220,
    background: "transparent",
    border: "none",
    color: "#f0e6d6",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
    lineHeight: 1.6,
    padding: "16px 18px",
    boxSizing: "border-box",
    resize: "vertical"
  },
  errorRow: {
    borderTop: "1px solid #3a3127",
    padding: "12px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  errorLabel: { fontSize: 12, color: "#a89a85", fontFamily: "'IBM Plex Mono', monospace" },
  errorInput: {
    background: "#181410",
    border: "1px solid #3a3127",
    borderRadius: 6,
    padding: "9px 12px",
    color: "#f0e6d6",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13.5
  },

  button: {
    margin: "0 18px 18px",
    width: "calc(100% - 36px)",
    background: "#d98e3a",
    color: "#1c1812",
    border: "none",
    borderRadius: 7,
    padding: "13px 0",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', sans-serif",
    cursor: "pointer",
    transition: "filter 0.15s ease"
  },
  buttonDisabled: { background: "#5a4d3a", color: "#a89a85", cursor: "not-allowed" },
  dot: { display: "inline-block" },
  failText: { color: "#c0564a", fontSize: 13, padding: "0 18px 16px", margin: 0 },

  resultPanel: {
    marginTop: 28,
    background: "#221c14",
    border: "1px solid #3a3127",
    borderRadius: 10,
    overflow: "hidden",
    animation: "slide-in 0.35s ease"
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #3a3127",
    background: "#181410"
  },
  chartLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11.5,
    letterSpacing: "0.12em",
    color: "#a89a85"
  },
  severityBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 100,
    fontFamily: "'IBM Plex Mono', monospace"
  },
  sevCritical: { background: "#c0564a22", color: "#e07a6c" },
  sevWarning: { background: "#d9a93a22", color: "#e0bb5c" },
  sevStyle: { background: "#7a9a5a22", color: "#9bc17a" },

  codeBlock: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13.5,
    padding: "10px 0",
    borderBottom: "1px solid #3a3127",
    overflowX: "auto"
  },
  codeLine: {
    display: "flex",
    alignItems: "baseline",
    padding: "2px 18px",
    whiteSpace: "pre",
    color: "#c9bca8"
  },
  codeLineFlagged: {
    background: "#d98e3a18",
    borderLeft: "3px solid #d98e3a",
    paddingLeft: 15,
    color: "#f0e6d6"
  },
  lineNum: { color: "#6b5d4f", width: 28, flexShrink: 0, userSelect: "none", textAlign: "right", marginRight: 14 },
  marker: { color: "#d98e3a", marginRight: 8, flexShrink: 0 },
  lineText: { whiteSpace: "pre" },

  notesGrid: { display: "flex", flexDirection: "column", gap: 14, padding: "18px" },
  noteCard: { borderLeft: "2px solid #3a3127", paddingLeft: 14 },
  noteLabel: {
    display: "block",
    fontSize: 11.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#d98e3a",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: 5
  },
  noteText: { margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#e6dac8" },

  fixBlock: { borderTop: "1px solid #3a3127", padding: "16px 18px 20px" },
  fixLabel: {
    display: "block",
    fontSize: 11.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#9bc17a",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: 8
  },
  fixCode: {
    background: "#181410",
    border: "1px solid #3a3127",
    borderRadius: 6,
    padding: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13.5,
    color: "#9bc17a",
    overflowX: "auto",
    margin: 0,
    whiteSpace: "pre-wrap"
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    fontSize: 12.5,
    color: "#6b5d4f",
    fontFamily: "'IBM Plex Mono', monospace",
    borderTop: "1px solid #3a3127"
  }
};

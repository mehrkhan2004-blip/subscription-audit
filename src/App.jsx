import { useState, useEffect } from "react";

const SUGGESTED_SUBS = [
  { name: "Netflix", icon: "🎬", category: "Entertainment", avg: 15.49 },
  { name: "Spotify", icon: "🎵", category: "Music", avg: 9.99 },
  { name: "Hulu", icon: "📺", category: "Entertainment", avg: 17.99 },
  { name: "Disney+", icon: "✨", category: "Entertainment", avg: 13.99 },
  { name: "Amazon Prime", icon: "📦", category: "Shopping", avg: 14.99 },
  { name: "Apple TV+", icon: "🍎", category: "Entertainment", avg: 9.99 },
  { name: "HBO Max", icon: "🎭", category: "Entertainment", avg: 15.99 },
  { name: "YouTube Premium", icon: "▶️", category: "Entertainment", avg: 13.99 },
  { name: "ChatGPT Plus", icon: "🤖", category: "AI Tools", avg: 20.00 },
  { name: "Notion", icon: "📝", category: "Productivity", avg: 10.00 },
  { name: "Figma", icon: "🎨", category: "Design", avg: 15.00 },
  { name: "Adobe CC", icon: "🖌️", category: "Design", avg: 54.99 },
  { name: "Dropbox", icon: "☁️", category: "Storage", avg: 11.99 },
  { name: "iCloud+", icon: "🌤️", category: "Storage", avg: 2.99 },
  { name: "Google One", icon: "🔵", category: "Storage", avg: 2.99 },
  { name: "LinkedIn Premium", icon: "💼", category: "Career", avg: 39.99 },
  { name: "Duolingo Plus", icon: "🦉", category: "Education", avg: 6.99 },
  { name: "Headspace", icon: "🧘", category: "Wellness", avg: 12.99 },
  { name: "Calm", icon: "🌊", category: "Wellness", avg: 14.99 },
  { name: "NordVPN", icon: "🔒", category: "Privacy", avg: 4.99 },
  { name: "Grammarly", icon: "✍️", category: "Productivity", avg: 12.00 },
  { name: "Audible", icon: "🎧", category: "Books", avg: 14.95 },
  { name: "Kindle Unlimited", icon: "📚", category: "Books", avg: 11.99 },
  { name: "Xbox Game Pass", icon: "🎮", category: "Gaming", avg: 14.99 },
  { name: "PlayStation Plus", icon: "🕹️", category: "Gaming", avg: 17.99 },
];

const USAGE_LABELS = ["Daily", "Weekly", "Monthly", "Rarely", "Never"];
const USAGE_SCORES = { Daily: 10, Weekly: 7, Monthly: 4, Rarely: 2, Never: 0 };

function getRating(usage, price) {
  const score = USAGE_SCORES[usage];
  if (score >= 7) return { label: "Keep ✓", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (score >= 4 && price < 10) return { label: "Maybe", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  if (score <= 2) return { label: "Cancel ✗", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  return { label: "Review", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
}

export default function App() {
  const [step, setStep] = useState("landing"); // landing | select | audit | result
  const [selected, setSelected] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [subs, setSubs] = useState([]);
  const [current, setCurrent] = useState(0);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [animIn, setAnimIn] = useState(true);

  const toggleSub = (sub) => {
    setSelected(prev =>
      prev.find(s => s.name === sub.name)
        ? prev.filter(s => s.name !== sub.name)
        : [...prev, { ...sub, price: sub.avg, usage: "Monthly" }]
    );
  };

  const addCustom = () => {
    if (!customName.trim() || !customPrice) return;
    setSelected(prev => [...prev, {
      name: customName.trim(), icon: "💳", category: "Other",
      avg: parseFloat(customPrice), price: parseFloat(customPrice), usage: "Monthly"
    }]);
    setCustomName(""); setCustomPrice("");
  };

  const startAudit = () => {
    setSubs(selected.map(s => ({ ...s })));
    setCurrent(0);
    setStep("audit");
    setAnimIn(true);
  };

  const setUsage = (usage) => {
    setSubs(prev => prev.map((s, i) => i === current ? { ...s, usage } : s));
  };

  const next = () => {
    if (current < subs.length - 1) {
      setAnimIn(false);
      setTimeout(() => { setCurrent(c => c + 1); setAnimIn(true); }, 200);
    } else {
      fetchAIInsight();
      setStep("result");
    }
  };

  const prev = () => {
    if (current > 0) {
      setAnimIn(false);
      setTimeout(() => { setCurrent(c => c - 1); setAnimIn(true); }, 200);
    }
  };

  async function fetchAIInsight() {
    setLoadingAI(true);
    const cancelList = subs.filter(s => USAGE_SCORES[s.usage] <= 2);
    const keepList = subs.filter(s => USAGE_SCORES[s.usage] >= 7);
    const totalSpend = subs.reduce((a, s) => a + s.price, 0);
    const cancelSavings = cancelList.reduce((a, s) => a + s.price, 0);

    const prompt = `You are a personal finance advisor. Here's someone's subscription audit:
Total monthly spend: $${totalSpend.toFixed(2)}
Subscriptions to cancel (rarely/never used): ${cancelList.map(s => s.name).join(", ") || "none"}
Potential monthly savings: $${cancelSavings.toFixed(2)} ($${(cancelSavings * 12).toFixed(0)}/year)
Subscriptions they use daily: ${keepList.map(s => s.name).join(", ") || "none"}

Give them a punchy 3-sentence insight: 1) acknowledge their waste, 2) one smart observation about their habits, 3) one actionable tip. Be direct, slightly cheeky, and helpful. No bullet points.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || "Great audit! Review your cancellations and start saving.");
    } catch {
      setAiInsight("You've done the hard part — now act on it. Cancel those unused subs today and pocket the savings.");
    }
    setLoadingAI(false);
  }

  const totalMonthly = subs.reduce((a, s) => a + s.price, 0);
  const cancelSubs = subs.filter(s => USAGE_SCORES[s.usage] <= 2);
  const savingsMonthly = cancelSubs.reduce((a, s) => a + s.price, 0);
  const savingsYearly = savingsMonthly * 12;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      fontFamily: "'Syne', sans-serif",
      color: "#f0f0f0",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 16px 60px",
      position: "relative", overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #7c3aed; color: white; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .glow { animation: glow 3s ease-in-out infinite alternate; }
        @keyframes glow { from { opacity: 0.4; } to { opacity: 1; } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .slide-in { animation: slideIn 0.3s ease forwards; }
        @keyframes slideIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .card-hover { transition: transform 0.15s, border-color 0.15s; cursor: pointer; }
        .card-hover:hover { transform: translateY(-2px); }
        .btn { cursor: pointer; border: none; font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: 0.05em; transition: all 0.15s; }
        .btn:active { transform: scale(0.97); }
        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .orb {
          position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0;
        }
        input { font-family: 'DM Mono', monospace; }
        input:focus { outline: none; }
      `}</style>

      <div className="grid-bg" />
      <div className="orb" style={{ width: 400, height: 400, background: "rgba(124,58,237,0.15)", top: -100, right: -100 }} />
      <div className="orb" style={{ width: 300, height: 300, background: "rgba(16,185,129,0.08)", bottom: 100, left: -80 }} />

      {/* LANDING */}
      {step === "landing" && (
        <div className="fade-in" style={{ position: "relative", zIndex: 1, maxWidth: 600, width: "100%", textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 13, fontFamily: "'DM Mono'", color: "#7c3aed", letterSpacing: "0.2em", marginBottom: 24, textTransform: "uppercase" }}>
            ◈ AI Subscription Audit
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            You're probably wasting{" "}
            <span style={{ color: "#7c3aed", WebkitTextStroke: "1px #9f67ff" }}>$300</span>
            <br />a year on subs.
          </h1>
          <p style={{ fontSize: 17, color: "#888", lineHeight: 1.7, marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
            Find out which subscriptions are draining your wallet. Takes 2 minutes. Powered by AI.
          </p>
          <button className="btn pulse" onClick={() => setStep("select")} style={{
            background: "#7c3aed", color: "white", padding: "16px 40px",
            fontSize: 16, borderRadius: 12,
            boxShadow: "0 0 40px rgba(124,58,237,0.4)"
          }}>
            Audit My Subscriptions →
          </button>
          <div style={{ marginTop: 60, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[["2 min", "to complete"], ["100%", "private"], ["AI", "powered"]].map(([big, small]) => (
              <div key={big} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed" }}>{big}</div>
                <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono'" }}>{small}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELECT */}
      {step === "select" && (
        <div className="fade-in" style={{ position: "relative", zIndex: 1, maxWidth: 700, width: "100%", paddingTop: 48 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontFamily: "'DM Mono'", color: "#7c3aed", letterSpacing: "0.2em", marginBottom: 12 }}>STEP 1 OF 2</div>
            <h2 style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 800 }}>Which of these do you pay for?</h2>
            <p style={{ color: "#666", marginTop: 8, fontFamily: "'DM Mono'", fontSize: 13 }}>Select all that apply</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
            {SUGGESTED_SUBS.map(sub => {
              const isSelected = selected.find(s => s.name === sub.name);
              return (
                <div key={sub.name} className="card-hover" onClick={() => toggleSub(sub)} style={{
                  background: isSelected ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "#7c3aed" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 10, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  userSelect: "none"
                }}>
                  <span style={{ fontSize: 18 }}>{sub.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.name}</div>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono'" }}>${sub.avg}/mo</div>
                  </div>
                  {isSelected && <span style={{ marginLeft: "auto", color: "#7c3aed", fontSize: 14 }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Custom add */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 10, fontFamily: "'DM Mono'" }}>+ Add custom subscription</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Name" style={{
                  flex: 2, minWidth: 140, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "10px 14px", color: "#f0f0f0", fontSize: 14
                }} />
              <input value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                placeholder="$/mo" type="number" style={{
                  flex: 1, minWidth: 80, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "10px 14px", color: "#f0f0f0", fontSize: 14
                }} />
              <button className="btn" onClick={addCustom} style={{
                background: "rgba(124,58,237,0.3)", color: "#c4b5fd",
                padding: "10px 18px", borderRadius: 8, fontSize: 14,
                border: "1px solid rgba(124,58,237,0.4)"
              }}>Add</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: "#555" }}>
              {selected.length} selected · ${selected.reduce((a, s) => a + s.price, 0).toFixed(2)}/mo
            </div>
            <button className="btn" onClick={startAudit} disabled={selected.length === 0} style={{
              background: selected.length ? "#7c3aed" : "#222",
              color: selected.length ? "white" : "#444",
              padding: "14px 32px", borderRadius: 10, fontSize: 15,
              boxShadow: selected.length ? "0 0 30px rgba(124,58,237,0.3)" : "none"
            }}>
              Start Audit →
            </button>
          </div>
        </div>
      )}

      {/* AUDIT */}
      {step === "audit" && subs[current] && (
        <div style={{ position: "relative", zIndex: 1, maxWidth: 520, width: "100%", paddingTop: 48 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontFamily: "'DM Mono'", color: "#7c3aed", letterSpacing: "0.2em", marginBottom: 8 }}>
              STEP 2 OF 2 · {current + 1} / {subs.length}
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", height: 3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ background: "#7c3aed", height: "100%", width: `${((current + 1) / subs.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          <div className={animIn ? "slide-in" : ""} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "36px 32px", textAlign: "center"
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{subs[current].icon}</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{subs[current].name}</h2>
            <div style={{ fontFamily: "'DM Mono'", color: "#7c3aed", fontSize: 16, marginBottom: 8 }}>
              ${subs[current].price.toFixed(2)}/month
            </div>
            <div style={{ fontFamily: "'DM Mono'", color: "#444", fontSize: 12, marginBottom: 32 }}>
              ${(subs[current].price * 12).toFixed(2)}/year
            </div>

            <div style={{ fontSize: 15, color: "#888", marginBottom: 20 }}>How often do you actually use this?</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {USAGE_LABELS.map(label => {
                const isActive = subs[current].usage === label;
                return (
                  <button key={label} className="btn card-hover" onClick={() => setUsage(label)} style={{
                    background: isActive ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? "#7c3aed" : "rgba(255,255,255,0.08)"}`,
                    color: isActive ? "#c4b5fd" : "#888",
                    padding: "13px 20px", borderRadius: 10, fontSize: 15,
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span>{label}</span>
                    {isActive && <span>●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <button className="btn" onClick={prev} disabled={current === 0} style={{
              background: "transparent", color: current === 0 ? "#333" : "#666",
              padding: "12px 20px", borderRadius: 10, fontSize: 14,
              border: `1px solid ${current === 0 ? "#222" : "#333"}`
            }}>← Back</button>
            <button className="btn" onClick={next} style={{
              background: "#7c3aed", color: "white",
              padding: "12px 28px", borderRadius: 10, fontSize: 15,
              boxShadow: "0 0 20px rgba(124,58,237,0.3)"
            }}>
              {current === subs.length - 1 ? "See Results 🎯" : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {step === "result" && (
        <div className="fade-in" style={{ position: "relative", zIndex: 1, maxWidth: 660, width: "100%", paddingTop: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontFamily: "'DM Mono'", color: "#7c3aed", letterSpacing: "0.2em", marginBottom: 16 }}>AUDIT COMPLETE</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)", fontWeight: 800, marginBottom: 8 }}>Your Results</h2>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Monthly spend", value: `$${totalMonthly.toFixed(0)}`, color: "#f0f0f0" },
              { label: "Could save/mo", value: `$${savingsMonthly.toFixed(0)}`, color: "#22c55e" },
              { label: "Savings/year", value: `$${savingsYearly.toFixed(0)}`, color: "#7c3aed" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "20px 16px", textAlign: "center"
              }}>
                <div style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono'", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI Insight */}
          <div style={{
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 14, padding: "20px 24px", marginBottom: 32,
            display: "flex", gap: 14, alignItems: "flex-start"
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
            <div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: "#7c3aed", marginBottom: 8, letterSpacing: "0.1em" }}>AI INSIGHT</div>
              {loadingAI ? (
                <div style={{ color: "#666", fontFamily: "'DM Mono'", fontSize: 13 }} className="glow">Analyzing your subscriptions...</div>
              ) : (
                <p style={{ color: "#ccc", lineHeight: 1.7, fontSize: 14 }}>{aiInsight}</p>
              )}
            </div>
          </div>

          {/* Sub list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {subs.map((sub) => {
              const rating = getRating(sub.usage, sub.price);
              return (
                <div key={sub.name} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 14
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{sub.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{sub.name}</div>
                    <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono'" }}>Used: {sub.usage}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 14, color: "#888" }}>${sub.price.toFixed(2)}/mo</div>
                    <div style={{
                      marginTop: 4, fontSize: 11, fontFamily: "'DM Mono'", fontWeight: 600,
                      color: rating.color, background: rating.bg,
                      padding: "3px 8px", borderRadius: 6, display: "inline-block"
                    }}>{rating.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {cancelSubs.length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 14, padding: "20px 24px", marginBottom: 28
            }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#ef4444" }}>
                ✗ Cancel These First
              </div>
              {cancelSubs.map(s => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 14 }}>
                  <span style={{ color: "#ccc" }}>{s.icon} {s.name}</span>
                  <span style={{ fontFamily: "'DM Mono'", color: "#ef4444" }}>-${s.price.toFixed(2)}/mo</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontFamily: "'DM Mono'", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                Total savings: ${savingsMonthly.toFixed(2)}/mo · ${savingsYearly.toFixed(0)}/yr
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => { setSelected([]); setStep("landing"); }} style={{
              flex: 1, background: "rgba(255,255,255,0.05)", color: "#888",
              padding: "14px", borderRadius: 10, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.08)"
            }}>Start Over</button>
            <button className="btn" onClick={() => { setSelected([...subs]); setStep("select"); }} style={{
              flex: 2, background: "#7c3aed", color: "white",
              padding: "14px", borderRadius: 10, fontSize: 15,
              boxShadow: "0 0 24px rgba(124,58,237,0.35)"
            }}>Edit Subscriptions →</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";

const API = "http://localhost:5000";

const ANIMAL_EMOJIS = {
  bear: "🐻", bison: "🦬", deer: "🦌", elephant: "🐘",
  fox: "🦊", giraffe: "🦒", hyena: "🐆", leopard: "🐆",
  person: "🧍", tiger: "🐯", wild_boar: "🐗", wolf: "🐺", zebra: "🦓",
};

const CLASS_COLORS = {
  bear: "#c2714f", bison: "#c2944f", deer: "#7daa6b",
  elephant: "#b5a16a", fox: "#d4794a", giraffe: "#c9b44e",
  hyena: "#7aad9c", leopard: "#a8b86d", person: "#9eb3c4",
  tiger: "#d4714a", wild_boar: "#9b87c4", wolf: "#6ba3c2", zebra: "#a08ec0",
};
const defaultColor = "#94a3b8";

const FunFacts = [
  "Tigers can leap up to 10 meters in a single bound.",
  "Elephants are the only animals that can't jump.",
  "A group of foxes is called a 'skulk' or 'leash'.",
  "Giraffes sleep for only about 30 minutes a day.",
  "Wolves can hear sounds up to 10 miles away.",
  "Bears have a sense of smell 2,100 times better than humans.",
  "Zebra stripes are as unique as human fingerprints.",
  "Wild boars can run up to 30 mph despite their stocky build.",
];

export default function App() {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("detect");
  const [factIdx] = useState(() => Math.floor(Math.random() * FunFacts.length));
  const fileRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    fetch(`${API}/metrics`).then(r => r.json()).then(setMetrics).catch(() => {});
  }, []);

  useEffect(() => {
    if (!detections || !image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      detections.detections.forEach(det => {
        const [cx, cy, w, h] = det.bbox;
        const x = (cx - w / 2) * canvas.width;
        const y = (cy - h / 2) * canvas.height;
        const bw = w * canvas.width;
        const bh = h * canvas.height;
        const color = CLASS_COLORS[det.class] || defaultColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeRect(x, y, bw, bh);
        ctx.shadowBlur = 0;
        ctx.fillStyle = color + "cc";
        ctx.fillRect(x, y - 26, bw, 26);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px 'Georgia', serif";
        const emoji = ANIMAL_EMOJIS[det.class] || "🐾";
        ctx.fillText(`${emoji} ${det.class}  ${(det.confidence * 100).toFixed(0)}%`, x + 7, y - 7);
      });
    };
  }, [detections, image]);

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith("image/")) { setError("Hmm, that doesn't look like an image. Try a JPG or PNG."); return; }
    setError(null); setDetections(null);
    setImage({ url: URL.createObjectURL(file), file });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true); setError(null); setDetections(null);
    try {
      const form = new FormData();
      form.append("image", image.file);
      const res = await fetch(`${API}/predict`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setDetections(await res.json());
    } catch (err) {
      setError(err.message || "Couldn't reach the server. Is the backend running?");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; background: #f5f0e8; overflow-x: hidden; }
        
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes leafDrift { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(3deg) translateY(-4px)} }

        .tab-btn { transition: all 0.2s ease; }
        .tab-btn:hover { color: #3d6b4f !important; }
        .detect-btn { transition: all 0.25s ease; }
        .detect-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(61,107,79,0.3) !important; }
        .detect-btn:active:not(:disabled) { transform: translateY(0px); }
        .card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
        .drop-zone { transition: all 0.25s ease; }
        .badge-row { transition: background 0.15s ease; }
        .badge-row:hover { background: #f0ebe0 !important; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c9bfaa; border-radius: 3px; }
      `}</style>

      {/* ── Page shell ── */}
      <div style={{
        minHeight: "100vh", background: "#f5f0e8",
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 10% 0%, rgba(91,140,90,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 100%, rgba(165,122,61,0.06) 0%, transparent 60%)
        `,
        fontFamily: "'DM Sans', sans-serif", color: "#2c2c2c",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ── */}
        <header style={{
          padding: "0 48px",
          borderBottom: "1px solid #e4ddd0",
          background: "rgba(245,240,232,0.92)",
          backdropFilter: "blur(16px)",
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 62,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26, animation: "leafDrift 4s ease-in-out infinite" }}>🌿</span>
            <div>
              <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 17, color: "#2c2c2c", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
                Wildlife Monitor
              </div>
              <div style={{ fontSize: 9.5, color: "#9c8f7a", letterSpacing: "1.2px", textTransform: "uppercase", fontWeight: 500 }}>
                AI-Powered Detection
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 2 }}>
            {[{ key: "detect", label: "Detect", icon: "🔍" }, { key: "metrics", label: "Metrics", icon: "📊" }].map(({ key, label, icon }) => (
              <button
                key={key}
                className="tab-btn"
                onClick={() => setTab(key)}
                style={{
                  background: tab === key ? "#3d6b4f" : "transparent",
                  color: tab === key ? "#fff" : "#7a6e5f",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: tab === key ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </nav>

          {/* Status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#eaf3ed", border: "1px solid #b6d6c0",
            borderRadius: 20, padding: "5px 12px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3d6b4f", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11.5, color: "#3d6b4f", fontWeight: 600, letterSpacing: "0.6px" }}>Model Ready</span>
          </div>
        </header>

        {/* ══════════════════════════════ DETECT TAB ══════════════════════════════ */}
        {tab === "detect" && (
          <main style={{ flex: 1, padding: "36px 48px", display: "grid", gridTemplateColumns: "1fr 380px", gridTemplateRows: "auto 1fr auto", columnGap: 32, animation: "fadeUp 0.4s ease" }}>

            {/* Title row */}
            <div style={{ gridColumn: 1, gridRow: 1, marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: "#1e1e1e", letterSpacing: "-0.5px" }}>
                Identify Wildlife in Your Photos
              </h1>
              <p style={{ color: "#7a6e5f", fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
                Upload a photo from the field and our YOLOv8 model will identify the animals for you — instantly.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className="drop-zone"
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                gridColumn: 1, gridRow: 2,
                background: dragging ? "rgba(61,107,79,0.06)" : "#faf7f2",
                border: `2px dashed ${dragging ? "#3d6b4f" : "#d9d1c4"}`,
                borderRadius: 16,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 380, overflow: "hidden", position: "relative",
              }}
            >
              {image ? (
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                  {detections
                    ? <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 14 }} />
                    : <img src={image.url} alt="uploaded" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 14 }} />
                  }
                  <div style={{
                    position: "absolute", bottom: 12, right: 12,
                    background: "rgba(245,240,232,0.88)", backdropFilter: "blur(8px)",
                    border: "1px solid #e4ddd0", borderRadius: 6,
                    padding: "4px 12px", fontSize: 11.5, color: "#9c8f7a", fontWeight: 500,
                  }}>
                    click to change photo
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>📷</div>
                  <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 17, color: "#4a4238", marginBottom: 6 }}>
                    Drop your field photo here
                  </div>
                  <div style={{ color: "#9c8f7a", fontSize: 13 }}>or click to browse from your device</div>
                  <div style={{ marginTop: 12, fontSize: 11.5, color: "#c9bfaa" }}>JPG · PNG · WEBP supported</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />

            {/* Analyse button */}
            <div style={{ gridColumn: 1, gridRow: 3, paddingTop: 16 }}>
              <button
                className="detect-btn"
                onClick={handlePredict}
                disabled={!image || loading}
                style={{
                  width: "100%",
                  background: image && !loading
                    ? "linear-gradient(135deg, #3d6b4f 0%, #2d5440 100%)"
                    : "#ece6dc",
                  color: image && !loading ? "#fff" : "#c0b8ac",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 0",
                  fontSize: 14.5, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: image && !loading ? "pointer" : "not-allowed",
                  boxShadow: image && !loading ? "0 4px 16px rgba(61,107,79,0.2)" : "none",
                  letterSpacing: "0.2px",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Analysing your photo…
                  </span>
                ) : "🔍  Analyse Photo"}
              </button>

              {error && (
                <div style={{ marginTop: 12, background: "#fdf0ed", border: "1px solid #f0c8bc", borderRadius: 8, padding: "10px 14px", color: "#b05a3e", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Fun fact strip */}
              <div style={{ marginTop: 14, background: "#eef5f0", border: "1px solid #c8dccf", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14 }}>🐾</span>
                <p style={{ fontSize: 12, color: "#4a7a5c", lineHeight: 1.5, fontStyle: "italic" }}>
                  <strong>Did you know?</strong> {FunFacts[factIdx]}
                </p>
              </div>
            </div>

            {/* ── Right panel ── */}
            <div style={{ gridColumn: 2, gridRow: "1 / 4", display: "flex", flexDirection: "column", gap: 16 }}>
              {detections ? (
                <div style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Detection results */}
                  <div style={{ background: "#fff", border: "1px solid #e4ddd0", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 16, color: "#1e1e1e" }}>Detected Animals</div>
                        <div style={{ fontSize: 11.5, color: "#9c8f7a", marginTop: 2 }}>Ranked by confidence</div>
                      </div>
                      <div style={{ background: "#eaf3ed", border: "1px solid #b6d6c0", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#3d6b4f" }}>
                        {detections.count} found
                      </div>
                    </div>

                    {detections.detections.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#9c8f7a", fontSize: 13.5 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🌾</div>
                        No wildlife detected above the confidence threshold.
                      </div>
                    ) : (
                      detections.detections.map((d, i) => {
                        const color = CLASS_COLORS[d.class] || defaultColor;
                        const emoji = ANIMAL_EMOJIS[d.class] || "🐾";
                        const pct = (d.confidence * 100).toFixed(1);
                        return (
                          <div key={i} className="badge-row" style={{
                            display: "flex", alignItems: "center", gap: 10,
                            background: "#faf7f2", borderRadius: 10, padding: "10px 13px", marginBottom: 8,
                            border: "1px solid #ede6d8",
                          }}>
                            <span style={{ fontSize: 20 }}>{emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                <span style={{ fontWeight: 600, fontSize: 13.5, textTransform: "capitalize", color: "#2c2c2c" }}>{d.class}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: color }}>{pct}%</span>
                              </div>
                              <div style={{ height: 5, background: "#ede6d8", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${d.confidence * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Legend */}
                  <div style={{ background: "#fff", border: "1px solid #e4ddd0", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 13.5, color: "#4a4238", marginBottom: 12 }}>Species Colour Guide</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {Object.entries(CLASS_COLORS).map(([cls, col]) => (
                        <div key={cls} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: col + "15", border: `1px solid ${col}40`,
                          borderRadius: 20, padding: "3px 10px",
                          fontSize: 11.5, color: col, fontWeight: 600, textTransform: "capitalize",
                        }}>
                          {ANIMAL_EMOJIS[cls] || "🐾"} {cls}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div style={{
                  background: "#fff", border: "1px solid #e4ddd0", borderRadius: 14,
                  padding: "48px 32px", textAlign: "center", flex: 1,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>🦒</div>
                  <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 16, color: "#4a4238", marginBottom: 8 }}>
                    Waiting for a photo
                  </div>
                  <div style={{ fontSize: 13, color: "#9c8f7a", lineHeight: 1.6, maxWidth: 220 }}>
                    Upload an image and click Analyse to see the detected animals here.
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ══════════════════════════════ METRICS TAB ══════════════════════════════ */}
        {tab === "metrics" && (
          <main style={{ flex: 1, padding: "36px 48px", animation: "fadeUp 0.4s ease" }}>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: "#1e1e1e", letterSpacing: "-0.4px" }}>
              How Well Does the Model Perform?
            </h1>
            <p style={{ color: "#7a6e5f", fontSize: 13.5, marginTop: 6, marginBottom: 32, lineHeight: 1.6 }}>
              Trained on a wildlife dataset using YOLOv8n · 20 epochs · 416px image size
            </p>

            {metrics ? (
              <>
                {/* Metric cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
                  {[
                    { label: "mAP @ 0.5", desc: "Overall accuracy score", val: metrics.map50, color: "#3d6b4f", icon: "🎯" },
                    { label: "Precision", desc: "How specific the detections are", val: metrics.precision, color: "#7a4faf", icon: "✅" },
                    { label: "Recall", desc: "How many animals it catches", val: metrics.recall, color: "#c27a2a", icon: "🔍" },
                  ].map(({ label, desc, val, color, icon }) => {
                    const pct = Math.round(val * 100);
                    const circumference = 2 * Math.PI * 32;
                    return (
                      <div key={label} className="card-hover" style={{
                        background: "#fff", borderRadius: 16, padding: "28px 24px",
                        border: "1px solid #e4ddd0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                        textAlign: "center",
                      }}>
                        <svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: 10 }}>
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#f0ebe0" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - circumference * val}
                            strokeLinecap="round" transform="rotate(-90 40 40)"
                            style={{ transition: "stroke-dashoffset 1.2s ease" }}
                          />
                          <text x="40" y="46" textAnchor="middle" fill="#1e1e1e" fontSize="16" fontWeight="700" fontFamily="DM Sans, sans-serif">{pct}%</text>
                        </svg>
                        <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 16, color: "#1e1e1e", marginBottom: 4 }}>
                          {icon} {label}
                        </div>
                        <div style={{ fontSize: 12, color: "#9c8f7a" }}>{desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Score bars */}
                <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #e4ddd0", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 17, color: "#1e1e1e", marginBottom: 20 }}>Score Breakdown</div>
                  {[
                    { label: "mAP @ 0.5", val: metrics.map50, color: "#3d6b4f" },
                    { label: "Precision", val: metrics.precision, color: "#7a4faf" },
                    { label: "Recall", val: metrics.recall, color: "#c27a2a" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13.5 }}>
                        <span style={{ color: "#4a4238", fontWeight: 500 }}>{label}</span>
                        <span style={{ color, fontWeight: 700, fontFamily: "monospace" }}>{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, background: "#f0ebe0", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ width: `${val * 100}%`, height: "100%", background: color, borderRadius: 6, transition: "width 1.2s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Training stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { icon: "🔁", label: "Training Epochs", val: metrics.epochs },
                    { icon: "📐", label: "Image Size", val: `${metrics.image_size}px` },
                    { icon: "🐾", label: "Animal Classes", val: metrics.classes.length },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="card-hover" style={{
                      background: "#fff", borderRadius: 14, padding: "18px 20px",
                      border: "1px solid #e4ddd0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 11.5, color: "#9c8f7a", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: 20, color: "#1e1e1e", fontFamily: "'Lora', serif" }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Species it can detect */}
                <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #e4ddd0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 16, color: "#1e1e1e", marginBottom: 14 }}>Animals the Model Can Recognise</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {metrics.classes.map(cls => (
                      <div key={cls} style={{
                        background: (CLASS_COLORS[cls] || "#94a3b8") + "18",
                        border: `1px solid ${(CLASS_COLORS[cls] || "#94a3b8")}40`,
                        borderRadius: 20, padding: "6px 14px",
                        fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                        color: CLASS_COLORS[cls] || "#94a3b8",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {ANIMAL_EMOJIS[cls] || "🐾"} {cls}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "#9c8f7a", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, border: "2px solid #d9d1c4", borderTopColor: "#3d6b4f", borderRadius: "50%", display: "inline-block", animation: "spin 0.9s linear infinite" }} />
                Loading metrics from the server…
              </div>
            )}
          </main>
        )}

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid #e4ddd0", padding: "14px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#c9bfaa" }}>Wildlife Monitor · YOLOv8 Detection · Minor Project</span>
          <span style={{ fontSize: 12, color: "#c9bfaa" }}>🌿 Built with care for wildlife conservation</span>
        </footer>
      </div>
    </>
  );
}

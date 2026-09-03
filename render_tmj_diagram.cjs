const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pmtgeydtqypwrypshhsx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";
const supabase = createClient(supabaseUrl, anonKey);
const chromeBin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const tmjHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 1200px;
      background: #0B132B;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: relative;
      overflow: hidden;
      color: #FFFFFF;
    }
    .header {
      position: absolute;
      top: 25px;
      left: 35px;
      right: 35px;
      background: rgba(30, 41, 59, 0.95);
      border: 2px solid #06B6D4;
      border-radius: 16px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      color: #38BDF8;
      letter-spacing: 0.5px;
    }
    .sub {
      font-size: 14px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .badge {
      background: #06B6D4;
      color: #042F2E;
      font-weight: 800;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .canvas-container {
      position: absolute;
      top: 130px;
      left: 35px;
      right: 35px;
      bottom: 110px;
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .footer {
      position: absolute;
      bottom: 25px;
      left: 35px;
      right: 35px;
      height: 65px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #1E293B;
      border-radius: 12px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      font-size: 13px;
      color: #CBD5E1;
    }
    .footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">TEMPOROMANDIBULAR JOINT (TMJ) — SAGITTAL RELATIONS</div>
      <div class="sub">Bilateral Synovial Condylar Joint • Fibrocartilaginous Disc • Bicompartmental Mechanics</div>
    </div>
    <div class="badge">ANATOMY EXAM DIAGRAM</div>
  </div>

  <div class="canvas-container">
    <svg width="1100" height="900" viewBox="0 0 1100 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="boneGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FEF3C7" />
          <stop offset="100%" stop-color="#D97706" />
        </radialGradient>
        <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#67E8F9" />
          <stop offset="100%" stop-color="#0284C7" />
        </radialGradient>
        <linearGradient id="muscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F87171" />
          <stop offset="100%" stop-color="#DC2626" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Grid Background lines subtle -->
      <g stroke="#1E293B" stroke-width="1" stroke-dasharray="4 4">
        <line x1="100" y1="200" x2="1000" y2="200" />
        <line x1="100" y1="450" x2="1000" y2="450" />
        <line x1="100" y1="700" x2="1000" y2="700" />
      </g>

      <!-- Temporal Bone (Articular Fossa & Eminence) -->
      <path d="M 250 240 Q 380 230 450 310 Q 520 370 650 370 Q 750 360 850 260 L 850 160 L 250 160 Z"
            fill="#FDE68A" stroke="#B45309" stroke-width="4" opacity="0.95" />
      
      <!-- Articular Cartilage (Fibrocartilage Layer) -->
      <path d="M 270 240 Q 380 235 450 315 Q 520 375 650 375 Q 750 365 830 270"
            fill="none" stroke="#06B6D4" stroke-width="6" stroke-linecap="round" />

      <!-- Intra-Articular Disc (Biconcave Fibrocartilaginous Meniscus) -->
      <!-- Anterior Extension, Anterior Thick Band, Intermediate Thin Zone, Posterior Thick Band, Bilaminar Pad -->
      <path d="M 330 350 Q 420 320 500 370 Q 560 395 620 380 Q 720 330 780 340 Q 790 370 740 400 Q 640 420 560 415 Q 480 405 400 380 Q 340 370 330 350 Z"
            fill="url(#discGrad)" stroke="#38BDF8" stroke-width="3" filter="url(#glow)" opacity="0.95" />

      <!-- Bilaminar Retrodiscal Pad (Posterior Attachment) -->
      <path d="M 750 350 C 820 330 850 280 870 270" fill="none" stroke="#F43F5E" stroke-width="4" stroke-dasharray="3 3" />
      <path d="M 740 400 C 800 420 830 460 850 490" fill="none" stroke="#F43F5E" stroke-width="4" stroke-dasharray="3 3" />

      <!-- Mandibular Condyle (Head of Mandible) -->
      <path d="M 440 580 C 420 480 470 420 560 420 C 650 420 700 480 670 580 C 650 640 640 740 630 820 L 510 820 C 490 740 460 640 440 580 Z"
            fill="#FEF3C7" stroke="#D97706" stroke-width="4" />
      
      <!-- Condylar Fibrocartilage -->
      <path d="M 460 455 C 500 425 560 420 620 435 C 650 450 660 470 665 490"
            fill="none" stroke="#06B6D4" stroke-width="6" stroke-linecap="round" />

      <!-- Lateral Pterygoid Muscle: Superior & Inferior Heads -->
      <!-- Superior Head -> Articular Disc -->
      <path d="M 120 320 L 330 350 L 340 370 L 120 350 Z" fill="url(#muscleGrad)" stroke="#B91C1C" stroke-width="2" />
      <!-- Inferior Head -> Pterygoid Fovea (Neck of Mandible) -->
      <path d="M 120 450 L 460 560 L 450 600 L 120 500 Z" fill="url(#muscleGrad)" stroke="#B91C1C" stroke-width="2" />

      <!-- Joint Capsule / Synovial Cavities -->
      <!-- Upper Meniscotemporal Cavity -->
      <text x="530" y="340" fill="#38BDF8" font-size="14" font-weight="700">Upper Synovial Cavity (Gliding)</text>
      <!-- Lower Meniscomandibular Cavity -->
      <text x="480" y="470" fill="#67E8F9" font-size="14" font-weight="700">Lower Synovial Cavity (Hinge)</text>

      <!-- LABELS AND LEADER LINES -->
      
      <!-- 1. Articular Tubercle / Eminence -->
      <line x1="430" y1="290" x2="350" y2="180" stroke="#FDE68A" stroke-width="2" />
      <circle cx="430" cy="290" r="4" fill="#F59E0B" />
      <rect x="180" y="145" width="220" height="40" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
      <text x="195" y="170" fill="#FEF3C7" font-size="14" font-weight="bold">Articular Eminence</text>

      <!-- 2. Mandibular Fossa -->
      <line x1="620" y1="360" x2="680" y2="240" stroke="#FDE68A" stroke-width="2" />
      <circle cx="620" cy="360" r="4" fill="#F59E0B" />
      <rect x="685" y="220" width="200" height="40" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
      <text x="700" y="245" fill="#FEF3C7" font-size="14" font-weight="bold">Mandibular Fossa</text>

      <!-- 3. Intra-Articular Disc (Meniscus) -->
      <line x1="560" y1="400" x2="680" y2="440" stroke="#38BDF8" stroke-width="2" />
      <circle cx="560" cy="400" r="4" fill="#38BDF8" />
      <rect x="685" y="420" width="250" height="44" rx="8" fill="#042F2E" stroke="#06B6D4" stroke-width="1.5" />
      <text x="700" y="447" fill="#67E8F9" font-size="14" font-weight="bold">Articular Disc (Fibrocartilage)</text>

      <!-- 4. Bilaminar Retrodiscal Pad -->
      <line x1="770" y1="370" x2="860" y2="360" stroke="#F43F5E" stroke-width="2" />
      <circle cx="770" cy="370" r="4" fill="#F43F5E" />
      <rect x="865" y="340" width="210" height="40" rx="8" fill="#1E293B" stroke="#F43F5E" stroke-width="1.5" />
      <text x="875" y="365" fill="#FDA4AF" font-size="13" font-weight="bold">Retrodiscal Pad (Vascular)</text>

      <!-- 5. Head of Mandible (Condyle) -->
      <line x1="560" y1="520" x2="720" y2="560" stroke="#F59E0B" stroke-width="2" />
      <circle cx="560" cy="520" r="4" fill="#F59E0B" />
      <rect x="725" y="540" width="210" height="40" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
      <text x="740" y="565" fill="#FEF3C7" font-size="14" font-weight="bold">Head of Mandible (Condyle)</text>

      <!-- 6. Neck of Mandible -->
      <line x1="570" y1="680" x2="720" y2="680" stroke="#F59E0B" stroke-width="2" />
      <circle cx="570" cy="680" r="4" fill="#F59E0B" />
      <rect x="725" y="660" width="200" height="40" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
      <text x="740" y="685" fill="#FEF3C7" font-size="14" font-weight="bold">Neck of Mandible</text>

      <!-- 7. Lateral Pterygoid (Superior Head) -->
      <line x1="220" y1="330" x2="160" y2="280" stroke="#F87171" stroke-width="2" />
      <circle cx="220" cy="330" r="4" fill="#EF4444" />
      <rect x="40" y="255" width="230" height="42" rx="8" fill="#1E293B" stroke="#EF4444" stroke-width="1.5" />
      <text x="50" y="281" fill="#FCA5A5" font-size="13" font-weight="bold">Lateral Pterygoid (Upper Head)</text>

      <!-- 8. Lateral Pterygoid (Inferior Head) -->
      <line x1="240" y1="480" x2="160" y2="520" stroke="#F87171" stroke-width="2" />
      <circle cx="240" cy="480" r="4" fill="#EF4444" />
      <rect x="40" y="500" width="230" height="42" rx="8" fill="#1E293B" stroke="#EF4444" stroke-width="1.5" />
      <text x="50" y="526" fill="#FCA5A5" font-size="13" font-weight="bold">Lateral Pterygoid (Lower Head)</text>

      <!-- 9. APPLIED BOX: Anterior Dislocation -->
      <rect x="80" y="680" width="370" height="150" rx="12" fill="#1E1B4B" stroke="#818CF8" stroke-width="2" />
      <text x="95" y="708" fill="#A5B4FC" font-size="15" font-weight="800">⚡ APPLIED ANATOMY: DISLOCATION</text>
      <text x="95" y="735" fill="#E2E8F0" font-size="13">1. Excessive opening (yawn/trauma) causes condyle</text>
      <text x="95" y="755" fill="#E2E8F0" font-size="13">   to slide anterior to Articular Eminence.</text>
      <text x="95" y="780" fill="#38BDF8" font-size="13">2. Locked Jaw in depression by Masseter spasm.</text>
      <text x="95" y="805" fill="#4ADE80" font-size="13">3. Reduction: Downward & backward pressure on molars.</text>
    </svg>
  </div>

  <div class="footer">
    <div class="footer-item">
      <div class="dot" style="background:#06B6D4;"></div>
      <span><strong>Upper Cavity:</strong> Menisco-temporal (Translation/Gliding)</span>
    </div>
    <div class="footer-item">
      <div class="dot" style="background:#38BDF8;"></div>
      <span><strong>Lower Cavity:</strong> Menisco-mandibular (Rotation/Hinge)</span>
    </div>
    <div class="footer-item">
      <div class="dot" style="background:#F59E0B;"></div>
      <span><strong>Articular Surfaces:</strong> Avascular Fibrocartilage</span>
    </div>
    <div class="footer-item">
      <div class="dot" style="background:#EF4444;"></div>
      <span><strong>Nerve Supply:</strong> Auriculotemporal & Masseteric (V3)</span>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync("/tmp/tmj_diagram.html", tmjHtml);

const outJpg = "/tmp/temporomandibular_joint_tmj_sagittal.jpg";
cp.execSync(`"${chromeBin}" --headless --disable-gpu --user-data-dir="/tmp/chrome_tmj_data" --screenshot="${outJpg}" --window-size=1200,1200 /tmp/tmj_diagram.html`);

console.log("Rendered TMJ Diagram screenshot to:", outJpg);

async function upload() {
  const fileBuffer = fs.readFileSync(outJpg);
  const storagePath = "anatomy/temporomandibular_joint_tmj_sagittal.jpg";
  console.log("Uploading to Supabase storage:", storagePath);

  const { error: upErr } = await supabase.storage
    .from("diagrams")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true
    });

  if (upErr) {
    console.error("Upload error:", upErr);
    return;
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/diagrams/${storagePath}`;
  console.log("SUCCESS! Public URL:", publicUrl);

  const { data: dbData, error: dbErr } = await supabase
    .from("question_diagrams")
    .update({
      public_url: publicUrl,
      storage_path: storagePath,
      status: "completed",
      reviewed: true
    })
    .ilike("question_text", "%Temporomandibular%");

  if (dbErr) console.error("DB update error:", dbErr);
  else console.log("Updated question_diagrams table for Temporomandibular joint!");
}

upload();

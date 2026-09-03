const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pmtgeydtqypwrypshhsx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";
const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  const outJpg = "/tmp/temporomandibular_joint_tmj_sagittal.jpg";
  const fileBuffer = fs.readFileSync(outJpg);
  const storagePath = "anatomy/temporomandibular_joint_tmj_sagittal.jpg";
  console.log("Uploading TMJ image to Supabase Storage:", storagePath);

  const { error: upErr } = await supabase.storage
    .from("diagrams")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true
    });

  if (upErr) {
    console.error("Upload error:", upErr);
    process.exit(1);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/diagrams/${storagePath}`;
  console.log("Uploaded successfully! Public URL:", publicUrl);

  // Update question_diagrams for Temporomandibular joint
  const { error: qErr } = await supabase
    .from("question_diagrams")
    .update({
      public_url: publicUrl,
      storage_path: storagePath,
      status: "completed",
      reviewed: true
    })
    .ilike("question_text", "%Temporomandibular%");

  if (qErr) console.error("question_diagrams update error:", qErr);
  else console.log("Updated question_diagrams table for TMJ!");

  // Clean up any incorrect handwritten_notes row that had Shoulder joint attached
  const { data: notes, error: fetchErr } = await supabase
    .from("handwritten_notes")
    .select("subtopic_key, content")
    .ilike("subtopic_name", "%Temporomandibular%");

  if (notes && notes.length > 0) {
    for (const note of notes) {
      if (note.content && note.content.sections) {
        // Replace or remove any wrong shoulder joint section
        const cleanedSections = note.content.sections.filter(s => {
          if (s.title === "High-Yield Visual Exam Diagram" || s.icon === "🎨") {
            const txt = JSON.stringify(s.payload || "");
            return !txt.includes("shoulder");
          }
          return true;
        });

        // Add the correct TMJ diagram section
        const tmjSection = {
          type: "definition",
          title: "High-Yield Visual Exam Diagram",
          icon: "🎨",
          payload: {
            text: `![Temporomandibular Joint (TMJ) - Sagittal Relations](${publicUrl})\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)`
          }
        };

        const updatedContent = {
          ...note.content,
          diagramUrl: publicUrl,
          sections: [tmjSection, ...cleanedSections]
        };

        await supabase
          .from("handwritten_notes")
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq("subtopic_key", note.subtopic_key);

        console.log("Updated cached handwritten_notes for:", note.subtopic_key);
      }
    }
  }
}

main();

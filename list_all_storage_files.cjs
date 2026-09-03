const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pmtgeydtqypwrypshhsx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";
const supabase = createClient(supabaseUrl, anonKey);

async function listFiles(folder) {
  const { data, error } = await supabase.storage.from("diagrams").list(folder, { limit: 100 });
  if (error) {
    console.error("Error listing " + folder + ":", error);
    return [];
  }
  return (data || []).map(f => `${folder}/${f.name}`);
}

async function main() {
  const folders = ["anatomy", "physiology", "biochemistry", "pathology", "pharmacology", "microbiology", "community", "forensic"];
  let allFiles = [];
  for (const f of folders) {
    const list = await listFiles(f);
    allFiles.push(...list);
  }
  console.log(`Total diagrams in Supabase storage: ${allFiles.length}`);
  console.log(JSON.stringify(allFiles, null, 2));
}

main();

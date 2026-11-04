// RN-web navigation contract: actual Notes/Simulator screens, mocked native surfaces.
// Verifies route selection, persisted theme and Back; does not certify native rendering.
import { fileURLToPath } from "node:url";
import { createServer } from "../mobile/node_modules/vite/dist/node/index.js";
import { chromium } from "../mobile/node_modules/playwright-core/index.mjs";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../mobile", import.meta.url));
const plugin = {
  name: "vault-native-navigation-contract",
  enforce: "pre",
  resolveId(id) {
    if (id === "virtual:vault-native-entry") return "\0vault-native-entry";
    if (id.endsWith("/shims/local-simulator.tsx"))
      return "\0vault-renderer-probe";
    if (/\/NativeEcgTwelveLead(?:\.tsx)?$/.test(id)) return "\0vault-ecg-probe";
    if (/\/NativeRadiologyViewer(?:\.tsx)?$/.test(id))
      return "\0vault-radiology-probe";
  },
  load(id) {
    if (id === "\0vault-native-entry")
      return `import React from 'react';import{createRoot}from'react-dom/client';import{SafeAreaProvider}from'react-native-safe-area-context';import{NavigationContainer}from'@react-navigation/native';import{createBottomTabNavigator}from'@react-navigation/bottom-tabs';import{ThemeProvider}from'@/theme';import Notes from'@/screens/NotesScreen';import{hydrateProfile}from'@/hooks/useProfile';void hydrateProfile().catch(()=>{});const Tab=createBottomTabNavigator();createRoot(document.getElementById('root')).render(React.createElement(ThemeProvider,null,React.createElement(SafeAreaProvider,{initialMetrics:{frame:{x:0,y:0,width:390,height:844},insets:{top:0,bottom:0,left:0,right:0}}},React.createElement(NavigationContainer,null,React.createElement(Tab.Navigator,{screenOptions:{headerShown:false}},React.createElement(Tab.Screen,{name:'Notes',component:Notes}))))));`;
    if (id === "\0vault-renderer-probe")
      return `import React,{useEffect}from'react';import{View,Text,Pressable}from'react-native';export default function Probe(props){useEffect(()=>props.onStatus({nativeEvent:{status:'ready'}}),[]);return React.createElement(View,{style:{flex:1,padding:20}},React.createElement(Text,{testID:'native-route-probe'},props.route),React.createElement(Pressable,{accessibilityLabel:'Return from native tool',onPress:()=>props.onStatus({nativeEvent:{status:'exit'}})},React.createElement(Text,null,'Back')));}`;
    if (id === "\0vault-ecg-probe" || id === "\0vault-radiology-probe")
      return `import React from'react';import{View,Text,Pressable}from'react-native';export default function Probe(props){return React.createElement(View,{style:{flex:1,padding:20}},React.createElement(Text,{testID:'native-view-probe'},JSON.stringify({tool:'${
        id.includes("ecg") ? "ecg12" : "radiology"
      }',scenario:props.scenarioId,theme:props.theme})),React.createElement(Pressable,{accessibilityLabel:'Return from native tool',onPress:props.onBack},React.createElement(Text,null,'Back')));}`;
  },
  transform(code, id) {
    if (id.endsWith("/screens/NotesScreen.tsx"))
      return code.replaceAll("Platform.OS", "'android'");
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== "/__vault-native") return next();
      res.setHeader("Content-Type", "text/html");
      void server
        .transformIndexHtml(
          req.url,
          '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;height:100%;display:flex;flex:1;flex-direction:column}</style></head><body><div id="root"></div><script type="module" src="/@id/__x00__vault-native-entry"></script></body></html>'
        )
        .then((html) => res.end(html))
        .catch(next);
    });
  },
};
const server = await createServer({
  configFile: root + "/preview/vite.config.ts",
  plugins: [plugin],
  server: { port: 5270, strictPort: true, host: "127.0.0.1" },
  logLevel: "error",
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await context.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:5270"
      ? r.continue()
      : r.abort()
  );
  await context.addInitScript(() => {
    localStorage.setItem(
      "orbit-profile-v1",
      JSON.stringify({
        display_name: "Native route contract",
        year: "second",
        university: "tnmgr",
        preparationGoal: "both",
      })
    );
    localStorage.setItem("orbit-simulator-theme", "light");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("HARNESS PAGE ERROR", e.message);
  });
  await page.goto("http://127.0.0.1:5270/__vault-native");
  for (const [title, id] of [
    ["Auscultation", "stethoscope"],
    ["12-lead ECG", "ecg12"],
    ["Ultrasound / POCUS", "ultrasound"],
    ["X-ray & MRI", "radiology"],
    ["Eyes & cranial nerves", "pupil"],
    ["General examination", "piccled"],
  ]) {
    const card = page.getByTestId("vault-card-" + title);
    await card.waitFor();
    await card.click();
    if (id === "ecg12" || id === "radiology") {
      const probe = page.getByTestId("native-view-probe");
      await probe.waitFor();
      const p = JSON.parse(await probe.textContent());
      assert.equal(p.tool, id);
      assert.equal(p.theme, "light");
      if (id === "ecg12") assert.equal(p.scenario, "normal");
    } else {
      const probe = page.getByTestId("native-route-probe");
      await probe.waitFor();
      const url = new URL(
        await probe.textContent(),
        "https://orbitmbbs.vercel.app"
      );
      assert.equal(url.searchParams.get("tool"), id);
      assert.equal(url.searchParams.get("scenario"), "normal");
      assert.equal(url.searchParams.get("nativeTheme"), "light");
    }
    await page.getByLabel("Return from native tool", { exact: true }).click();
    await page.getByTestId("vault-card-" + title).waitFor();
    console.log(
      "PASS native-route contract " + id + " / saved theme / Back to Vault"
    );
  }
  await page.getByTestId("vault-card-Simulator & Anatomy").click();
  await page.getByLabel("Explore 3D anatomy", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS original studio entry remains available after direct tool exits (mock native surfaces; no device-rendering claim)."
  );
} finally {
  await browser.close();
  await server.close();
}

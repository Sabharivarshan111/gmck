/** Exercise the emitted native web app, with no real accounts or provider calls. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.ORBIT_UNIVERSITY_BASE_URL || 'http://127.0.0.1:4184';
const browser = await chromium.launch({ headless: true, executablePath: process.env.ORBIT_BROWSER_EXECUTABLE || undefined, args: ['--no-sandbox'] });
const results = [];
try {
  for (const width of [360, 430]) {
    for (const fixture of [
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "Define and classify Cirrhosis. Discuss the pathology", "topic": "Liver, Gallbladder and Pancreas", "reference": "Dec 2018"},
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "Antigen Antibody reactions. Describe Agglutination", "topic": "Immunology", "reference": "Dec 2018"},
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "Define Identification. Describe in detail about Tattoo Marks.", "topic": "Identification", "reference": "Jun 2016"},
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "Classify beta-adrenergic blocking drugs. Write therapeutic uses", "topic": "Autonomic Nervous System", "reference": "Jun 2016"},
      {"university": "rguhs", "year": "third", "yearKey": "third-year", "query": "Discuss design, conduct and analysis of a Cohort study", "topic": "Principles & Methods Of Epidemiology", "reference": "19 Nov 2020"},
      {"university": "rguhs", "year": "third", "yearKey": "third-year", "query": "Describe the anatomy of lateral wall of nose. Describe the types", "topic": "Nose", "reference": "26 Nov 2020"},
      {"university": "rguhs", "year": "third", "yearKey": "third-year", "query": "management of Acute Iridocyclitis", "topic": "Diseases of uveal tract", "reference": "16 Dec 2019"},

      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'distribution and applied Anatomy of Ulnar', topic: 'Upper Limb', reference: '24 Sep 2025' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'roots, trunks and cords', topic: 'Upper Limb', reference: 'Jul 2019', option: '(b) Parts (roots, trunks and cords)' },
      { university: 'ntruhs', year: 'first', yearKey: 'first-year', query: 'respiratory chain', topic: 'Bioenergetics', reference: 'Oct/Nov 2018' },
      { university: 'wbuhs', year: 'second', yearKey: 'second-year', query: 'osteolytic', topic: 'Haematology', reference: '2017' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Taking commissions', topic: 'Thermal Injuries', reference: 'Apr 2026', option: '(c) Taking commissions from pharmaceutical companies' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Schwalbe', topic: 'Diseases of cornea', reference: 'Apr 2026', option: '(d) Descemet’s membrane' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Corrected effective temperature', topic: 'Environment & Health', reference: 'Nov 2025', option: '(a) < 20℃' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'LAQSHYA', topic: 'Health Programmes', reference: 'Apr 2026', option: '(d) Quality of care in labor room and maternity operation theatres' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Aniridia', topic: 'Diseases of uveal tract', reference: 'Apr 2026', option: '(c) Absence of ciliary body' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'amiodarone', topic: 'Endocrinology', reference: 'May 2024', option: "(d) De Quervain's thyroiditis" },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Heart Failure', topic: 'Cardiology', reference: 'Apr 2026', option: 'Describe the aetiology, clinical features, investigation and management of Heart Failure.', section: 'Part B · Essay / Long Answer Questions' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: '30 % deep burn surface area', topic: 'Shock, Burns and Trauma', reference: 'Apr 2026', option: '30 % deep burn surface area' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Colour Codes', topic: 'Shock, Burns and Trauma', reference: 'Jun 2025', option: '(a) 1-A, 2-C, 3-D, 4-B' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Intracapsular', topic: 'Trauma and fractures', reference: 'May 2024', option: '(1+1+1+2+3+2+3+2)', section: 'Part B · Essay / Long Answer Questions' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Ponderal index', topic: 'Growth and development', reference: 'Apr 2026', option: '(d) Weight in gms / height in cm³' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'prepare for Resuscitation', topic: 'Newborn infants', reference: 'May/Jun 2024', option: '(7+8)' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'cardinal movements', topic: 'Physiology of labor', reference: 'Apr 2026', option: '(b) Engagement, descent, flexion, internal rotation, extension, external rotation, restitution, expulsion' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Maximum function of corpus luteum occurs', topic: 'Anat, physio and development', reference: 'May 2024', option: '(c) 3 days after ovulation' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'Antidote kits for cyanide poisoning contain', topic: 'Bioenergetics', reference: 'Nov 2025', option: '(d) Both A and B' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: '380 mg%', topic: 'Organ function tests', reference: 'Sep 2025', option: '(3+5+3+4)' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'Suicidal enzyme', topic: 'Enzymology', reference: 'Nov 2024', option: '(d) 5- Nucleosidase' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'mammary gland under these headings', topic: 'Upper Limb', reference: 'Nov 2024', option: 'f) Applied aspects. (2+3+2+2+3+3)' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'His hands and feet have been growing', topic: 'Endocrine Physiology', reference: 'Sep 2025', option: 'e) What could be the cause for visual defect.' },
      { university: 'knruhs', year: 'second', yearKey: 'second-year', query: 'Treatmet of choice', topic: 'Autonomic Nervous System', reference: 'Jan 2026', option: '(c) Adrenalin 0.5ml 1:10000 solution by im' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'amikacin', topic: 'Ear', reference: 'Apr 2026', option: 'C) Outline the appropriate further management for this patient.' },
      { university: 'knruhs', year: 'second', yearKey: 'second-year', query: 'Concurrent use of the following drug', topic: 'Hormones', reference: 'Jun 2025', option: '(b) Rifampicin' },
      { university: 'knruhs', year: 'second', yearKey: 'second-year', query: 'hair on end appearance', topic: 'Red Blood Cells', reference: 'Jan 2026', option: '(2+7+6)' },
      { university: 'knruhs', year: 'second', yearKey: 'second-year', query: 'Granular contracted Kidney', topic: 'Kidney', reference: 'Jun 2025', option: '(d) Benign hypertension' },
      { university: 'knruhs', year: 'second', yearKey: 'second-year', query: 'non cultivable mycobacteria', topic: 'Bacteriology', reference: 'Jan 2026', option: '(c) M bovis' },
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'coenzyme forms and biochemical functions of folic', topic: 'Vitamins', reference: '06 Oct 2025', option: 'Or Creatinine clearance test' },
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: '0.85:1', topic: 'Chemistry of amino acids and proteins', reference: '13 Dec 2024', option: '5.0 g/dl; 2.3 g/dl; 0.85:1' },
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'Space of Retzius is related', topic: 'Abdomen and Pelvis', reference: '27 Apr 2023', option: '(D) Rectum' },
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'Most common site of lesion to the pyramidal', topic: 'Central Nervous System', reference: '02 May 2023', option: '(D) Medulla' },
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'positive, chvostek', topic: 'Minerals', reference: '17 Feb 2021', option: 'd. Mention any 6 biochemical functions' },
      { university: 'rguhs', year: 'second', yearKey: 'second-year', query: 'papulovesicular lesions over', topic: 'Bacteriology', reference: '25 Aug 2025', option: 'c) Describe laboratory investigations' },
      { university: 'rguhs', year: 'second', yearKey: 'second-year', query: 'metal sharp waste', topic: 'Hospital Infection Control', reference: '25 Aug 2025', option: '(D) White' },
      { university: 'rguhs', year: 'second', yearKey: 'second-year', query: 'Blood grouping in Disputed paternity', topic: 'Blood Stains, Artefacts, FS Laboratory', reference: '23 Aug 2024' },
      { university: 'rguhs', year: 'second', yearKey: 'second-year', query: 'coronary artery disease', topic: 'Hormones', reference: '04 Mar 2022', option: '(C) Elderly patients with coronary artery disease' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'Monks hood', topic: 'Toxicology', reference: '24 Nov 2025', option: '(D) Aconite' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'plant twig while working', topic: 'Diseases of cornea', reference: '29 Sep 2025', option: 'e) Discuss the treatment of the above condition' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'kerosene like odour', topic: 'Toxicology', reference: '24 Nov 2025', option: 'e) Create a treatment plan for this case.' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'lighthouse sign', topic: 'Ear', reference: '21 Nov 2025', option: 'd) How will you treat this patient?' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'Gradenigo triad', topic: 'Ear', reference: '24 Jan 2025', option: '(C) VII nerve involvement' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'stomach wash in a case of poisoning EXCEPT', topic: 'Toxicology', reference: '20 Jan 2025', option: '(D) Organophosphorous Poisons' },
      { university: 'rguhs', year: 'third', yearKey: 'third-year', query: 'Prostaglandin analogue', topic: 'Glaucoma', reference: '04 Mar 2022', option: 'mechanism of action and two important side effects' },
      { university: 'rguhs', year: 'final', yearKey: 'final-year', query: 'early breast cancer', topic: 'Breast', reference: '06 Oct 2025', option: 'Or Classify renal tumours.' },
      { university: 'rguhs', year: 'final', yearKey: 'final-year', query: 'Pyrogenic meningitis', topic: 'CNS', reference: '24 Sep 2025', option: 'Cerebro spinal fluid findings' },
      { university: 'rguhs', year: 'final', yearKey: 'final-year', query: 'Triad of GERD', topic: 'Esophagus and stomach', reference: '19 Aug 2024', option: 'Triad of GERD.' },
      {"university": "rguhs", "year": "final", "yearKey": "final-year", "query": "Rodent ulcer", "topic": "Neoplasm and others", "reference": "27 Mar 2021", "option": "Rodent ulcer."},
      {"university": "knruhs", "year": "first", "yearKey": "first-year", "query": "Cadaver as the first teacher", "topic": "General Anatomy", "reference": "Aug 2024"},
      {"university": "knruhs", "year": "first", "yearKey": "first-year", "query": "radio ulnar joint", "topic": "Upper Limb", "reference": "Aug 2024"},
      {"university": "knruhs", "year": "first", "yearKey": "first-year", "query": "distal phalangeal joints", "topic": "Nucleotide metabolism", "reference": "Nov 2023", "option": "serum - 12 mg/dL"},
      {"university": "knruhs", "year": "first", "yearKey": "first-year", "query": "Motor end plate", "topic": "Nerve and Muscle Physiology", "reference": "Mar 2022"},
      {"university": "knruhs", "year": "second", "yearKey": "second-year", "query": "Current drug of choice for Enteric fever", "topic": "Bacteriology", "reference": "Jul 2024", "option": "(e) Ceftriaxone"},
      {"university": "ntruhs", "year": "second", "yearKey": "second-year", "query": "Vi antigen how", "topic": "Bacteriology", "reference": "Dec 2022", "option": "List the vaccine available"},
      {"university": "knruhs", "year": "second", "yearKey": "second-year", "query": "formation of Thrombus", "topic": "Hemodynamic Disorders", "reference": "Feb 2022"},
      {"university": "ntruhs", "year": "third", "yearKey": "third-year", "query": "Sluder", "topic": "Nose", "reference": "Feb 2019"},
      {"university": "knruhs", "year": "third", "yearKey": "third-year", "query": "arytenoid cartilages", "topic": "Larynx and trachea", "reference": "Jan 2024", "option": "(a) One- Voice Articulation"},
      {"university": "ntruhs", "year": "third", "yearKey": "third-year", "query": "Minimum requirements at PHC", "topic": "Health Care Of Community", "reference": "Jan 2015"},
      {"university": "knruhs", "year": "third", "yearKey": "third-year", "query": "Proximate principle", "topic": "Nutrition And Health", "reference": "Mar 2023"},
      {"university": "knruhs", "year": "final", "yearKey": "final-year", "query": "Wolf-Chaikoff", "topic": "Endocrinology", "reference": "Feb 2025", "option": "(b) Excessive iodine"},
      {"university": "ntruhs", "year": "first", "yearKey": "first-year", "query": "1st lumbrical", "topic": "Upper Limb", "reference": "Aug 2024", "option": "(d) Anterior interosseous nerve"},
      {"university": "ntruhs", "year": "first", "yearKey": "first-year", "query": "circadian rhythm", "topic": "Central Nervous System", "reference": "Aug 2024", "option": "(c) Suprachiasmatic nucleus"},
      {"university": "ntruhs", "year": "second", "yearKey": "second-year", "query": "Empathy towards patients", "topic": "General Microbiology", "reference": "Jan 2024"},
      {"university": "ntruhs", "year": "second", "yearKey": "second-year", "query": "hepatic CYP microsomal", "topic": "General Pharmacology", "reference": "Aug 2021"},
      {"university": "ntruhs", "year": "third", "yearKey": "third-year", "query": "intersectorial approach", "topic": "Epidemiology Of Non-Communicable Diseases", "reference": "Aug 2011"},
      {"university": "ntruhs", "year": "second", "yearKey": "second-year", "query": "Transferable bacterial drug resistance", "topic": "General Microbiology", "reference": "Jan 2016"},
      {"university": "ntruhs", "year": "third", "yearKey": "third-year", "query": "Submandibular Sialadenitis", "topic": "Oral cavity and salivary gland", "reference": "Aug 2021"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "Schuffner", "topic": "Infective Diseases", "reference": "Jun–Jul 2026", "option": "(d) Plasmodium knowlesi"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "Nasolacrimal duct is directed", "topic": "Lacrimal apparatus", "reference": "Apr 2026", "option": "(d) Downwards, medially, forwards"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "endometriosis can affect fertility", "topic": "Benign condition in gynec", "reference": "Mar–Apr 2025"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "terminally ill patients and family", "topic": "Ageing, Onco & Others", "reference": "Mar–Apr 2026"},
      {"university": "wbuhs", "year": "first", "yearKey": "first-year", "query": "TSH", "topic": "Endocrine Physiology", "reference": "Oct–Nov 2025", "option": "(d) A diagnosis of whether this is a patient of primary or secondary Hypothyroidism cannot be made from this report."},
      {"university": "wbuhs", "year": "second", "yearKey": "second-year", "query": "Which of the following is not true of Staphylococcus aureus food poisoning?", "topic": "Bacteriology", "reference": "Jan–Feb 2026", "option": "(d) Type A toxin is responsible for most cases"},
      {"university": "wbuhs", "year": "third", "yearKey": "third-year", "query": "Diagnostic power of screening", "topic": "Principles & Methods Of Epidemiology", "reference": "Jun 2025", "option": "(c) Predictive value"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "Wolfe graft", "topic": "Operative surgery and others", "reference": "Mar–Apr 2025", "option": "(d) Full split thickness graft"},
      {"university": "wbuhs", "year": "second", "yearKey": "second-year", "query": "diabetic 60 year old", "topic": "Hospital Infection Control", "reference": "Mar–Apr 2024"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "ovarian germ cell", "topic": "Gynecological malignancies", "reference": "Mar–Apr 2024", "option": "(iv) CEA"},
      {"university": "wbuhs", "year": "final", "yearKey": "final-year", "query": "external factor of bladder cancer", "topic": "Urology", "reference": "Mar–Apr 2024", "option": "(d) Cyclophosphamide"},
      {"university": "wbuhs", "year": "first", "yearKey": "first-year", "query": "7.72", "topic": "Maintenance of ph and acid base disorders", "reference": "Nov–Dec 2023"},
      {"university": "wbuhs", "year": "first", "yearKey": "first-year", "query": "palpable bony lump", "topic": "Upper Limb", "reference": "Nov–Dec 2024"},
      {"university": "wbuhs", "year": "third", "yearKey": "third-year", "query": "venomous snake bite", "topic": "Toxicology", "reference": "Aug–Sep 2026"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "lateral ventricle to third ventricle", "topic": "Neuroanatomy", "reference": "09-Aug-2024", "option": "(D) Foramen of Munro"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "dissociated anaesthesia", "topic": "Central Nervous System", "reference": "26-Nov-2020"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "phenylalanine and tyrosine", "topic": "Protein metabolism", "reference": "Jul 2019"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "coastal groove", "topic": "Thorax", "reference": "Dec 2014"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "law of projection", "topic": "Special Senses", "reference": "Jun–Jul 2011"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "orotic aciduria", "topic": "Nucleotide metabolism", "reference": "Jun–Jul 2011", "option": "biochemical basis of manifestation"},
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "past history of pharyngitis", "topic": "Heart", "reference": "13 Dec 2019", "option": "Enumerate the complications associated with this condition."},
      {"university": "rguhs", "year": "second", "yearKey": "second-year", "query": "α blockers", "topic": "Autonomic Nervous System", "reference": "27 Nov 2020"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "Classify carbohydrates with two examples", "topic": "Carbohydrate chemistry", "reference": "Jul 2019"},
      {"university": "rguhs", "year": "first", "yearKey": "first-year", "query": "Oncogenes", "topic": "Molecular biology", "reference": "Jul 2019"},
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 780 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      await context.addInitScript(f => {
        if (!localStorage.getItem('orbit-profile-v1')) localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Import test', year: f.year, university: f.university }));
        localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
      }, fixture);
      const page = await context.newPage();
      const errors = [];page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/browse/${fixture.yearKey}`);
      await page.getByText(`${fixture.university.toUpperCase()} Question Bank`, { exact: true }).waitFor();
      await page.getByPlaceholder('Search all questions…').fill(fixture.query);
      // Real repetitions across exams need their own dated result, not the first matching chapter.
      const switcher = page.getByLabel(`Switch to ${fixture.topic}`, { exact: true })
        .locator('..').filter({ hasText: fixture.reference })
        .getByLabel(`Switch to ${fixture.topic}`, { exact: true });
      await switcher.waitFor();await switcher.click();
      await page.getByText(fixture.reference, { exact: false }).filter({ visible: true }).first().waitFor();
      if (fixture.option) await page.getByText(fixture.option, { exact: false }).filter({ visible: true }).first().waitFor();
      if (fixture.section) await page.getByText(fixture.section, { exact: false }).filter({ visible: true }).first().waitFor();
      assert.ok(!(await page.locator('body').innerText()).includes('PYQ['), 'Internal source marker leaked into UI');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Horizontal overflow');
      assert.deepEqual(errors, []);
      results.push({ width, university: fixture.university, query: fixture.query, searchAndChapterAndReference: 'passed' });
      if (width === 360 && fixture.query === 'past history of pharyngitis') { fs.mkdirSync('artifacts/university-import',{recursive:true});await page.getByText(fixture.option, {exact:false}).filter({visible:true}).first().scrollIntoViewIfNeeded();await page.waitForTimeout(250);await page.screenshot({path:'artifacts/university-import/batch18-case-360.png'}); }
      console.log('PASS chapter/reference', width, fixture.university, fixture.query);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('orbit-profile-v1')) localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Picker test', year: 'first', university: 'rguhs' }));
    localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
  });
  const page = await context.newPage();await page.goto(base);
  await page.getByLabel('Settings', { exact: true }).click();
  await page.getByLabel('University: Karnataka · RGUHS. Change university', { exact: true }).click();
  const radios = page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio');await radios.first().waitFor();
  assert.equal(await radios.count(), 8);
  assert.equal(await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /Maharashtra University/ }).getAttribute('aria-disabled'), 'true');
  await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /West Bengal University/ }).scrollIntoViewIfNeeded();
  await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /West Bengal University/ }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('orbit-profile-v1') || '{}').university === 'wbuhs');
  await page.goto(`${base}/browse/second-year`);
  await page.getByText('WBUHS Question Bank', { exact: true }).waitFor();
  results.push({ width: 360, height: 640, scrollableUniversityPickerAndPersistence: 'passed' });
  await context.close();
} finally { await browser.close(); }
fs.mkdirSync('artifacts/university-import', { recursive: true });
fs.writeFileSync('artifacts/university-import/browser-results.json', JSON.stringify(results, null, 2));
console.log(`PASS ${results.length} emitted web bank/picker scenarios`);

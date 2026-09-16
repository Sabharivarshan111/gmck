import { parseCardContent } from '../src/lib/cardContent.ts';

const failures = [];
const check = (ok, msg) => {
  if (!ok) {
    console.error('FAIL:', msg);
    failures.push(msg);
  }
};

// Test 1: Marrow 8 PYQ exact card from user screenshot
const marrowCard = `The structure marked A in the image below represents:
A) Right anterior superior pancreaticoduodenal vein
B) Right gastroepiploic vein
C) Middle colic vein
D) Anterior superior pancreaticoduodenal vein
C
Q_ID: 15306
Ref: Sabiston 21st ed p1247
The Henle trunk is a confluence of the right gastroepiploic vein and the right colic or pancreaticoduodenal veins...`;

const parsed1 = parseCardContent({
  front: marrowCard,
  back: '',
  backImages: ['file:///media/paste-15306.jpg'],
});

check(parsed1.isMcq === true, 'Marrow card should be recognized as MCQ');
check(parsed1.stem === 'The structure marked A in the image below represents:', 'Stem should be clean without options or answers');
check(parsed1.options.length === 4, 'Should have 4 options');
check(parsed1.options[0].key === 'A' && parsed1.options[0].text === 'Right anterior superior pancreaticoduodenal vein', 'Option A mismatch');
check(parsed1.options[1].key === 'B' && parsed1.options[1].text === 'Right gastroepiploic vein', 'Option B mismatch');
check(parsed1.options[2].key === 'C' && parsed1.options[2].text === 'Middle colic vein', 'Option C mismatch');
check(parsed1.options[3].key === 'D' && parsed1.options[3].text === 'Anterior superior pancreaticoduodenal vein', 'Option D mismatch');
check(parsed1.correctOption === 'C', 'Correct option should be C');
check(parsed1.qId === '15306', 'QID should be 15306');
check(parsed1.reference === 'Sabiston 21st ed p1247', 'Ref should be Sabiston 21st ed p1247');
check(parsed1.explanation.startsWith('The Henle trunk'), 'Explanation should start with The Henle trunk');
check(parsed1.frontImages.includes('file:///media/paste-15306.jpg'), 'Image should be promoted to front');
check(parsed1.backImages.length === 0, 'Promoted image should not be duplicated in backImages');

// Test 2: Prepladder / NEET-PG format with Ans: D on back
const prepladderFront = `Which of the following is the most common cause of neonatal sepsis in India?
A. Streptococcus agalactiae
B. Listeria monocytogenes
C. Escherichia coli
D. Klebsiella pneumoniae`;

const prepladderBack = `Ans: D
Ref: Ghai Essential Pediatrics 9th ed p162
Klebsiella pneumoniae followed by Acinetobacter are the predominant organisms in developing countries.`;

const parsed2 = parseCardContent({
  front: prepladderFront,
  back: prepladderBack,
});

check(parsed2.isMcq === true, 'Prepladder card should be recognized as MCQ');
check(parsed2.correctOption === 'D', 'Prepladder correct option should be D');
check(parsed2.reference === 'Ghai Essential Pediatrics 9th ed p162', 'Prepladder reference match');
check(parsed2.explanation.includes('Klebsiella pneumoniae'), 'Prepladder explanation match');

// Test 3: Standard basic card without MCQ
const basic = parseCardContent({
  front: 'What does the P wave represent on ECG?',
  back: 'Atrial depolarisation.',
});
check(parsed3 => !basic.isMcq, 'Basic card should not be MCQ');
check(basic.stem === 'What does the P wave represent on ECG?', 'Basic stem intact');
check(basic.cleanBack === 'Atrial depolarisation.', 'Basic back intact');

// Test 4: Leaked answer in non-MCQ front
const leaked = parseCardContent({
  front: 'Define Argyll Robertson pupil\nAns: Light-near dissociation with accommodation reflex preserved\nExplanation: Seen in neurosyphilis affecting pretectal nucleus',
  back: '',
});
check(!leaked.isMcq, 'Leaked card is not MCQ');
check(leaked.stem === 'Define Argyll Robertson pupil', 'Leaked answer removed from front stem');
check(leaked.cleanBack.includes('Light-near dissociation'), 'Leaked answer preserved on back');

if (failures.length > 0) {
  console.error(`\nFAILED with ${failures.length} issues`);
  process.exit(1);
} else {
  console.log('\nOK  all MCQ parsing, option extraction, answer isolation, and front image promotion tests passed');
}

import { useState, useEffect } from "react";
import { Maximize2, Download, Sparkles, Image as ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExamDiagramCardProps {
  questionText?: string;
  topicName?: string;
  subject?: string;
  defaultOpen?: boolean;
}

interface DiagramItem {
  url: string;
  title: string;
}

const DIAG_STOP = new Set([
  'define', 'describe', 'explain', 'discuss', 'enumerate', 'classify', 'write',
  'short', 'note', 'notes', 'briefly', 'detail', 'types', 'various', 'causes',
  'features', 'clinical', 'management', 'treatment', 'prevention', 'control',
  'diagnosis', 'laboratory', 'importance', 'difference', 'differentiate',
  'compare', 'versus', 'medical', 'patient', 'person', 'child', 'female',
  'male', 'years', 'months', 'rules', 'rule', 'case', 'cases', 'study',
  'outline', 'aspects', 'factors', 'principles', 'methods', 'criteria',
  'guidelines', 'algorithm', 'signs', 'symptoms', 'procedure', 'investigations',
  'role', 'what', 'which', 'about', 'with', 'from', 'between', 'under',
  'their', 'does', 'have', 'been', 'give', 'name', 'list', 'state', 'applied',
  'life', 'cycle', 'cycles', 'diagram', 'draw', 'drawn', 'neat', 'labelled', 'question',
  'examination', 'appearance', 'effects', 'program', 'programme', 'scheme',
  'strategy', 'national', 'india', 'indian', 'level', 'levels', 'status',
  'health', 'community', 'public', 'primary', 'secondary', 'tertiary',
  'following', 'based', 'first', 'second', 'third', 'final', 'paper', 'topic',
  'practice', 'body', 'changes', 'death', 'living', 'post', 'mortem',
  'antemortem', 'postmortem', 'wounds', 'wound', 'injury', 'injuries',
  'poisons', 'poison', 'poisoning', 'acute', 'chronic', 'general', 'special',
  'system', 'systemic', 'organs', 'organ', 'human', 'structure', 'structures',
  'functions', 'function', 'parts', 'part', 'suitable', 'examples', 'available',
  'protection', 'act', 'acts', 'proof', 'therapeutic', 'classification',
  'bone', 'bones', 'artery', 'arteries', 'vein', 'veins', 'nerve', 'nerves',
  'muscle', 'muscles', 'joint', 'joints', 'gland', 'glands', 'duct', 'ducts',
  'wall', 'walls', 'cord', 'blood', 'reflex', 'reflexes',
  'disorder', 'disorders', 'disease', 'diseases', 'syndrome', 'syndromes',
  'supply', 'long', 'marrow', 'smear', 'picture', 'findings', 'origin',
  'course', 'distribution', 'branches', 'termination', 'anastomosis', 'relations',
  'articular', 'surface', 'surfaces', 'disc', 'discs', 'ligament', 'ligaments',
  'movement', 'movements', 'capsule', 'cavity', 'cavities', 'cartilage',
  'borders', 'border', 'fossa', 'tubercle', 'process', 'notch', 'insertion',
  'action', 'actions', 'innervation', 'tributaries', 'boundaries', 'contents',
  'extent', 'variation', 'variations', 'correlate', 'development', 'formation',
  'sites', 'presenting', 'location', 'anomalies', 'lesions', 'derivatives',
  'drainage', 'lymphatic', 'histology', 'gross', 'microscopic',
  'definition', 'definitions', 'sequence', 'reaction', 'reactions', 'energetics',
  'regulation', 'mechanism', 'mechanisms', 'steps', 'pathway', 'pathways',
  'transport', 'transports', 'passive', 'active', 'fate', 'synthesis',
  'degradation', 'metabolism', 'abnormalities', 'important', 'significance',
  'molecules', 'molecule', 'overview', 'pathophysiology', 'complications',
]);

const EXCLUSIVE_ENTITIES = [
  // Anatomy
  ['temporomandibular', 'tmj', 'mandible', 'mandibular'],
  ['shoulder', 'glenohumeral', 'scapula', 'acromion', 'rotator cuff'],
  ['synovial', 'synovial joint', 'diarthrodial', 'articular capsule'],
  ['cartilaginous', 'synchondrosis', 'symphysis', 'primary cartilaginous', 'secondary cartilaginous'],
  ['fibrous joint', 'suture', 'gomphosis', 'syndesmosis', 'schindylesis'],
  ['nutrient artery', 'blood supply of bone', 'blood supply of long bone', 'haversian artery'],
  ['ossification', 'endochondral', 'intramembranous', 'epiphyseal plate', 'growth plate', 'zone of proliferation'],
  ['compact bone', 'haversian system', 'osteon', 'volkmann', 'lamellae', 'lacunae'],
  ['knee', 'patella', 'meniscus', 'cruciate'],
  ['elbow', 'radioulnar', 'olecranon'],
  ['hip', 'acetabulum', 'iliofemoral'],
  ['wrist', 'carpal', 'carpometacarpal'],
  ['brachial', 'plexus', 'erbs'],
  ['femoral', 'femur'],
  ['popliteal'],
  ['axilla', 'axillary'],
  ['carotid'],
  ['cavernous'],
  ['intercostal'],
  ['coronary'],
  ['atrium', 'atrial'],
  ['cerebellum', 'cerebellar'],
  ['cerebrum', 'cerebral', 'internal capsule'],
  ['medulla', 'medullary'],
  ['pons', 'pontine'],
  ['facial nerve', 'facial', 'bells palsy'],
  ['median nerve', 'median', 'carpal tunnel', 'anterior interosseous', 'ape thumb'],
  ['ulnar nerve', 'ulnar', 'guyon', 'claw hand', 'cubital tunnel'],
  ['radial nerve', 'radial', 'spiral groove', 'wrist drop', 'posterior interosseous'],
  ['sciatic', 'sciatic nerve', 'piriformis', 'foot drop'],
  ['femoral nerve', 'femoral'],
  ['rectus sheath', 'arcuate line', 'linea alba', 'pyramidalis'],
  ['trigeminal', 'trigeminal nerve', 'mandibular nerve', 'ophthalmic nerve', 'maxillary nerve', 'otic ganglion', 'ciliary ganglion', 'pterygopalatine ganglion'],
  ['thoracic duct', 'cisterna chyli', 'chylothorax'],
  ['stomach bed', 'lesser sac'],
  ['duodenum', 'duodenal'],
  ['pancreas', 'pancreatic'],
  ['spleen', 'splenic', 'splenomegaly', 'gastrosplenic', 'lienorenal'],
  ['liver', 'hepatic', 'portal'],
  ['kidney', 'renal'],
  ['stomach', 'gastric'],
  ['testis', 'testicular'],
  ['ovary', 'ovarian'],
  ['breast', 'mammary'],
  ['lung', 'lungs', 'bronchopulmonary'],
  ['larynx', 'laryngeal', 'vocal cord'],
  ['pharynx', 'pharyngeal'],
  ['palatine tonsil', 'tonsil'],
  ['tongue', 'lingual'],
  ['parotid'],
  ['thyroid'],
  ['pituitary'],
  // Biochemistry pathways & cycles
  ['tca', 'tca cycle', 'krebs', 'citric acid', 'citric acid cycle', 'tricarboxylic', 'anaplerosis', 'anaplerotic', 'citrate synthase'],
  ['glycolysis', 'embden', 'meyerhof', 'hexokinase', 'glucokinase', 'phosphofructokinase', 'pfk 1', 'pfk-1', 'pyruvate kinase', 'rapoport'],
  ['gluconeogenesis', 'cori cycle', 'cahill cycle', 'alanine cycle', 'pyruvate carboxylase', 'pepck', 'fructose 1 6 bisphosphatase', 'glucose 6 phosphatase'],
  ['glycogen', 'glycogenesis', 'glycogenolysis', 'von gierke', 'pompe', 'cori disease', 'mcardle', 'glycogen storage'],
  ['hmp shunt', 'pentose phosphate', 'g6pd', 'favism', 'transketolase', 'transaldolase'],
  ['urea cycle', 'hyperammonemia', 'ornithine', 'citrulline', 'argininosuccinate', 'arginase', 'carbamoyl phosphate synthetase i'],
  ['beta oxidation', 'carnitine', 'carnitine shuttle', 'cpt-1', 'cpt-2', 'acyl coa dehydrogenase'],
  ['ketogenesis', 'ketone body', 'ketone bodies', 'ketolysis', 'dka', 'diabetic ketoacidosis', 'hmg coa synthase'],
  ['cholesterol', 'statin', 'hmg coa reductase', 'mevalonate', 'squalene'],
  ['lipoprotein', 'chylomicron', 'chylomicrons', 'vldl', 'ldl', 'hdl', 'reverse cholesterol transport', 'rct', 'abetalipoproteinemia', 'tangier', 'atherogenesis', 'dyslipidemia', 'hyperlipoproteinemia'],
  ['bilirubin', 'jaundice', 'heme catabolism', 'heme degradation', 'urobilinogen', 'stercobilin', 'kernicterus', 'crigler', 'gilbert', 'dubinhohnson', 'rotor'],
  ['heme synthesis', 'porphyria', 'porphyrias', 'ala synthase', 'lead poisoning', 'acute intermittent porphyria', 'coproporphyria'],
  ['purine', 'uric acid', 'gout', 'lesch nyhan', 'prpp', 'allopurinol', 'salvage pathway'],
  ['pyrimidine', 'orotic acid', 'orotic aciduria', 'carbamoyl phosphate synthetase ii', 'cad enzyme'],
  ['phenylalanine', 'tyrosine', 'pku', 'phenylketonuria', 'alkaptonuria', 'albinism', 'homogentisic'],
  ['tryptophan', 'serotonin', 'melatonin', 'carcinoid', 'hartnup', 'niacin', 'pellagra'],
  ['one carbon', 'methionine', 'homocysteine', 'folate trap', 'sam', 'tetrahydrofolate'],
  ['enzyme kinetics', 'lineweaver', 'burk', 'michaelis', 'menten', 'km', 'vmax', 'competitive inhibition', 'non competitive'],
  ['electrophoresis', 'spep', 'serum protein electrophoresis', 'multiple myeloma', 'm band', 'gamma globulin'],
  ['electron transport chain', 'etc complexes', 'oxidative phosphorylation', 'chemiosmotic', 'atp synthase', 'rotenone', 'cyanide', 'uncoupler', 'dnp'],
  ['visual cycle', 'wald', 'rhodopsin', 'vitamin a', 'retinal', 'opsin', 'night blindness'],
  ['translation', 'ribosome', 'elongation', 'initiation factor', 'tetracycline', 'chloramphenicol', 'erythromycin', 'cycloheximide'],
  ['cell membrane transport', 'transport mechanisms', 'passive transport', 'simple diffusion', 'facilitated diffusion', 'sodium potassium pump', 'na k atpase', 'ping pong mechanism', 'ping-pong'],
];

export default function ExamDiagramCard({
  questionText,
  topicName,
  subject,
}: ExamDiagramCardProps) {
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDiagrams = async () => {
      setLoading(true);
      try {
        const queryTerm = (questionText || topicName || "").trim();
        if (!queryTerm) {
          setLoading(false);
          return;
        }

        const cleanQuery = queryTerm
          .replace(/[0-9]+\./g, "")
          .replace(/\(Pg.*\)/gi, "")
          .replace(/\(Feb.*\)|\(Aug.*\)|\(Oct.*\)|\(Jan.*\)/gi, "")
          .replace(/[*#]/g, "")
          .trim();

        const queryLower = cleanQuery.toLowerCase();
        const matchingFamily = EXCLUSIVE_ENTITIES.find(family =>
          family.some(kw => queryLower.includes(kw))
        );

        if (!matchingFamily) {
          if (isMounted) {
            setDiagrams([]);
            setLoading(false);
          }
          return;
        }

        let queryBuilder = supabase
          .from("question_diagrams")
          .select("public_url, storage_path, question_text")
          .not("public_url", "is", null);

        if (subject) {
          queryBuilder = queryBuilder.ilike("subject", `%${subject}%`);
        }

        const { data: allRows } = await queryBuilder;
        const matchedList: Array<{ url: string; title: string; score: number }> = [];
        const seenUrls = new Set<string>();

        if (allRows && allRows.length > 0) {
          for (const row of allRows) {
            if (!row.public_url || !row.question_text) continue;
            if (seenUrls.has(row.public_url)) continue;

            const rowText = row.question_text.toLowerCase();
            const storagePath = (row.storage_path || '').toLowerCase();

            const matches = matchingFamily.some(kw => rowText.includes(kw) || storagePath.includes(kw));
            if (!matches) continue;

            seenUrls.add(row.public_url);
            matchedList.push({
              url: row.public_url,
              title: row.question_text,
              score: 10,
            });
          }
        }

        if (isMounted) {
          setDiagrams(matchedList.map(m => ({ url: m.url, title: m.title })));
          setActiveIndex(0);
        }
      } catch (err) {
        console.error("Error fetching diagrams:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDiagrams();
    return () => { isMounted = false; };
  }, [questionText, topicName, subject]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-muted rounded-full" />
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
        <div className="w-full h-48 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  // If no diagrams exist in Supabase storage, do not render any card in the app UI
  if (diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[activeIndex] || diagrams[0];

  return (
    <>
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/20 shadow-md overflow-hidden transition-all hover:shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-foreground">High-Yield Exam Diagram</span>
                {diagrams.length > 1 && (
                  <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
                    <Layers className="h-3 w-3" />
                    {activeIndex + 1} of {diagrams.length} Views
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-primary border-primary/30">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Textbook Grounded
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setLightboxOpen(true)}
              title="Fullscreen Zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
              title="Download Diagram"
            >
              <a href={currentDiagram.url} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Multi-diagram Tabs if > 1 diagram exists */}
        {diagrams.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border-b border-border/40 overflow-x-auto no-scrollbar">
            {diagrams.map((diag, idx) => (
              <button
                key={diag.url}
                onClick={() => setActiveIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  idx === activeIndex
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                <span>Plate {idx + 1}</span>
                <span className="text-[10px] opacity-75 truncate max-w-[120px]">
                  {diag.title.split('-')[0].trim()}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Diagram Image */}
        <div
          className="relative group cursor-pointer overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center p-2 min-h-[220px]"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={currentDiagram.url}
            alt={currentDiagram.title || topicName || questionText || "Exam Diagram"}
            className="w-full max-h-96 object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              Click to Zoom Fullscreen
            </div>
          </div>

          {/* Navigation Arrows for multi-diagram */}
          {diagrams.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : diagrams.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 text-foreground shadow-md flex items-center justify-center hover:bg-background transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev < diagrams.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 text-foreground shadow-md flex items-center justify-center hover:bg-background transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Caption footer */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="truncate max-w-[280px]">{currentDiagram.title}</span>
          <span className="font-mono text-[10px]">
            {diagrams.length > 1 ? `${activeIndex + 1} / ${diagrams.length}` : "Standard Mnemonic"}
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-white mb-2 px-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs">
                {diagrams.length > 1 ? `Plate ${activeIndex + 1}/${diagrams.length}` : "Visual Exam Plate"}
              </Badge>
              <span className="text-sm font-semibold truncate max-w-md">
                {currentDiagram.title || topicName || questionText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={currentDiagram.url} download target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentDiagram.url}
              alt={currentDiagram.title}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

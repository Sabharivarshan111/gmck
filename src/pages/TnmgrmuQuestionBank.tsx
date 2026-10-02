import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const canonical = "https://mbbsqbank-questor.lovable.app/tnmgrmu-mbbs-question-bank";

const years = [
  {
    title: "1st Year MBBS",
    body: "Build strong foundations with subject-wise revision for Anatomy, Physiology and Biochemistry.",
  },
  {
    title: "2nd Year MBBS",
    body: "Revise core university topics in Pathology, Pharmacology and Microbiology through a structured question-bank workflow.",
  },
  {
    title: "3rd Year / Pre-final MBBS",
    body: "Prepare university-oriented questions and revision across subjects such as Community Medicine, Forensic Medicine, ENT and Ophthalmology where content is available.",
  },
  {
    title: "Final Year MBBS",
    body: "Use ORBIT to organize question-based revision for major clinical subjects and keep track of your study progress.",
  },
];

const faqs = [
  {
    q: "Is ORBIT useful for TNMGRMU MBBS university exams?",
    a: "ORBIT is designed especially to help MBBS students prepare with a university-focused question-bank workflow, revision tools and subject-wise study features. It is an independent study resource and is not the official TNMGRMU website.",
  },
  {
    q: "Does ORBIT include previous-year questions?",
    a: "ORBIT includes previous-year and university-oriented questions in supported subjects. Coverage can differ by year and subject as the question bank is expanded and reviewed.",
  },
  {
    q: "Which MBBS years can use ORBIT?",
    a: "The app supports study workflows from 1st Year through Final Year MBBS, with available subjects and question sets shown inside ORBIT.",
  },
  {
    q: "Can I use ORBIT only for TNMGRMU?",
    a: "TNMGRMU university preparation is a major focus, while many of the medical concepts, MCQs and revision tools can also be useful for broader MBBS study.",
  },
];

export default function TnmgrmuQuestionBank() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="TNMGRMU MBBS Question Bank & PYQs | ORBIT"
        description="Free TNMGRMU MBBS question bank for Tamil Nadu Dr. M.G.R. Medical University students with previous year questions, MCQs, AI-assisted revision and study tools."
        canonical={canonical}
      />

      <header className="border-b border-border/60 bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-extrabold tracking-tight text-foreground">
            ORBIT <span className="text-primary">MBBS QBANK</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open ORBIT <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Tamil Nadu MBBS University Preparation
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                TNMGRMU MBBS Question Bank & Previous Year Questions
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
                ORBIT MBBS QBANK is built especially to help students of Tamil Nadu Dr. M.G.R. Medical University
                organize university-exam preparation using question-based revision, previous-year questions, MCQs,
                AI-assisted explanations and progress tools.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
                >
                  Start studying in ORBIT <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/study-tips"
                  className="rounded-xl border border-border px-5 py-3 font-semibold hover:border-primary/60"
                >
                  Study tips
                </Link>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                ORBIT is an independent educational resource. It is not the official website or an official product of
                Tamil Nadu Dr. M.G.R. Medical University.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-6">
            <p className="text-sm font-semibold text-primary">YEAR-WISE REVISION</p>
            <h2 className="mt-1 text-2xl font-bold">From 1st Year to Final Year MBBS</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {years.map((year) => (
              <article key={year.title} className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold">{year.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{year.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="mb-6">
              <p className="text-sm font-semibold text-primary">STUDY TOOLS</p>
              <h2 className="mt-1 text-2xl font-bold">Use one workflow for university revision</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={BookOpen}
                title="Question Bank & PYQs"
                body="Revise supported subjects through structured university-oriented questions and previous-year questions."
              />
              <Feature
                icon={ClipboardCheck}
                title="MCQ Practice"
                body="Use MCQs to test recall and identify topics that need another revision."
              />
              <Feature
                icon={Sparkles}
                title="AI Assistance"
                body="Ask for explanations or generate practice prompts from topics while you study."
              />
              <Feature
                icon={Target}
                title="Progress & Revision"
                body="Track completion, revisit topics and keep your preparation organized."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold text-primary">PRACTICAL WORKFLOW</p>
              <h2 className="mt-1 text-2xl font-bold">How to use ORBIT for TNMGRMU exams</h2>
              <ol className="mt-6 space-y-4">
                {[
                  "Choose your MBBS year and the subject you are currently studying.",
                  "Start with previous-year and important university-oriented questions for that subject.",
                  "Mark completed questions and identify frequently revisited or difficult topics.",
                  "Use MCQs and AI-assisted explanations to test understanding instead of only rereading.",
                  "Return to your weak areas during the final revision before the university exam.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-6 text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Quick subject links</h2>
              </div>
              <div className="grid gap-2">
                <SubjectLink to="/subjects/anatomy" label="Anatomy" />
                <SubjectLink to="/subjects/physiology" label="Physiology" />
                <SubjectLink to="/subjects/biochemistry" label="Biochemistry" />
                <SubjectLink to="/subjects/pathology" label="Pathology" />
                <SubjectLink to="/subjects/pharmacology" label="Pharmacology" />
                <SubjectLink to="/subjects/microbiology" label="Microbiology" />
              </div>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Browse all available subjects in ORBIT <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h2 className="mt-1 text-2xl font-bold">TNMGRMU question-bank questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <article key={faq.q} className="rounded-2xl border border-border/70 bg-card p-5">
                  <h3 className="flex items-start gap-2 font-semibold">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {faq.q}
                  </h3>
                  <p className="mt-2 pl-7 text-sm leading-6 text-muted-foreground">{faq.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 pt-4">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/10 p-7 text-center md:p-10">
            <h2 className="text-2xl font-bold">Continue your TNMGRMU revision in ORBIT</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Choose your year, open a subject and turn your university preparation into a trackable question-by-question workflow.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              Open ORBIT MBBS QBANK <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-background/50 p-5">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

function SubjectLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm font-medium hover:border-primary/50"
    >
      {label}
      <ArrowRight className="h-4 w-4 text-primary" />
    </Link>
  );
}

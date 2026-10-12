# Subscription and PG content licence review — 12 October 2026

ORBIT's subscription should not be removed merely because the Reddit author says GPL software cannot be paywalled. GNU's official FAQ explicitly permits selling GPL software and charging download fees. The requirement concerns recipients' software freedoms and access to corresponding source, rather than a universal zero-price rule.

Primary references:

- GNU FAQ: https://www.gnu.org/licenses/gpl-faq.en.html#DoesTheGPLAllowMoney
- Author's actual GPLv3 licence, sections 4–6: https://github.com/Imouto36/medmcqa-trainer/blob/main/LICENSE
- Trainer README, which excludes the dataset: https://github.com/Imouto36/medmcqa-trainer
- Original MedMCQA repository and schema: https://github.com/medmcqa/medmcqa

If GPL-covered trainer code is incorporated into a distributed derivative, the covered work must comply with GPL requirements, including the applicable corresponding-source, notice and redistribution conditions. A subscription does not eliminate those obligations. Independently using the same data does not, by itself, make an independently written application a derivative of that trainer's code. This PG implementation did not copy that trainer's code. A scoped search of native source and importer scripts found no trainer attribution or reference; this is not a whole-application dependency or legal clearance audit.

The trainer's licence is separate from MedMCQA data and underlying examination material. The original MedMCQA code repository presents MIT licensing; the Hugging Face dataset card declares Apache-2.0. Neither declaration independently proves permission for every third-party underlying recalled question or textbook passage. Preserve provenance and notices; investigate the material's own conditions before importing additional publisher banks. No private competitor question bank is copied in this change.

The Reddit post uses train.json, which MedMCQA describes as mock and online test-series material. MedMCQA's published schema does not provide an individual exam year/session. Its 2022 publication date is not the date each question was asked. Do not promote the practice bank to an annual PYQ archive, invent years, or treat dataset answers as clinician-approved answers.

Billing was not changed. AI services, subscriptions and historical-source research remain separate from any unsupported claim that every examination question through 2026 has been imported or medically verified.

## NDA fact-check

The official NEET-PG 2025 bulletin, English printed pages 93–94, sections 9.7–9.10, identifies examination content as confidential/proprietary and prohibits candidate reproduction, transmission and publication. Its social-media examples explicitly include Telegram. Source: https://nbe.edu.in/IB/IB%20NEET-PG%202025.pdf . The older official NDA page states the same candidate restriction: https://nbe.edu.in/neetpg/non-disclosure-agreement.html .

The inspected provisions do not state a separate blanket prohibition on displaying an examination year. This is not permission to republish the underlying question. Removing a year, using a different label, charging nothing, or finding a public recall does not establish republication permission. The latest full 2026 bulletin was not retrieved; September 2026 reporting describes a renewed NBEMS warning against circulating memory-based questions, including a warning to coaching providers and other stakeholders: https://indianexpress.com/article/education/neet-pg-2026-nbems-warns-against-sharing-recall-based-questions-10860518/ . Distinguish verified official text from that current secondary report.

Question-year evidence, medical correctness, copyright/reuse permission, candidate confidentiality obligations and the software licence are separate checks. The research and matching metadata do not constitute legal clearance of an examination archive.

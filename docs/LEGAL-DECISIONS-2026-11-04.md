# Operator decisions and legal review — 4 November 2026

Technical inventory: controller/contact are confirmed; local guest storage is separate from account data; account authentication uses Supabase and IONOS email delivery; Vercel hosts and protects previews. Contract, region and transfer evidence remain in PROCESSOR-INVENTORY.md and must not be inferred from a successful deployment. Backups and email copies are distinct from database records.

Official source checked: [Regulation (EU) 2016/679, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj). Article 5(1)(e) requires storage limitation; Article 13 requires the retention period or its criteria and information on recipients and applicable transfers. Consequently, indefinite retention without a purpose-based rule is not a finished retention concept. Article 6 legal basis and potential Article 9 implications of actual training information require a factual/legal assessment; a UI health-data warning alone does not settle classification.

Operator confirmed on 4 November 2026: account/test data deleted no later than 30 days after closed-test end; feedback deleted or permanently anonymized within 90 days of receipt. This is a manual operator rule, not an implemented automatic job. Operational steps and responsibility are recorded in RETENTION-AND-DELETION.md. Provider backup evidence and legal review remain separate.

Alternative: remain with fictitious test content until the decisions and implementation are complete. No existing personal data are erased under this task. Requests continue to go to info@nap-studios.de; never request codes or training backups as identity evidence.

Required external review: applicable legal basis per purpose; scope of health-related data; provider DPA/transfer evidence; final information/participation wording; retention including provider backup windows. Existing public text explicitly states its review status and is not silently replaced by this proposal.

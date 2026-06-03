import { scheduleTask, logger } from "@trigger.dev/sdk/v3";
import { fetchUnreadEmails, markEmailAsRead, createDraft } from "../lib/gmail";
import { classifyEmail, generateReply } from "../lib/gemini";
import { logLead, isEmailAlreadyProcessed } from "../lib/supabase";

export const emailAgentTask = scheduleTask({
  id: "gueldenarm-email-agent",
  // Runs every 5 minutes
  cron: "*/5 * * * *",
  maxDuration: 240,

  run: async (_payload, { ctx }) => {
    logger.info("Email-Agent gestartet", { runId: ctx.run.id });

    const emails = await fetchUnreadEmails();
    logger.info(`${emails.length} ungelesene E-Mail(s) gefunden`);

    const results: { id: string; status: string }[] = [];

    for (const email of emails) {
      logger.info("Verarbeite E-Mail", { id: email.id, from: email.senderEmail, subject: email.subject });

      try {
        // Skip if already processed (idempotency guard)
        const alreadyDone = await isEmailAlreadyProcessed(email.id);
        if (alreadyDone) {
          logger.info("E-Mail bereits verarbeitet, überspringe", { id: email.id });
          continue;
        }

        // 1. Classify
        const category = await classifyEmail(email.subject, email.body);
        logger.info("Kategorie erkannt", { id: email.id, category });

        // 2. Generate German reply draft
        const replyText = await generateReply(email, category);
        logger.info("Antwort-Entwurf generiert", { id: email.id, chars: replyText.length });

        // 3. Log lead to Supabase
        await logLead({
          name: email.senderName,
          kontakt: email.senderEmail,
          kategorie: category,
          // Prefix with gmail message id for idempotency check
          nachricht: `[gmid:${email.id}] ${email.body.slice(0, 3000)}`,
          quelle: "Mail",
          datum: new Date().toISOString(),
          status: "Neu",
        });
        logger.info("Lead in Supabase gespeichert", { id: email.id });

        // 4. Create Gmail draft
        const draftId = await createDraft({
          to: email.senderEmail,
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
          body: replyText,
          threadId: email.threadId,
        });
        logger.info("Gmail-Entwurf erstellt", { id: email.id, draftId });

        // 5. Mark original email as read
        await markEmailAsRead(email.id);
        logger.info("E-Mail als gelesen markiert", { id: email.id });

        results.push({ id: email.id, status: "ok" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Fehler beim Verarbeiten der E-Mail", { id: email.id, error: message });
        results.push({ id: email.id, status: `error: ${message}` });
      }
    }

    logger.info("Email-Agent abgeschlossen", { total: emails.length, results });
    return { processed: results.length, results };
  },
});

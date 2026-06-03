import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  senderName: string;
  senderEmail: string;
  body: string;
  date: string;
}

function getOAuth2Client(): OAuth2Client {
  const client = new OAuth2Client(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return client;
}

function getGmailClient() {
  return google.gmail({ version: "v1", auth: getOAuth2Client() });
}

function decodeBase64(data: string): string {
  const buf = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return buf.toString("utf-8");
}

function extractPlainText(payload: any): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  // Fallback: HTML part, strip tags
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64(payload.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  return "";
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ""), email: match[2].trim() };
  }
  return { name: from.trim(), email: from.trim() };
}

export async function fetchUnreadEmails(): Promise<EmailMessage[]> {
  const gmail = getGmailClient();

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: 20,
  });

  const messages = listRes.data.messages ?? [];
  if (messages.length === 0) return [];

  const emails: EmailMessage[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const payload = full.data.payload;
    if (!payload) continue;

    const headers = payload.headers ?? [];
    const from = getHeader(headers, "From");
    const subject = getHeader(headers, "Subject");
    const date = getHeader(headers, "Date");
    const { name, email } = parseSender(from);
    const body = extractPlainText(payload);

    emails.push({
      id: msg.id,
      threadId: full.data.threadId ?? "",
      subject,
      from,
      senderName: name,
      senderEmail: email,
      body: body.slice(0, 4000), // cap to avoid token overflow
      date,
    });
  }

  return emails;
}

export async function markEmailAsRead(messageId: string): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

export async function createDraft(params: {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}): Promise<string> {
  const gmail = getGmailClient();

  const raw = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    params.body,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encoded,
        ...(params.threadId ? { threadId: params.threadId } : {}),
      },
    },
  });

  return res.data.id ?? "";
}

/**
 * Run this script ONCE locally to authorize Gmail access.
 * It will print a GMAIL_REFRESH_TOKEN to add to your .env file.
 *
 * Usage:
 *   npx ts-node src/scripts/gmail-auth.ts
 */
import { google } from "googleapis";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in your .env file.");
  process.exit(1);
}

const SCOPES = ["https://mail.google.com/"];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("\n========================================");
console.log("Schritt 1: Öffne diese URL im Browser:");
console.log("========================================\n");
console.log(authUrl);
console.log("\n========================================");
console.log("Schritt 2: Melde dich mit info@gueldenarm.de an");
console.log("          und kopiere den Autorisierungscode.");
console.log("========================================\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Code einfügen: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\n========================================");
    console.log("Erfolgreich! Trage diesen Wert in .env ein:");
    console.log("========================================\n");
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);

    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, "utf8");
      if (content.includes("GMAIL_REFRESH_TOKEN=")) {
        content = content.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        content += `\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      fs.writeFileSync(envPath, content);
      console.log("\n.env wurde automatisch aktualisiert.");
    }
  } catch (err) {
    console.error("Fehler beim Token-Austausch:", err);
  }
});

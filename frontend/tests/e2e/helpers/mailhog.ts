import { expect, type APIRequestContext } from "@playwright/test";

const MAILHOG_API_URL =
  process.env.PW_MAILHOG_API_URL || "http://127.0.0.1:8025/api/v2/messages";

interface MailhogRecipient {
  Mailbox: string;
  Domain: string;
}

interface MailhogMessage {
  To: MailhogRecipient[];
  Content: {
    Body: string;
    Headers?: Record<string, string[]>;
  };
  Created: string;
}

interface MailhogResponse {
  items: MailhogMessage[];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function recipientMatches(message: MailhogMessage, email: string) {
  const normalized = normalizeEmail(email);
  return message.To.some((recipient) => {
    const value = `${recipient.Mailbox}@${recipient.Domain}`.toLowerCase();
    return value === normalized;
  });
}

export async function getMailhogMessagesForEmail(
  request: APIRequestContext,
  email: string,
): Promise<MailhogMessage[]> {
  const response = await request.get(MAILHOG_API_URL);
  expect(response.ok()).toBeTruthy();

  const data = (await response.json()) as MailhogResponse;
  return (data.items || [])
    .filter((message) => recipientMatches(message, email))
    .sort((a, b) => b.Created.localeCompare(a.Created));
}

export async function waitForMailhogMessageCount(
  request: APIRequestContext,
  email: string,
  minimumCount: number,
) {
  await expect
    .poll(
      async () => (await getMailhogMessagesForEmail(request, email)).length,
      {
        timeout: 30000,
        message: `Waiting for ${minimumCount} MailHog messages for ${email}`,
      },
    )
    .toBeGreaterThanOrEqual(minimumCount);
}

export async function waitForInvitationUrl(
  request: APIRequestContext,
  email: string,
  minimumCount = 1,
): Promise<string> {
  await waitForMailhogMessageCount(request, email, minimumCount);

  const messages = await getMailhogMessagesForEmail(request, email);
  const body = messages[0]?.Content?.Body || "";
  const match = body.match(/http:\/\/localhost:5173\/invitations\/[A-Za-z0-9_-]+/);

  expect(match?.[0]).toBeTruthy();
  return match![0];
}

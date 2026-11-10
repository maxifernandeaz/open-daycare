import { Resend } from "resend";

const DEFAULT_FROM = "KiddiCare <onboarding@resend.dev>";
const DEFAULT_SITE_URL = "http://localhost:3000";

let resendClient: Resend | null = null;

export type SendInvitationEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  resendClient ??= new Resend(apiKey);

  return resendClient;
}

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

function formatCode(code: string): string {
  return normalizeCode(code).split("").join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInvitationEmail(
  childName: string,
  spacedCode: string,
  activationUrl: string,
): string {
  const safeChildName = escapeHtml(childName);

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f6fbf8;font-family:Arial,Helvetica,sans-serif;color:#1b1c1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px;font-size:24px;line-height:1.3;">Bienvenida a KiddiCare</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#404943;">
                  Te invitaron a seguir a <strong>${safeChildName}</strong> en KiddiCare.
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#404943;">Tu código de activación es:</p>
                <p style="margin:0 0 24px;font-size:28px;letter-spacing:4px;font-weight:700;color:#0f6b4f;">
                  ${escapeHtml(spacedCode)}
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(activationUrl)}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:12px;">
                    Activar mi cuenta
                  </a>
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#6b756f;">
                  Si el botón no funciona, copia este enlace en tu navegador:<br />
                  <a href="${escapeHtml(activationUrl)}" style="color:#0f6b4f;">${escapeHtml(activationUrl)}</a>
                </p>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b756f;">
                  El código vence en 7 días. Si no esperabas esta invitación, podés ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendInvitationEmail(
  to: string,
  code: string,
  childName: string,
): Promise<SendInvitationEmailResult> {
  const client = getResendClient();

  if (!client) {
    return {
      success: false,
      error: "RESEND_API_KEY no está configurada.",
    };
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
  const cleanCode = normalizeCode(code);
  const activationUrl = `${siteUrl}/activar-cuenta?code=${encodeURIComponent(cleanCode)}`;

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
      to,
      subject: `Invitación para seguir a ${childName} en KiddiCare`,
      html: buildInvitationEmail(childName, formatCode(cleanCode), activationUrl),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Resend no devolvió respuesta." };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al enviar el correo.",
    };
  }
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || 'Stark Industries <noreply@stark.net.tr>';
const APP_URL = process.env.APP_URL || 'https://stark.net.tr';

// ── HTML Email Templates ──────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Stark Industries</title>
</head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1a2a,#0a1520);border:1px solid rgba(0,200,220,0.2);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="font-size:10px;letter-spacing:4px;color:#00b4c8;text-transform:uppercase;margin-bottom:8px;">STARK INDUSTRIES</div>
              <div style="font-size:22px;font-weight:700;color:#e8eaf0;letter-spacing:2px;">SECURE COMMUNICATIONS</div>
              <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#00b4c8,transparent);margin:16px auto 0;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#0d1420;border:1px solid rgba(0,200,220,0.1);border-top:none;border-radius:0 0 12px 12px;padding:36px 40px;">
              ${content}
              <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
                <div style="font-size:10px;color:#3a4a5a;letter-spacing:2px;">STARK INDUSTRIES © 2026 — CLASSIFIED COMMUNICATIONS</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Send Password Reset Email ─────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const content = `
    <h2 style="color:#e8eaf0;font-size:18px;font-weight:600;margin:0 0 8px;">Şifre Sıfırlama Talebi</h2>
    <p style="color:#8a9ab0;font-size:13px;line-height:1.6;margin:0 0 24px;">
      Merhaba <strong style="color:#00b4c8;">${username}</strong>,<br/>
      Hesabınız için bir şifre sıfırlama talebi aldık. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#00b4c8,#0077aa);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
        ŞİFREMİ SIFIRLA
      </a>
    </div>
    <div style="background:rgba(0,180,200,0.05);border:1px solid rgba(0,180,200,0.15);border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:10px;letter-spacing:2px;color:#00b4c8;margin-bottom:6px;">UYARI</div>
      <p style="color:#8a9ab0;font-size:12px;margin:0;line-height:1.5;">
        Bu link <strong style="color:#e8eaf0;">1 saat</strong> boyunca geçerlidir. Güvenliğiniz için linki kimseyle paylaşmayın.
      </p>
    </div>
    <p style="color:#4a5a6a;font-size:11px;text-align:center;margin:0;">
      Link çalışmıyorsa şu adresi kopyalayıp tarayıcınıza yapıştırın:<br/>
      <span style="color:#00b4c8;word-break:break-all;">${resetUrl}</span>
    </p>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🔐 Stark Industries — Şifre Sıfırlama',
    html: baseTemplate(content),
  });
}

// ── Send Welcome Email ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const content = `
    <h2 style="color:#e8eaf0;font-size:18px;font-weight:600;margin:0 0 8px;">Hoş Geldiniz, Ajan</h2>
    <p style="color:#8a9ab0;font-size:13px;line-height:1.6;margin:0 0 20px;">
      <strong style="color:#00b4c8;">${username}</strong> kimlik bilgileriniz doğrulandı. Stark Industries Güvenli İletişim Ağı'na erişiminiz aktif edildi.
    </p>
    <div style="background:rgba(0,180,200,0.05);border:1px solid rgba(0,180,200,0.15);border-radius:6px;padding:16px 18px;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:2px;color:#00b4c8;margin-bottom:10px;">SİSTEM BİLGİSİ</div>
      <div style="color:#8a9ab0;font-size:12px;line-height:2;">
        ✓ Güvenli SSL bağlantısı aktif<br/>
        ✓ End-to-end şifreleme etkin<br/>
        ✓ Ses kanalları hazır<br/>
        ✓ Dosya transferi aktif
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}"
        style="display:inline-block;background:linear-gradient(135deg,#00b4c8,#0077aa);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
        SİSTEME GİRİŞ YAP
      </a>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '⚡ Stark Industries — Hesabınız Aktif',
    html: baseTemplate(content),
  });
}

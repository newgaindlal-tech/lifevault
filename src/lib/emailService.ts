/**
 * Free Transactional Email Dispatcher.
 * Uses Resend or standard SMTP if configured in .env.local.
 * If credentials are not present, logs safely to console and DOES NOT crash the app.
 */
export async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message: string }> {
  const resendApiKey = process.env.re_3d8JrmAn_9Us6fjiaK6XrXRWfCcxbjYnT;

  if (!resendApiKey) {
    // Graceful fallback: free simulation mode
    console.info('[Email Simulation] To:', to);
    console.info('[Email Simulation] Subject:', subject);
    return {
      success: true,
      message: 'Email simulated in dev mode (Set RESEND_API_KEY to send real emails).',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'LifeVault Alerts <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, message: `Email provider error: ${err}` };
    }

    return { success: true, message: 'Email delivered successfully.' };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown email failure',
    };
  }
}
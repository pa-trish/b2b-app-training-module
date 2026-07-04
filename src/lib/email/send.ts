export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[password-reset] Reset link for ${email}: ${resetUrl}`);
    return;
  }

  console.warn(
    `[password-reset] Email delivery is not configured. Configure SMTP env vars to send reset links.`
  );
}

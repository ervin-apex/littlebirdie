export function chirpSchedulerEnabled() {
  return process.env.CHIRP_SCHEDULER_ENABLED === "true";
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Chirp configuration is incomplete: ${name}.`);
  return value;
}

export function getChirpDeliveryConfig() {
  const values = {
    appBaseUrl: required("APP_BASE_URL"),
    cronSecret: required("CHIRP_CRON_SECRET"),
    fromEmail: required("CHIRP_FROM_EMAIL"),
    replyToEmail: required("CHIRP_REPLY_TO_EMAIL"),
    resendApiKey: required("RESEND_API_KEY"),
    tokenSecret: required("CHIRP_TOKEN_SECRET"),
  };

  return {
    ...values,
    appBaseUrl: values.appBaseUrl.replace(/\/$/, ""),
  };
}

export function getChirpTokenSecret() {
  return required("CHIRP_TOKEN_SECRET");
}

export function getResendWebhookSecret() {
  return required("RESEND_WEBHOOK_SECRET");
}

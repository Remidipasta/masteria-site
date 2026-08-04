// Webhook Brevo : notifié quasi immédiatement si un email transactionnel
// rebondit (adresse invalide/bloquée). Permet de garder la capture des
// lead magnets sans friction (pas de double opt-in) tout en nettoyant
// silencieusement les fausses adresses qui auraient passé le filtre DNS.

const CLEANUP_LIST_IDS = [9, 10, 11, 12, 13]; // 4 lead magnets + Instagram/Telegram

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.query.token !== process.env.BREVO_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const events = Array.isArray(req.body) ? req.body : [req.body];
  const apiKey = process.env.BREVO_API_KEY;

  for (const evt of events) {
    const eventType = evt?.event;
    const email = evt?.email;
    if (!email || !['hard_bounce', 'hardBounce', 'blocked', 'error'].includes(eventType)) continue;

    try {
      await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          unlinkListIds: CLEANUP_LIST_IDS,
          emailBlacklisted: true,
        }),
      });
      console.log(`Bounce cleanup: ${email} (${eventType})`);
    } catch (err) {
      console.error('Bounce cleanup error:', email, err);
    }
  }

  return res.status(200).json({ received: true });
}

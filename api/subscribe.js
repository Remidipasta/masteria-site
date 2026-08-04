import dns from 'dns';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

// Domaines jetables les plus courants — bloqués car ils ne mènent jamais à une
// vraie relation avec le lead (boîte à usage unique, souvent vidée en quelques minutes).
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'guerrillamail.info',
  'temp-mail.org', 'tempmail.com', 'throwawaymail.com', '10minutemail.com',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'maildrop.cc',
  'mailnesia.com', 'fakeinbox.com', 'dispostable.com', 'mintemail.com',
  'moakt.com', 'emailondeck.com', 'discard.email', 'spambog.com',
]);

function hasMxOrA(domain) {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) return resolve(true);
      // Fallback RFC 5321 : en l'absence de MX, un enregistrement A est valide.
      dns.resolve4(domain, (err2, addrs) => {
        resolve(!err2 && addrs && addrs.length > 0);
      });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, source } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1];

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return res.status(400).json({ error: 'Merci d\'utiliser une adresse email permanente' });
  }

  const domainIsReachable = await hasMxOrA(domain);
  if (!domainIsReachable) {
    return res.status(400).json({ error: 'Ce domaine email ne semble pas exister' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuration manquante' });
  }

  // Liste Brevo par source (lead magnet)
  const listMap = {
    simulateur: 9,
    frais: 10,
    checklist: 11,
    audit: 12,
  };
  const listId = listMap[source];

  // Double opt-in : le contact ne rejoint la liste qu'après avoir cliqué le
  // lien de confirmation reçu par email — garantit une adresse réellement
  // relevée, pas seulement un domaine qui existe.
  const DOI_TEMPLATE_ID = 38;

  try {
    const createRes = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        includeListIds: listId ? [listId] : [],
        templateId: DOI_TEMPLATE_ID,
        redirectionUrl: `https://masteriagroup.com/${source || ''}`,
        attributes: name ? { PRENOM: name } : {},
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error('Brevo error:', createRes.status, errBody);
      return res.status(500).json({ error: 'Erreur inscription' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

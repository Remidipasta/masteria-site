export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, source } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
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

  try {
    const createRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        listIds: listId ? [listId] : [],
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

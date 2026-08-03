export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, source } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const apiKey = process.env.SYSTEME_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuration manquante' });
  }

  // Tags par source (lead magnet)
  const tagMap = {
    simulateur:  'lead-simulateur',
    audit:       'lead-audit',
    frais:       'lead-frais',
    checklist:   'lead-checklist',
  };
  const tagName = tagMap[source] || 'lead-masteria';

  try {
    // Créer ou mettre à jour le contact dans Systeme.io
    const createRes = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        email,
        firstName: name || '',
        fields: [],
        tags: [{ name: tagName }],
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error('Systeme.io error:', createRes.status, errBody);
      // On renvoie success quand même si contact déjà existant (409)
      if (createRes.status !== 409) {
        return res.status(500).json({ error: 'Erreur inscription' });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dipasang di Vercel' });
  }

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: text || 'Halo' }] }]
  });

  const options = {
    hostname: '//googleapis.com',
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (response.statusCode !== 200) {
            res.status(response.statusCode).json({
              error: data.error?.message || `Error HTTP ${response.statusCode}`
            });
            return resolve();
          }
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada jawaban.';
          res.status(200).json({ reply });
          resolve();
        } catch (err) {
          res.status(500).json({ error: 'Gagal membaca balasan AI: ' + err.message });
          resolve();
        }
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ error: 'Koneksi ke Google gagal: ' + err.message });
      resolve();
    });

    request.write(payload);
    request.end();
  });
};

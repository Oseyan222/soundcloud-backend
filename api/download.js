const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'SoundCloud linki eksik.' });
  }

  try {
    // 1. SoundCloud linkini sclouddownloader.net'e POST et
    const formData = new URLSearchParams();
    formData.append('url', url);

    const response = await fetch('https://sclouddownloader.net/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const html = await response.text();

    // 2. Gelen HTML'den indirilebilir yeni sayfa linkini bul
    const $ = cheerio.load(html);
    const downloadLink = $('a.button').attr('href');

    if (!downloadLink) {
      return res.status(404).json({ error: 'İndirme linki bulunamadı.' });
    }

    // 3. Şimdi download linkine GET isteği atıp MP3 linki çıkar
    const finalPage = await fetch(downloadLink);
    const finalHtml = await finalPage.text();
    const $$ = cheerio.load(finalHtml);

    const mp3Url = $$('audio source').attr('src');

    if (!mp3Url) {
      return res.status(404).json({ error: 'MP3 bulunamadı.' });
    }

    return res.status(200).json({ mp3: mp3Url });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

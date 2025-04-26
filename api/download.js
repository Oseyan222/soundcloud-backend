export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'SoundCloud linki eksik.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('url', url);

    const response = await fetch('https://sclouddownloader.net/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
      },
      body: formData.toString(),
    });

    const html = await response.text();

    const downloadLinkMatch = html.match(/href="(https:\/\/[^"]+\/download\/[^"]+)"/);

    if (!downloadLinkMatch) {
      return new Response(JSON.stringify({ error: 'İndirme linki bulunamadı.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const downloadLink = downloadLinkMatch[1];

    const finalPage = await fetch(downloadLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
      }
    });
    const finalHtml = await finalPage.text();

    const mp3UrlMatch = finalHtml.match(/<source src="([^"]+)" type="audio\/mpeg">/);

    if (!mp3UrlMatch) {
      return new Response(JSON.stringify({ error: 'MP3 bulunamadı.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mp3Url = mp3UrlMatch[1];

    return new Response(JSON.stringify({ mp3: mp3Url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Sunucu hatası.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

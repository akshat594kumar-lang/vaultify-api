import ytdl from 'ytdl-core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'No video id provided' });
  }
  
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    
    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    });
    
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (!audioFormats || audioFormats.length === 0) {
      return res.status(500).json({ error: 'No audio formats found' });
    }
    
    audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
    const best = audioFormats[0];
    
    res.status(200).json({
      url: best.url,
      bitrate: best.audioBitrate,
      mimeType: best.mimeType,
      title: info.videoDetails.title,
      artist: info.videoDetails.author.name,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Extraction failed', 
      details: error.message 
    });
  }
}
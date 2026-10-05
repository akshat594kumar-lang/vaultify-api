import ytdl from '@distube/ytdl-core';

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
    
    // Get info
    const info = await ytdl.getInfo(videoUrl);
    
    // Filter audio-only formats
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (!audioFormats || audioFormats.length === 0) {
      return res.status(500).json({ error: 'No audio formats found' });
    }
    
    // Sort by bitrate
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
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'No video id provided' });
  }
  
  try {
    // Use YouTube's public API to get audio info
    const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            androidSdkVersion: 30,
            userAgent: 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
            hl: 'en',
            timeZone: 'UTC',
            utcOffsetMinutes: 0
          }
        },
        videoId: id,
        contentCheckOk: true,
        racyCheckOk: true
      })
    });
    
    const data = await response.json();
    
    if (!data.streamingData || !data.streamingData.adaptiveFormats) {
      return res.status(500).json({ error: 'No audio streams found' });
    }
    
    // Find best audio stream
    const audioStreams = data.streamingData.adaptiveFormats.filter(f => 
      f.mimeType && f.mimeType.startsWith('audio/')
    );
    
    if (audioStreams.length === 0) {
      return res.status(500).json({ error: 'No audio available' });
    }
    
    // Sort by bitrate
    audioStreams.sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
    const best = audioStreams[0];
    
    res.status(200).json({
      url: best.url,
      bitrate: best.bitrate,
      mimeType: best.mimeType
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Extraction failed', details: error.message });
  }
}

const WebSocket = require('ws');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const voice = 'id-ID-GadisNeural';
  const timestamp = Date.now();
  
  const ws = new WebSocket(`wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9B87E7851A984158A1`);
  
  let audioBuffer = Buffer.alloc(0);
  
  ws.on('open', () => {
    const configPay = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"system":{"name":"SpeechSDK","version":"1.12.1-rc.1","os":{"platform":"Browser","name":"Chrome","version":"120.0.0"},"device":{"manufacturer":"SpeechSDK","model":"SpeechSDK","type":"Desktop"}}}}`;
    ws.send(configPay);
    
    const ssmlPay = `X-Timestamp:${timestamp}\r\nPath:ssml\r\nContent-Type:application/ssml+xml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='id-ID'><voice name='${voice}'><prosody pitch='+0Hz' rate='+4%'>${text}</prosody></voice></speak>`;
    ws.send(ssmlPay);
  });
  
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      const separator = Buffer.from('\r\n\r\n');
      const index = data.indexOf(separator);
      if (index !== -1) {
        const payload = data.slice(index + 4);
        audioBuffer = Buffer.concat([audioBuffer, payload]);
      }
    } else {
      const msg = data.toString();
      if (msg.includes('turn.end')) {
        ws.close();
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(audioBuffer);
      }
    }
  });
  
  ws.on('error', (err) => {
    console.error('Edge TTS Socket Error:', err);
    if (!res.writableEnded) {
      res.status(500).json({ error: err.message });
    }
  });
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

declare const __dirname: string;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Audio cache to serve instant responses without re-requesting identical phrases
const audioCache = new Map<string, Buffer>();

// 1. ENDPOINT DE VOZ NEURAL COLOMBIANA GRATUITA (MICROSOFT EDGE TTS - CERO APIS, CERO COSTO)
app.get('/api/tts', async (req, res) => {
  const text = (req.query.text as string || '').trim();
  const voice = (req.query.voice as string || 'es-CO-GonzaloNeural'); // Gonzalo Neural (Acento Colombiano Natural)

  if (!text) {
    res.status(400).send('Text is required');
    return;
  }

  const cacheKey = `${voice}:${text}`;
  if (audioCache.has(cacheKey)) {
    const cached = audioCache.get(cacheKey)!;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(cached);
    return;
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const readable = tts.toStream(text);
    const chunks: Buffer[] = [];

    readable.on('data', (chunk: Buffer) => chunks.push(chunk));
    readable.on('end', () => {
      const audioBuffer = Buffer.concat(chunks);
      if (audioCache.size > 300) {
        audioCache.clear();
      }
      audioCache.set(cacheKey, audioBuffer);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(audioBuffer);
    });
    readable.on('error', (err: any) => {
      console.error('Edge TTS Stream Error:', err);
      if (!res.headersSent) res.status(500).send('TTS streaming failed');
    });
  } catch (err: any) {
    console.error('Edge TTS General Error:', err);
    if (!res.headersSent) res.status(500).send('TTS generation failed');
  }
});

// 2. ENDPOINT ELEVENLABS (CON VOZ JUAN F 'xWKjCHKgvEuUUiyfjRX1' SI EL USUARIO PEGA SU API KEY)
app.post('/api/tts-elevenlabs', async (req, res) => {
  const { text, apiKey, voiceId } = req.body;
  const targetVoice = voiceId || 'xWKjCHKgvEuUUiyfjRX1'; // Juan F (Colombian Voice)

  if (!apiKey || !text) {
    res.status(400).json({ error: 'API key y texto requeridos' });
    return;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).send(errText);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).send(err.message || 'Error en ElevenLabs');
  }
});

// Determine static dist directory whether executed from root or inside dist/
const distDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : __dirname;

console.log('Serving static files from:', distDir);

// Serve static frontend files
app.use(express.static(distDir));

// Fallback for Single Page Application (SPA) routing
app.use((req, res) => {
  res.sendFile('index.html', { root: distDir });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 iAlcaldía Servidor Express con TTS Neural corriendo en el puerto ${PORT}`);
});

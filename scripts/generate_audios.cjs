const fs = require('fs');
const path = require('path');

const legendsPath = path.join(__dirname, '../src/data/legends.json');
const audioOutputDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioOutputDir)) {
  fs.mkdirSync(audioOutputDir, { recursive: true });
}

const legends = JSON.parse(fs.readFileSync(legendsPath, 'utf8'));

// Helper to chunk text into sentence pieces < 150 characters
function splitIntoChunks(text, maxLength = 140) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];

  for (let s of sentences) {
    s = s.trim();
    if (!s) continue;
    if (s.length <= maxLength) {
      chunks.push(s);
    } else {
      // split by commas or words
      const words = s.split(' ');
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).length <= maxLength) {
          current = current ? current + ' ' + w : w;
        } else {
          if (current) chunks.push(current);
          current = w;
        }
      }
      if (current) chunks.push(current);
    }
  }
  return chunks;
}

async function fetchAudioChunk(chunk) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=es&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch chunk: ${res.statusText} (${res.status})`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function generateLegendAudio(legend) {
  const text = `${legend.title}. ${legend.shortDescription} ${legend.fullStory}`;
  const chunks = splitIntoChunks(text);
  console.log(`Processing [${legend.id}] ${legend.title} (${chunks.length} chunks)...`);

  const buffers = [];
  for (const chunk of chunks) {
    try {
      const buf = await fetchAudioChunk(chunk);
      buffers.push(buf);
      // Small polite delay between chunks
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`  Error in chunk "${chunk.substring(0, 30)}...":`, err.message);
    }
  }

  if (buffers.length > 0) {
    const finalMp3 = Buffer.concat(buffers);
    const destPath = path.join(audioOutputDir, `${legend.id}.mp3`);
    fs.writeFileSync(destPath, finalMp3);
    console.log(`  ✓ Saved ${legend.id}.mp3 (${Math.round(finalMp3.length / 1024)} KB)`);
  }
}

async function main() {
  console.log(`Generating narration audio for ${legends.length} legends...`);
  for (const legend of legends) {
    await generateLegendAudio(legend);
    // Brief pause between legends
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('All audios generated successfully!');
}

main().catch(console.error);

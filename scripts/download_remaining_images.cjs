const fs = require('fs');
const path = require('path');

const images = [
  {
    name: 'monstruo-arenal.jpg',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'tesoro-piratas.jpg',
    url: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6e2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'padre-sin-cabeza.jpg',
    url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'barco-fantasma.jpg',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'la-mona.jpg',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'diablo-cartago.jpg',
    url: 'https://images.unsplash.com/photo-1548625361-195973796ec5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'llorona-tortuguero.jpg',
    url: 'https://images.unsplash.com/photo-1475727946784-2890c8fdb9c8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'nino-cerro-muerte.jpg',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1200&q=80'
  }
];

const targetDir = path.join(__dirname, '../public/images');

async function downloadAll() {
  for (const item of images) {
    const dest = path.join(targetDir, item.name);
    console.log(`Downloading ${item.name}...`);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`  ✓ Saved ${item.name} (${Math.round(buf.length / 1024)} KB)`);
    } catch (err) {
      console.error(`  ✗ Error downloading ${item.name}:`, err.message);
    }
  }
  console.log('Finished downloading remaining images.');
}

downloadAll();

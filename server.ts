import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log(`🚀 iAlcaldía Servidor Express corriendo en el puerto ${PORT}`);
});

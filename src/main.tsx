import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadAssetManifest } from './data/assetManifest';

async function bootstrap() {
  await loadAssetManifest();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();

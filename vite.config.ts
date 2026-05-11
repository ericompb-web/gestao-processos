import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Remove crossorigin to allow file:// load in Electron
const removeCrossorigin = () => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html: string) {
    return html.replace(/ crossorigin/g, '');
  },
});

export default defineConfig(() => {
  const isElectron = process.env.IS_ELECTRON === 'true';

  return {
    base: isElectron ? './' : '/',
    plugins: [
      react(),
      basicSsl(),
      ...(isElectron ? [removeCrossorigin()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Gestão de Processos',
          short_name: 'Processos',
          theme_color: '#22c55e',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            // We can add actual icons later if needed
            /*
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
            */
          ]
        }
      })
    ],
  };
});

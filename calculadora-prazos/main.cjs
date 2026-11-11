'use strict';
const { app, BrowserWindow, ipcMain, net, shell } = require('electron');
const path = require('path');

const ORIGEM_TJAC = 'https://www.tjac.jus.br/';

function criarJanela() {
  const win = new BrowserWindow({
    width: 1120, height: 820, minWidth: 820, minHeight: 600,
    title: 'Calculadora de Prazos PGE-AC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // O aplicativo não navega para fora: links externos abrem no navegador padrão (somente https).
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

// Única chamada de rede do aplicativo: leitura da página pública do calendário do TJAC.
ipcMain.handle('tjac:buscar', async (_evento, ano) => {
  if (!/^\d{4}$/.test(String(ano))) throw new Error('Ano inválido.');
  const url = `${ORIGEM_TJAC}adm/calendarios/calendario-${ano}/`;
  const resp = await net.fetch(url, { credentials: 'omit', cache: 'no-store' });
  const texto = resp.status === 200 ? await resp.text() : '';
  return { status: resp.status, texto };
});

app.whenReady().then(() => {
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

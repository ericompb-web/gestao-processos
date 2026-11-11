'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('prazosNativo', {
  buscarCalendarioTjac: (ano) => ipcRenderer.invoke('tjac:buscar', Number(ano))
});

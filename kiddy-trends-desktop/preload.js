const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getProducts: (limit, offset) => ipcRenderer.invoke('get-products', { limit, offset }),
  updateProduct: (id, updates) => ipcRenderer.invoke('update-product', { id, updates }),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  manualSync: () => ipcRenderer.invoke('manual-sync'),
  onSyncUpdate: (callback) => ipcRenderer.on('sync-update', callback),
})

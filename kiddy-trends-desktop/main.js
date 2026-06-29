const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const db = require('./database')
const sync = require('./sync')

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  })

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`
  mainWindow.loadURL(startUrl)

  if (process.env.ELECTRON_DEV_MODE) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', () => {
  createWindow()
  setupIPC()
  setupMenu()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.close()
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const setupIPC = () => {
  ipcMain.handle('add-product', async (event, product) => {
    try {
      const result = await db.addProduct(product)
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-products', async (event, { limit, offset }) => {
    try {
      const products = await db.getProducts(limit, offset)
      return { success: true, products }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('update-product', async (event, { id, updates }) => {
    try {
      const result = await db.updateProduct(id, updates)
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('delete-product', async (event, id) => {
    try {
      const result = await db.deleteProduct(id)
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-sync-status', async () => {
    try {
      const status = await sync.getSyncStatus()
      return { success: true, pending: status.total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('manual-sync', async () => {
    try {
      await sync.manualSync()
      const status = await sync.getSyncStatus()
      return { success: true, pending: status.total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

const setupMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

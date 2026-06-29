const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const os = require('os')

const dbPath = path.join(os.homedir(), '.kiddy-trends', 'products.db')

class Database {
  constructor() {
    this.db = null
    this.init()
  }

  init() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err)
      } else {
        console.log('Connected to local database:', dbPath)
        this.createTables()
      }
    })
  }

  createTables() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          price REAL,
          compare_at_price REAL,
          stock INTEGER DEFAULT 0,
          images TEXT,
          variants TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      this.db.run(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          action TEXT NOT NULL,
          data TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `)

      this.db.run(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT,
          action TEXT,
          status TEXT,
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    })
  }

  addProduct(product) {
    return new Promise((resolve, reject) => {
      const { id, title, description, category, price, compare_at_price, stock, images, variants } = product
      this.db.run(
        `INSERT OR REPLACE INTO products 
         (id, title, description, category, price, compare_at_price, stock, images, variants, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, title, description, category, price, compare_at_price, stock, JSON.stringify(images), JSON.stringify(variants)],
        function(err) {
          if (err) reject(err)
          else {
            // Add to sync queue
            this.addToSyncQueue(id, 'create', product)
            resolve({ id, success: true })
          }
        }.bind(this)
      )
    })
  }

  getProducts(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err)
          else {
            const products = rows.map(row => ({
              ...row,
              images: JSON.parse(row.images || '[]'),
              variants: JSON.parse(row.variants || '[]')
            }))
            resolve(products)
          }
        }
      )
    })
  }

  updateProduct(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ')
      const values = Object.values(updates)
      this.db.run(
        `UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) reject(err)
          else {
            this.addToSyncQueue(id, 'update', updates)
            resolve({ id, success: true })
          }
        }.bind(this)
      )
    })
  }

  deleteProduct(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM products WHERE id = ?`,
        [id],
        function(err) {
          if (err) reject(err)
          else {
            this.addToSyncQueue(id, 'delete', { id })
            resolve({ id, success: true })
          }
        }.bind(this)
      )
    })
  }

  addToSyncQueue(productId, action, data) {
    this.db.run(
      `INSERT INTO sync_queue (product_id, action, data) VALUES (?, ?, ?)`,
      [productId, action, JSON.stringify(data)],
      (err) => {
        if (err) console.error('Sync queue error:', err)
      }
    )
  }

  getSyncQueue() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC`,
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  }

  updateSyncStatus(queueId, status, message = '') {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE sync_queue SET status = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, queueId],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

module.exports = new Database()

const { createClient } = require('@supabase/supabase-js')
const db = require('./database')

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-supabase.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class Sync {
  constructor() {
    this.syncing = false
    this.syncInterval = 30000
    this.startAutoSync()
  }

  startAutoSync() {
    setInterval(() => this.syncAll(), this.syncInterval)
  }

  async syncAll() {
    if (this.syncing) return
    this.syncing = true

    try {
      const queue = await db.getSyncQueue()
      if (queue.length === 0) {
        this.syncing = false
        return
      }

      console.log(`Syncing ${queue.length} items...`)

      for (const item of queue) {
        try {
          await this.syncItem(item)
        } catch (err) {
          console.error(`Sync error for ${item.product_id}:`, err.message)
          await db.updateSyncStatus(item.id, 'error', err.message)
        }
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      this.syncing = false
    }
  }

  async syncItem(queueItem) {
    const { id, product_id, action, data: dataStr } = queueItem
    const data = JSON.parse(dataStr)

    try {
      if (action === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([data])
          .select()
          .single()

        if (error) throw error
        await db.updateSyncStatus(id, 'synced')
        console.log(`✅ Created product: ${product_id}`)
      } else if (action === 'update') {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product_id)
          .select()
          .single()

        if (error) throw error
        await db.updateSyncStatus(id, 'synced')
        console.log(`✅ Updated product: ${product_id}`)
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product_id)

        if (error) throw error
        await db.updateSyncStatus(id, 'synced')
        console.log(`✅ Deleted product: ${product_id}`)
      }
    } catch (err) {
      throw new Error(`Failed to ${action} product: ${err.message}`)
    }
  }

  async manualSync() {
    return await this.syncAll()
  }

  getSyncStatus() {
    return new Promise((resolve, reject) => {
      db.db.get(
        `SELECT COUNT(*) as total FROM sync_queue WHERE status = 'pending'`,
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  }
}

module.exports = new Sync()

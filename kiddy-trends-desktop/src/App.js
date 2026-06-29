import React, { useState, useEffect } from 'react'
import './App.css'
import ProductForm from './components/ProductForm'
import ProductList from './components/ProductList'
import SyncStatus from './components/SyncStatus'

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncPending, setSyncPending] = useState(0)
  const [editingProduct, setEditingProduct] = useState(null)
  const [view, setView] = useState('list') // 'list' or 'form'

  useEffect(() => {
    loadProducts()
    checkSyncStatus()
    const interval = setInterval(checkSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadProducts() {
    try {
      const result = await window.electron.getProducts(100, 0)
      if (result.success) {
        setProducts(result.products)
      }
    } catch (err) {
      console.error('Error loading products:', err)
    }
    setLoading(false)
  }

  async function checkSyncStatus() {
    try {
      const result = await window.electron.getSyncStatus()
      if (result.success) {
        setSyncPending(result.pending)
      }
    } catch (err) {
      console.error('Sync status error:', err)
    }
  }

  async function handleAddProduct(product) {
    try {
      const result = await window.electron.addProduct(product)
      if (result.success) {
        alert('✅ Product added! Will sync when online.')
        setEditingProduct(null)
        setView('list')
        loadProducts()
        checkSyncStatus()
      } else {
        alert('❌ Error: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleUpdateProduct(id, updates) {
    try {
      const result = await window.electron.updateProduct(id, updates)
      if (result.success) {
        alert('✅ Product updated! Will sync when online.')
        setEditingProduct(null)
        setView('list')
        loadProducts()
        checkSyncStatus()
      } else {
        alert('❌ Error: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product? It will be marked for deletion.')) return

    try {
      const result = await window.electron.deleteProduct(id)
      if (result.success) {
        alert('✅ Product deleted!')
        loadProducts()
        checkSyncStatus()
      } else {
        alert('❌ Error: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleManualSync() {
    try {
      const result = await window.electron.manualSync()
      if (result.success) {
        alert('✅ Sync completed!')
        setSyncPending(result.pending)
      } else {
        alert('❌ Sync failed: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>📦 Kiddy Trends Desktop</h1>
          <p>Offline Product Manager</p>
        </div>
        <SyncStatus pending={syncPending} onSync={handleManualSync} />
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <button
          className={`nav-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          📋 Products List
        </button>
        <button
          className={`nav-btn ${view === 'form' ? 'active' : ''}`}
          onClick={() => {
            setEditingProduct(null)
            setView('form')
          }}
        >
          ➕ Add Product
        </button>
      </nav>

      {/* Content */}
      <main className="app-main">
        {view === 'list' ? (
          <ProductList
            products={products}
            loading={loading}
            onEdit={(product) => {
              setEditingProduct(product)
              setView('form')
            }}
            onDelete={handleDeleteProduct}
          />
        ) : (
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? (updates) => handleUpdateProduct(editingProduct.id, updates) : handleAddProduct}
            onCancel={() => {
              setEditingProduct(null)
              setView('list')
            }}
          />
        )}
      </main>
    </div>
  )
}

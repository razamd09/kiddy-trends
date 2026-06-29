import React, { useState, useEffect } from 'react'

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    category: '',
    price: '',
    compare_at_price: '',
    stock: '',
    images: [],
    variants: [],
  })

  useEffect(() => {
    if (product) {
      setForm(product)
    }
  }, [product])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.stock) {
      alert('Please fill in required fields: Title, Price, Stock')
      return
    }
    onSubmit(form)
  }

  return (
    <div className="product-form">
      <h2>{product ? '✏️ Edit Product' : '➕ Add New Product'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Title *</label>
          <input
            type="text"
            placeholder="e.g. Baby Soft T-Shirt"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Product description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Clothing">Clothing</option>
              <option value="Bedding">Bedding</option>
              <option value="Bags">Bags</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="form-group">
            <label>Price (PKR) *</label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Compare At Price</label>
            <input
              type="number"
              placeholder="e.g. 2000"
              value={form.compare_at_price}
              onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) })}
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Stock *</label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {product ? '💾 Update' : '➕ Add Product'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

import React from 'react'

export default function ProductList({ products, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="loading">⏳ Loading products...</div>
  }

  return (
    <div className="product-list">
      <h2>📋 Products ({products.length})</h2>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>📭 No products yet. Add your first product!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-title">
                      <strong>{product.title}</strong>
                      {product.description && <p className="description">{product.description}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{product.category || 'N/A'}</span>
                  </td>
                  <td>
                    <strong>PKR {product.price?.toLocaleString() || 0}</strong>
                    {product.compare_at_price && (
                      <p className="compare-price">Was: PKR {product.compare_at_price?.toLocaleString()}</p>
                    )}
                  </td>
                  <td>
                    <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => onEdit(product)} className="btn-edit">
                        ✏️ Edit
                      </button>
                      <button onClick={() => onDelete(product.id)} className="btn-delete">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

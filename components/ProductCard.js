import Link from 'next/link'

export default function ProductCard({ product }) {
  const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (product.image || '');
  const href = product.handle ? `/products/${product.handle}` : `/products/${product.id}`;

  return (
    <Link href={href} className="block p-3 bg-white rounded-lg shadow-sm hover:shadow-md">
      {firstImage ? (
        <img src={firstImage} alt={product.title} className="w-full h-40 object-cover rounded-md mb-2" />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded-md mb-2" />
      )}
      <h3 className="text-sm font-semibold text-charcoal">{product.title}</h3>
      <p className="text-xs text-gray-500">{product.category}</p>
      <p className="text-sm font-semibold text-coral">PKR {product.price?.toLocaleString?.() ?? product.price}</p>
    </Link>
  )
}

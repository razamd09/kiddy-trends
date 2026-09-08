import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function AdminProductBrandsPage() {
    return (
        <ProductMetadataManager
            title="Product Brands"
            subtitle="Manage product brand dropdown values"
            apiPath="/api/admin/product-brands"
            responseKey="brands"
            singularLabel="Brand"
            showImageField={true}
        />
    )
}

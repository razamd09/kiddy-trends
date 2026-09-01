import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function AdminProductFabricsPage() {
    return (
        <ProductMetadataManager
            title="Product Fabrics"
            subtitle="Manage product fabric dropdown values"
            apiPath="/api/admin/product-fabrics"
            responseKey="fabrics"
            singularLabel="Fabric"
        />
    )
}

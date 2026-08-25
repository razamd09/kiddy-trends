import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function AdminProductTypesPage() {
    return (
        <ProductMetadataManager
            title="Product Types"
            subtitle="Manage product type dropdown values"
            apiPath="/api/admin/product-types"
            responseKey="types"
            singularLabel="Product Type"
        />
    )
}
import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function EmployeeProductTypesPage() {
    return (
        <ProductMetadataManager
            title="Product Types"
            subtitle="Manage product type dropdown values"
            apiPath="/api/admin/product-types"
            responseKey="types"
            singularLabel="Product Type"
            authMode="employee"
        />
    )
}
import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function EmployeeProductVersionsPage() {
    return (
        <ProductMetadataManager
            title="Product Versions"
            subtitle="Manage product version dropdown values"
            apiPath="/api/admin/product-versions"
            responseKey="versions"
            singularLabel="Version"
            authMode="employee"
        />
    )
}
import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function EmployeeProductBrandsPage() {
    return (
        <ProductMetadataManager
            title="Product Brands"
            subtitle="Manage product brand dropdown values"
            apiPath="/api/admin/product-brands"
            responseKey="brands"
            singularLabel="Brand"
            authMode="employee"
            showImageField={true}
        />
    )
}

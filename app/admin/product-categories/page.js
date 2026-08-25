import ProductMetadataManager from '../../../components/ProductMetadataManager'

export default function AdminProductCategoriesPage() {
    return (
        <ProductMetadataManager
            title="Product Categories"
            subtitle="Manage product category dropdown values"
            apiPath="/api/admin/product-categories"
            responseKey="categories"
            singularLabel="Category"
        />
    )
}
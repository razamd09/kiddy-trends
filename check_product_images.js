#!/usr/bin/env node
/**
 * Check what images are stored in products in the database
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function checkProductImages() {
    console.log('Checking product images in database...\n')

    try {
        // Get all products
        const { data: products, error } = await supabase
            .from('products')
            .select('id, title, images, is_active')
            .limit(10)

        if (error) {
            console.error('Error fetching products:', error)
            return
        }

        console.log(`Found ${products.length} products:\n`)

        for (const product of products) {
            console.log(`Product: ${product.title} (ID: ${product.id})`)
            console.log(`  Active: ${product.is_active}`)
            
            let images = product.images
            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images)
                } catch (e) {
                    // Keep as string
                }
            }

            if (Array.isArray(images)) {
                console.log(`  Images: ${images.length} total`)
                images.forEach((img, i) => {
                    const url = typeof img === 'string' ? img : img?.src
                    console.log(`    [${i}] ${url ? url.substring(0, 80) : '(empty)'}`)
                })
            } else if (typeof images === 'string' && images.trim()) {
                console.log(`  Images (string): ${images.substring(0, 100)}...`)
            } else {
                console.log(`  Images: (empty or null)`)
            }
            console.log()
        }

        // Get count of products with empty images
        const { data: allProducts } = await supabase
            .from('products')
            .select('id, images', { count: 'exact' })

        const withImages = allProducts.filter(p => {
            let img = p.images
            if (typeof img === 'string') {
                try {
                    img = JSON.parse(img)
                } catch (e) {
                    return img && img.trim()
                }
            }
            return Array.isArray(img) ? img.length > 0 : false
        })

        console.log(`\n📊 Summary:`)
        console.log(`  Total products: ${allProducts.length}`)
        console.log(`  Products with images: ${withImages.length}`)
        console.log(`  Products without images: ${allProducts.length - withImages.length}`)

    } catch (err) {
        console.error('Unexpected error:', err)
    }

    process.exit(0)
}

checkProductImages()

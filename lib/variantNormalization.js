function normalizeVariantValue(value) {
    const text = String(value || '').trim()
    if (!text) return ''

    if (/^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$/i.test(text)) {
        if (/years?|yrs?|yr/i.test(text)) return '5-6 Year'
        if (/y$/i.test(text)) return '5-6Y'
        return '5-6'
    }

    return text.replace(/\s+/g, ' ').trim()
}

function normalizeVariantRecord(variant) {
    if (!variant || typeof variant !== 'object') return variant

    return {
        ...variant,
        option1_value: normalizeVariantValue(variant.option1_value),
        option2_value: normalizeVariantValue(variant.option2_value),
        option3_value: normalizeVariantValue(variant.option3_value),
        title: normalizeVariantValue(variant.title),
        name: normalizeVariantValue(variant.name),
        size: normalizeVariantValue(variant.size),
    }
}

function normalizeVariants(variants) {
    if (!Array.isArray(variants)) return []
    return variants.map(normalizeVariantRecord)
}

// Applied only when a product is first created (never on later edits — an
// admin manually zeroing out a variant's stock to mark it sold out is a
// legitimate action). Catches the case where a blank/zero quantity was left
// on a variant while adding a product, which otherwise shows as sold out on
// the site with no obvious cause.
function ensureMinimumVariantStock(variants) {
    if (!Array.isArray(variants)) return []
    return variants.map((variant) => {
        const qty = parseInt(variant?.inventory_qty, 10)
        return {
            ...variant,
            inventory_qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
        }
    })
}

export { normalizeVariantRecord, normalizeVariantValue, normalizeVariants, ensureMinimumVariantStock }
// Age-bracket keyword matching for the product page's "more in this size"
// swipe navigation — separate from (and slightly finer-grained than) the
// /collections page's own age filter, matching the 0-3M..9-10Year taxonomy
// used by Bulk Product Upload's SIZE_BRACKETS.
export const AGE_BRACKETS = [
    { id: '0-3m',   label: '0–3 Months',   keywords: ['0-3', '0 to 3', '0/3'] },
    { id: '3-6m',   label: '3–6 Months',   keywords: ['3-6', '3 to 6', '3/6'] },
    { id: '6-9m',   label: '6–9 Months',   keywords: ['6-9', '6 to 9', '6/9'] },
    { id: '9-12m',  label: '9–12 Months',  keywords: ['9-12', '9 to 12', '9/12'] },
    { id: '12-18m', label: '12–18 Months', keywords: ['12-18', '12 to 18', '12/18'] },
    { id: '18-24m', label: '18–24 Months', keywords: ['18-24', '18 to 24', '18/24'] },
    { id: '2-3y',   label: '2–3 Year',     keywords: ['2-3', '2 to 3', '2/3'] },
    { id: '3-4y',   label: '3–4 Year',     keywords: ['3-4', '3 to 4', '3/4'] },
    { id: '4-5y',   label: '4–5 Year',     keywords: ['4-5', '4 to 5', '4/5'] },
    { id: '5-6y',   label: '5–6 Year',     keywords: ['5-6', '5 to 6', '5/6'] },
    { id: '6-7y',   label: '6–7 Year',     keywords: ['6-7', '6 to 7', '6/7'] },
    { id: '7-8y',   label: '7–8 Year',     keywords: ['7-8', '7 to 8', '7/8'] },
    { id: '8-9y',   label: '8–9 Year',     keywords: ['8-9', '8 to 9', '8/9'] },
    { id: '9-10y',  label: '9–10 Year',    keywords: ['9-10', '9 to 10', '9/10'] },
]

export function getProductAgeText(product) {
    return [
        product?.title,
        product?.product_type,
        ...(Array.isArray(product?.tags) ? product.tags : []),
        ...(Array.isArray(product?.variants) ? product.variants.map((v) =>
            [v?.title, v?.option1, v?.option2].filter(Boolean).join(' ')
        ) : []),
    ].filter(Boolean).join(' ').toLowerCase()
}

// Which bracket a single size label (e.g. a selected variant's "0-3M" or
// "2-3 Year") belongs to — used to decide what "same age" means for the
// product currently on screen.
export function ageIdForLabel(label) {
    const text = String(label || '').toLowerCase()
    const bracket = AGE_BRACKETS.find((b) => b.keywords.some((kw) => text.includes(kw)))
    return bracket ? bracket.id : null
}

export function ageBracketLabel(ageId) {
    return AGE_BRACKETS.find((b) => b.id === ageId)?.label || ''
}

export function productMatchesAgeId(product, ageId) {
    const bracket = AGE_BRACKETS.find((b) => b.id === ageId)
    if (!bracket) return false
    const text = getProductAgeText(product)
    return bracket.keywords.some((kw) => text.includes(kw))
}

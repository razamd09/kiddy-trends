const FABRIC_KEYWORD_MAP = [
    { re: /\bterry\b/i, value: 'Terry' },
    { re: /\bjersy\b|\bjersey\b/i, value: 'Jersy' },
    { re: /\bfleece\b/i, value: 'Fleece' },
    { re: /\bsilk\s*cotton\b/i, value: 'Silk Cotton' },
    { re: /\bsilk\b/i, value: 'Silk' },
    { re: /\bdenim\b|\bjeans?\b/i, value: 'Denim' },
    { re: /\bcotton\b/i, value: 'Cotton' },
]

// Checked in order — more specific combinations (e.g. "jeans short") must be
// tested before their generic parent word (e.g. "short") to win the match.
const PRODUCT_TYPE_KEYWORD_MAP = [
    { re: /\bjeans?\s*shorts?\b/i, value: 'Jeans Shorts' },
    { re: /\bcargo\s*(pent|pants?)\b/i, value: 'Cargo Pents' },
    { re: /\bcargo\s*trousers?\b/i, value: 'Cargo Trousers' },
    { re: /\bfleece\s*trousers?\b/i, value: 'Fleece Trousers' },
    { re: /\bterry\s*trousers?\b/i, value: 'Terry Trousers' },
    { re: /\bkurta\s*trousers?\b/i, value: 'Kurta Trouser' },
    { re: /\bribbed\s*footed\s*trousers?\b/i, value: 'Ribbed Footed Trouser' },
    { re: /\bjeans?\s*(pant|trouser|pants?)?\b/i, value: 'Denim Jeans' },
    { re: /\bdenim\b/i, value: 'Denim Jeans' },
    { re: /\bsweat\s*shirt\b/i, value: 'Sweat Shirt' },
    { re: /\btrack\s*suit\b/i, value: 'Track Suit' },
    { re: /\bhoodie\b/i, value: 'Hoodie' },
    { re: /\bsweaters?\b/i, value: 'Sweaters' },
    { re: /\bwaist\s*coat\b/i, value: 'Waistcoat' },
    { re: /\bromper\b/i, value: 'Rompers' },
    { re: /\bfrock\b/i, value: 'Frock' },
    { re: /\btights?\b/i, value: 'Tights' },
    { re: /\bmock\s*neck\b/i, value: 'Mock Neck' },
    { re: /\bnecklace\b/i, value: 'Necklace' },
    { re: /\bscarf\b|\bstawler\b/i, value: 'Girls Stawler/Scarf' },
    { re: /\bkurti\s*with\s*gharara\b/i, value: 'Girls Kurti with Gharara' },
    { re: /\bkurti\s*with\s*trousers?\b/i, value: 'Girls Kurti with Trouser' },
    { re: /\bkurti\b/i, value: 'Girls Kurti' },
    { re: /\bboys?\s*kurta\b|\bkurta\b/i, value: 'Boys Kurta' },
    { re: /\bjacket\b/i, value: 'Jacket' },
    { re: /\bbutton\s*shirts?\b/i, value: 'Button Shirts' },
    { re: /\bterry\s*shirt\b/i, value: 'Terry Shirt' },
    { re: /\bfleece\s*shirt\b/i, value: 'Fleece Shirt' },
    { re: /\bfull\s*sleeves?\s*shirt\b/i, value: 'Full Sleeves Shirt' },
    { re: /\bt[\s-]?shirt\b/i, value: 'T-Shirt' },
    { re: /\bshirts?\b/i, value: 'Full Sleeves Shirt' },
    { re: /\bshorts?\b/i, value: 'Shorts' },
    { re: /\btrousers?\b|\bpants?\b/i, value: 'Trouser' },
    { re: /\bsocks?\b/i, value: 'Socks' },
    { re: /\bschool\s*bags?\b/i, value: 'School Bags' },
    { re: /\bladies\s*bags?\b/i, value: 'Ladies Bags' },
    { re: /\bbag[\s-]?pack\b|\bbackpack\b/i, value: 'Bag-Pack' },
]

function parseAgeRange(text) {
    const match = text.match(/(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})\s*years?/i)
    if (!match) return { ageStart: null, ageEnd: null }
    const a = parseInt(match[1], 10)
    const b = parseInt(match[2], 10)
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return { ageStart: null, ageEnd: null }
    return { ageStart: a, ageEnd: b }
}

function parsePrice(text) {
    let match = text.match(/(\d{2,6})\s*\/\s*[-=]/)
    if (match) return parseInt(match[1], 10)
    match = text.match(/(?:rs\.?|pkr)\s*(\d{2,6})/i)
    if (match) return parseInt(match[1], 10)
    match = text.match(/(\d{2,6})\s*\/?-?\s*only/i)
    if (match) return parseInt(match[1], 10)
    return null
}

function parseFabric(text) {
    for (const { re, value } of FABRIC_KEYWORD_MAP) {
        if (re.test(text)) return value
    }
    return ''
}

function parseProductType(text) {
    for (const { re, value } of PRODUCT_TYPE_KEYWORD_MAP) {
        if (re.test(text)) return value
    }
    return ''
}

export function parseCaption(rawText) {
    const text = String(rawText || '')
    const { ageStart, ageEnd } = parseAgeRange(text)
    return {
        ageStart,
        ageEnd,
        price: parsePrice(text),
        fabric: parseFabric(text),
        productType: parseProductType(text),
    }
}

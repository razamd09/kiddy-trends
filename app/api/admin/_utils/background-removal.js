function distanceSq(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2
    const dg = g1 - g2
    const db = b1 - b2
    return (dr * dr) + (dg * dg) + (db * db)
}

function rgbStats(r, g, b) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : Math.round(((max - min) / max) * 255)
    const luma = Math.round((0.2126 * r) + (0.7152 * g) + (0.0722 * b))
    return { sat, luma }
}

function countEdgeBits(mask) {
    let count = 0
    if (mask & 1) count++
    if (mask & 2) count++
    if (mask & 4) count++
    if (mask & 8) count++
    return count
}

function sampleDominantBorderPalette(data, width, height) {
    const minSide = Math.min(width, height)
    const borderDepth = Math.max(8, Math.floor(minSide * 0.03))
    const step = Math.max(2, Math.floor(minSide / 220))
    const buckets = new Map()

    const addSample = (x, y, edgeBit) => {
        const i = ((y * width) + x) * 4
        const a = data[i + 3] || 0
        if (a < 8) return

        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const key = (r >> 3) + '-' + (g >> 3) + '-' + (b >> 3)
        const stats = buckets.get(key) || { count: 0, sumR: 0, sumG: 0, sumB: 0, edgeMask: 0 }
        stats.count++
        stats.sumR += r
        stats.sumG += g
        stats.sumB += b
        stats.edgeMask |= edgeBit
        buckets.set(key, stats)
    }

    for (let y = 0; y < borderDepth; y += step) {
        for (let x = 0; x < width; x += step) addSample(x, y, 1)
    }
    for (let y = Math.max(0, height - borderDepth); y < height; y += step) {
        for (let x = 0; x < width; x += step) addSample(x, y, 2)
    }
    for (let x = 0; x < borderDepth; x += step) {
        for (let y = 0; y < height; y += step) addSample(x, y, 4)
    }
    for (let x = Math.max(0, width - borderDepth); x < width; x += step) {
        for (let y = 0; y < height; y += step) addSample(x, y, 8)
    }

    const ranked = []
    for (const value of buckets.values()) {
        const r = Math.round(value.sumR / value.count)
        const g = Math.round(value.sumG / value.count)
        const b = Math.round(value.sumB / value.count)
        const { sat, luma } = rgbStats(r, g, b)
        const edgeSpread = countEdgeBits(value.edgeMask)

        // Penalize colors that only exist on one edge because those are often product pixels
        // touching the border; reward colors spread across multiple edges.
        const score =
            (value.count * 1.0) +
            (edgeSpread * 35) +
            (luma >= 170 ? 20 : 0) -
            (sat >= 120 ? 20 : 0)

        ranked.push({ color: [r, g, b], score, edgeSpread, sat, luma })
    }

    ranked.sort((a, b) => b.score - a.score)
    const filtered = ranked.filter((item) => item.edgeSpread >= 2).slice(0, 8)
    const palette = (filtered.length ? filtered : ranked.slice(0, 8)).map((item) => item.color)
    return palette
}

function floodFillBackground(data, width, height, candidateMask, minDistanceSq, hardThresholdSq, relaxedThresholdSq, localSimilaritySq) {
    const pixels = width * height
    const visitedMask = new Uint8Array(pixels)
    const queue = new Uint32Array(pixels)

    let qHead = 0
    let qTail = 0
    const seed = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return
        const p = (y * width) + x
        if (!candidateMask[p] || visitedMask[p]) return
        visitedMask[p] = 1
        queue[qTail++] = p
    }

    for (let x = 0; x < width; x++) {
        seed(x, 0)
        seed(x, height - 1)
    }
    for (let y = 0; y < height; y++) {
        seed(0, y)
        seed(width - 1, y)
    }

    while (qHead < qTail) {
        const p = queue[qHead++]
        const x = p % width
        const y = Math.floor(p / width)
        const baseOffset = p * 4
        const baseR = data[baseOffset]
        const baseG = data[baseOffset + 1]
        const baseB = data[baseOffset + 2]

        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ]

        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const np = (ny * width) + nx
            if (visitedMask[np]) continue

            const ni = np * 4
            const na = data[ni + 3]
            if (na < 8) {
                visitedMask[np] = 1
                queue[qTail++] = np
                continue
            }

            if (minDistanceSq && minDistanceSq[np] <= hardThresholdSq) {
                visitedMask[np] = 1
                queue[qTail++] = np
                continue
            }

            if (minDistanceSq && minDistanceSq[np] <= relaxedThresholdSq) {
                const nr = data[ni]
                const ng = data[ni + 1]
                const nb = data[ni + 2]
                if (distanceSq(baseR, baseG, baseB, nr, ng, nb) <= localSimilaritySq) {
                    visitedMask[np] = 1
                    queue[qTail++] = np
                }
                continue
            }

            if (!minDistanceSq && candidateMask[np]) {
                visitedMask[np] = 1
                queue[qTail++] = np
            }
        }
    }

    return visitedMask
}

function applyAlphaCutAndFeather(data, width, height, channels, visitedMask) {
    const output = Buffer.from(data)
    const pixels = width * height

    for (let p = 0; p < pixels; p++) {
        if (visitedMask[p]) {
            output[(p * 4) + 3] = 0
        }
    }

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const p = (y * width) + x
            if (visitedMask[p]) continue
            const aIndex = (p * 4) + 3
            if (output[aIndex] < 8) continue

            const hasBgNeighbor = visitedMask[p - 1] || visitedMask[p + 1] || visitedMask[p - width] || visitedMask[p + width]
            if (hasBgNeighbor) {
                output[aIndex] = Math.max(0, Math.min(255, Math.round(output[aIndex] * 0.86)))
            }
        }
    }

    return {
        output,
        raw: { width, height, channels },
    }
}

function analyzeForegroundHealth(data, width, height) {
    const total = width * height
    let fgCount = 0
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(((y * width) + x) * 4) + 3]
            if (alpha < 24) continue
            fgCount++
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }

    if (fgCount === 0) {
        return { healthy: false, foregroundRatio: 0, bboxRatio: 0, density: 0 }
    }

    const bboxW = Math.max(1, (maxX - minX + 1))
    const bboxH = Math.max(1, (maxY - minY + 1))
    const bboxArea = bboxW * bboxH
    const foregroundRatio = fgCount / total
    const bboxRatio = bboxArea / total
    const density = fgCount / bboxArea

    const healthy =
        foregroundRatio >= 0.010 &&
        bboxRatio >= 0.015 &&
        density >= 0.06

    return { healthy, foregroundRatio, bboxRatio, density }
}

function buildAdaptiveCandidateMask(data, width, height, palette) {
    const pixels = width * height
    const hardThresholdSq = 34 * 34
    const relaxedThresholdSq = 58 * 58
    const localSimilaritySq = 26 * 26

    const minDistanceSq = new Uint32Array(pixels)
    const candidateMask = new Uint8Array(pixels)

    for (let p = 0; p < pixels; p++) {
        const i = p * 4
        const a = data[i + 3]
        if (a < 8) {
            minDistanceSq[p] = 0
            candidateMask[p] = 1
            continue
        }

        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const { sat, luma } = rgbStats(r, g, b)

        let minSq = Number.MAX_SAFE_INTEGER
        for (let j = 0; j < palette.length; j++) {
            const sample = palette[j]
            const d = distanceSq(r, g, b, sample[0], sample[1], sample[2])
            if (d < minSq) {
                minSq = d
                if (minSq <= hardThresholdSq) break
            }
        }
        minDistanceSq[p] = minSq

        if (
            minSq <= hardThresholdSq ||
            (luma >= 226 && sat <= 36)
        ) {
            candidateMask[p] = 1
        }
    }

    return { candidateMask, minDistanceSq, hardThresholdSq, relaxedThresholdSq, localSimilaritySq }
}

function buildWhiteOnlyCandidateMask(data, width, height) {
    const pixels = width * height
    const candidateMask = new Uint8Array(pixels)

    for (let p = 0; p < pixels; p++) {
        const i = p * 4
        const a = data[i + 3]
        if (a < 8) {
            candidateMask[p] = 1
            continue
        }

        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const { sat, luma } = rgbStats(r, g, b)
        const nearWhite = r >= 228 && g >= 228 && b >= 228

        if (nearWhite || (luma >= 234 && sat <= 24)) {
            candidateMask[p] = 1
        }
    }

    return { candidateMask }
}

function toSharpImage(sharpLib, output, width, height, channels) {
    return sharpLib(output, {
        raw: { width, height, channels },
    })
}

export async function removeBackgroundWithSafety(image, sharpLib) {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    const width = info.width
    const height = info.height
    const channels = info.channels

    const palette = sampleDominantBorderPalette(data, width, height)
    if (palette.length > 0) {
        const adaptive = buildAdaptiveCandidateMask(data, width, height, palette)
        const adaptiveVisited = floodFillBackground(
            data,
            width,
            height,
            adaptive.candidateMask,
            adaptive.minDistanceSq,
            adaptive.hardThresholdSq,
            adaptive.relaxedThresholdSq,
            adaptive.localSimilaritySq
        )

        const adaptiveCut = applyAlphaCutAndFeather(data, width, height, channels, adaptiveVisited)
        const adaptiveHealth = analyzeForegroundHealth(adaptiveCut.output, width, height)
        if (adaptiveHealth.healthy) {
            return {
                image: toSharpImage(sharpLib, adaptiveCut.output, width, height, channels),
                method: 'adaptive',
                health: adaptiveHealth,
            }
        }
    }

    const whiteOnly = buildWhiteOnlyCandidateMask(data, width, height)
    const whiteVisited = floodFillBackground(data, width, height, whiteOnly.candidateMask, null, 0, 0, 0)
    const whiteCut = applyAlphaCutAndFeather(data, width, height, channels, whiteVisited)
    const whiteHealth = analyzeForegroundHealth(whiteCut.output, width, height)
    if (whiteHealth.healthy) {
        return {
            image: toSharpImage(sharpLib, whiteCut.output, width, height, channels),
            method: 'white-only',
            health: whiteHealth,
        }
    }

    return {
        image: toSharpImage(sharpLib, Buffer.from(data), width, height, channels),
        method: 'original-preserved',
        health: whiteHealth,
    }
}

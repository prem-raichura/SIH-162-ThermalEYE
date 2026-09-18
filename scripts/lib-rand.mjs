// Fixed-seed PRNG. Regenerating the dataset must be byte-identical.
export function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRandom(seed) {
  const r = mulberry32(seed)
  const api = {
    next: r,
    float: (min, max) => min + r() * (max - min),
    int: (min, max) => Math.floor(min + r() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    bool: (p = 0.5) => r() < p,
    // Box-Muller, clamped so nothing escapes its stated range.
    normal: (mean, sd, lo, hi) => {
      const u = Math.max(r(), 1e-9)
      const v = r()
      const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
      const x = mean + n * sd
      return Math.min(hi ?? Infinity, Math.max(lo ?? -Infinity, x))
    },
    shuffle: (arr) => {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
  return api
}

export const round = (v, d = 2) => {
  const f = 10 ** d
  return Math.round(v * f) / f
}

import { PROJECT_COLORS } from '../constants/projectColors'

export function getAllLabels(items: { labels: string[] }[]): string[] {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const item of items) {
    for (const label of item.labels) {
      const key = label.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      labels.push(label)
    }
  }

  return labels
}

export function getLabelColor(label: string): string {
  let hash = 0
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 31 + label.charCodeAt(index)) | 0
  }

  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

export function parseLabels(input: string): string[] {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const raw of input.split(',')) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    labels.push(trimmed)
  }

  return labels
}

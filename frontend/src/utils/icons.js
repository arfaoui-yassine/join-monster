// Map category icon keys to display icons (avoids MySQL emoji charset issues)
const CATEGORY_ICONS = {
  economy: '💰',
  compact: '🚗',
  sedan: '🚙',
  suv: '🏔️',
  luxury: '💎',
  sports: '🏎️'
}

export function getCategoryIcon(iconKey) {
  if (!iconKey) return '🚗'
  return CATEGORY_ICONS[iconKey.toLowerCase()] || iconKey
}

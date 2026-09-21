// First-run content for the rules file. Written to Supabase (media/marketplace_rules.json) only
// when that file doesn't exist yet — see app/api/rules/route.js. This is the rules data the app
// had before it moved to Next.js: the five marketplaces, no subcategories yet.
export const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Meesho', children: [] },
  { id: '2', name: 'Flipkart', children: [] },
  { id: '3', name: 'Amazon', children: [] },
  { id: '4', name: 'Myntra', children: [] },
  { id: '5', name: 'Jio Mart', children: [] },
]

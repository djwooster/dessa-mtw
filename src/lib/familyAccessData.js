const PLACE_WORDS = [
  'River', 'Oak', 'Summit', 'Cedar', 'Maple', 'Pine', 'Valley', 'Sunset', 'Meadow', 'Lake',
  'Hill', 'West', 'North', 'East', 'Creek', 'Fair', 'Heritage', 'Franklin', 'Spring', 'Autumn',
  'Winter', 'Summer', 'Green', 'Blue', 'Silver', 'Gold', 'Stone', 'Birch', 'Elm', 'Willow',
  'Fox', 'Deer', 'Iron', 'Copper', 'Crystal', 'Ash', 'Cherry', 'Chestnut', 'Walnut', 'Magnolia',
  'Laurel', 'Ivy', 'Rose', 'Juniper', 'Cypress', 'Redwood', 'Aspen', 'Poplar', 'Sycamore', 'Hazel',
]
const SUFFIX_WORDS = ['side', 'wood', 'brook', 'field', 'view', 'ridge', 'grove', 'park', 'dale', 'ford']
const TYPES = ['Elementary', 'Middle', 'High', 'Academy']

// Deterministic, unique fictitious site names — cycles type fastest, then suffix, then place,
// so nearby entries read as related ("Riverside Elementary", "Riverside Middle", ...).
function generateSchools(count) {
  const result = []
  for (let i = 0; i < count; i++) {
    const type = TYPES[i % TYPES.length]
    const suffix = SUFFIX_WORDS[Math.floor(i / TYPES.length) % SUFFIX_WORDS.length]
    const place = PLACE_WORDS[Math.floor(i / (TYPES.length * SUFFIX_WORDS.length)) % PLACE_WORDS.length]
    result.push({ id: i + 1, name: `${place}${suffix} ${type}` })
  }
  return result
}

export const schools = generateSchools(150)

export const SITE_LEADER_SCHOOL = schools[0]

export const JOIN_PATH = '/join'
export const JOIN_URL_DISPLAY = 'app.dessa-mtw.com/join'

// Deterministic 6-digit numeric site code — stable across renders, no Math.random.
export function getSiteCode(school) {
  const seed = (school.id * 928471 + 103729) % 1000000
  return seed.toString().padStart(6, '0')
}

// Registration URL with the site's code appended, as it would appear in a browser.
export function getSiteJoinUrl(school) {
  return `${JOIN_URL_DISPLAY}?code=${getSiteCode(school)}`
}

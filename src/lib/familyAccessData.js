import { schools } from './report2Data'

export { schools }

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

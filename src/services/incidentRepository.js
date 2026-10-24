const STORAGE_KEY = 'scamsaathi.incidents.v1'

export function getIncidents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveIncident(incident) {
  const current = getIncidents()
  const next = [incident, ...current]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return incident
}

export function clearIncidents() {
  localStorage.removeItem(STORAGE_KEY)
}

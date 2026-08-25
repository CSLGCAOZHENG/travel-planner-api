import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { createCustomDestination, destinationTemplates } from '../data/destinations'
import type { DayPlan, DestinationTemplate, PlanItem, PlannedTrip, TripDestination, TripStatus } from '../types/trip'
import { readStorage, writeStorage } from '../utils/storage'

const cloneSchedule = (schedule: DayPlan[]) => JSON.parse(JSON.stringify(schedule)) as DayPlan[]
const pad = (value: number) => String(value).padStart(2, '0')
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const todayIso = () => toIsoDate(new Date())

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(value: string, amount: number) {
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}

function formatShortDate(value: string) {
  if (!value) return '日期待定'
  const [, month, day] = value.split('-')
  return `${month}.${day}`
}

function buildSchedule(startDate: string, destinations: TripDestination[]): DayPlan[] {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dayCities = destinations.flatMap(destination => Array.from({ length: destination.days }, () => destination))
  return dayCities.map((destination, index) => {
    if (!startDate) return { date: '待定', weekday: `第 ${index + 1} 天`, cityId: destination.id, city: destination.city, items: [] }
    const date = addDays(startDate, index)
    return { date: formatShortDate(date), weekday: weekdays[parseLocalDate(date).getDay()], cityId: destination.id, city: destination.city, items: [] }
  })
}

function destinationRecord(destination: DestinationTemplate, days: number, order: number): TripDestination {
  return { id: destination.id, city: destination.city, region: destination.region, coverKey: destination.coverKey, coverUrl: destination.coverUrl, days, order }
}

function defaultTripTitle(destinations: TripDestination[], days: number) {
  const cityLabel = destinations.length === 1 ? destinations[0].city : destinations.length === 2 ? destinations.map(item => item.city).join('·') : `${destinations[0].city}等${destinations.length}城`
  return `${cityLabel}${days}日游`
}

function syncTripDays(trip: PlannedTrip) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  trip.schedule.forEach((day, index) => {
    if (!trip.startDate) { day.date = '待定'; day.weekday = `第 ${index + 1} 天`; return }
    const date = addDays(trip.startDate, index)
    day.date = formatShortDate(date)
    day.weekday = weekdays[parseLocalDate(date).getDay()]
  })
  trip.days = trip.schedule.length
  trip.nights = Math.max(0, trip.days - 1)
  trip.endDate = trip.startDate ? addDays(trip.startDate, trip.days - 1) : ''
  trip.dateRange = trip.startDate ? `${formatShortDate(trip.startDate)} — ${formatShortDate(trip.endDate)}` : `${trip.days}天 · 日期待定`
  if (trip.destinations?.length) {
    trip.destinations = trip.destinations.map(destination => ({ ...destination, days: trip.schedule.filter(day => day.cityId === destination.id).length }))
    if (trip.usesDefaultTitle) trip.title = defaultTripTitle(trip.destinations, trip.days)
  }
  trip.updatedAt = new Date().toISOString()
}

function tripStatus(trip: PlannedTrip): TripStatus {
  if (!trip.startDate) return 'draft'
  const today = todayIso()
  if (today < trip.startDate) return 'upcoming'
  if (today > trip.endDate) return 'expired'
  return 'ongoing'
}

function tripSort(left: PlannedTrip, right: PlannedTrip) {
  const rank: Record<TripStatus, number> = { ongoing: 0, upcoming: 1, draft: 2, expired: 3 }
  const statusDiff = rank[tripStatus(left)] - rank[tripStatus(right)]
  if (statusDiff) return statusDiff
  if (tripStatus(left) === 'expired') return right.endDate.localeCompare(left.endDate)
  if (tripStatus(left) === 'draft') return right.updatedAt.localeCompare(left.updatedAt)
  return left.startDate.localeCompare(right.startDate)
}

function migrateTemplate(template: DestinationTemplate): PlannedTrip {
  const now = new Date()
  const [startText, endText] = template.dateRange.split('—').map(value => value.trim())
  const startMonth = Number(startText?.split('.')[0] || now.getMonth() + 1)
  const startDay = Number(startText?.split('.')[1] || now.getDate())
  const endMonth = Number(endText?.split('.')[0] || startMonth)
  const endDay = Number(endText?.split('.')[1] || startDay)
  let year = now.getFullYear()
  let startDate = `${year}-${pad(startMonth)}-${pad(startDay)}`
  let endDate = `${endMonth < startMonth ? year + 1 : year}-${pad(endMonth)}-${pad(endDay)}`
  if (endDate < todayIso()) {
    year += 1
    startDate = `${year}-${pad(startMonth)}-${pad(startDay)}`
    endDate = `${endMonth < startMonth ? year + 1 : year}-${pad(endMonth)}-${pad(endDay)}`
  }
  const timestamp = new Date().toISOString()
  return {
    ...template,
    id: `trip-${template.id}-${Date.now()}`,
    destinationId: template.id,
    destinations: [destinationRecord(template, template.days, 0)],
    startDate,
    endDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    schedule: cloneSchedule(template.schedule).map(day => ({ ...day, cityId: template.id, city: template.city }))
  }
}

function loadTrips(): PlannedTrip[] {
  const raw = readStorage('trip-records')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PlannedTrip[]
      if (Array.isArray(parsed)) return parsed.filter(trip => trip?.id && trip?.destinationId && Array.isArray(trip.schedule)).map(trip => {
        const destinations = trip.destinations?.length
          ? trip.destinations
          : [{ id: trip.destinationId, city: trip.city, region: trip.region, coverKey: trip.coverKey, coverUrl: trip.coverUrl, days: trip.days, order: 0 }]
        return { ...trip, destinations, schedule: trip.schedule.map(day => ({ ...day, cityId: day.cityId || trip.destinationId, city: day.city || trip.city, items: day.items.map(item => ({ ...item, address: item.address || item.subtitle, note: item.note || '', duration: item.duration || '' })) })) }
      })
    } catch {
      // Fall through to the previous single-trip storage format.
    }
  }
  const savedCity = readStorage('trip-active-city')
  const savedTemplate = destinationTemplates.find(destination => destination.id === savedCity)
    || (savedCity.startsWith('custom-') ? createCustomDestination(savedCity.slice(7)) : null)
  return savedTemplate ? [migrateTemplate(savedTemplate)] : []
}

export const useTripStore = defineStore('trip', () => {
  const trips = ref<PlannedTrip[]>(loadTrips())
  const savedActiveTripId = readStorage('trip-active-id')
  const activeTripId = ref(trips.value.some(trip => trip.id === savedActiveTripId) ? savedActiveTripId : trips.value.slice().sort(tripSort)[0]?.id || '')
  const activeDay = ref(0)
  const activeTab = ref<'首页' | '行程' | '地图' | '我的'>('首页')
  const isChoosingDestination = ref(false)
  const budget = ref(2400)
  const currentTrip = computed(() => trips.value.find(trip => trip.id === activeTripId.value) || null)
  const schedule = computed(() => currentTrip.value?.schedule || [])
  const hasTrip = computed(() => Boolean(currentTrip.value))
  const spent = computed(() => schedule.value.flatMap(day => day.items).reduce((sum, item) => sum + item.amount, 0))
  const currentDay = computed(() => schedule.value[activeDay.value] || { date: '待定', weekday: '第 1 天', items: [] })
  const activeTrips = computed(() => trips.value.filter(trip => tripStatus(trip) !== 'expired').slice().sort(tripSort))
  const ongoingTrips = computed(() => trips.value.filter(trip => tripStatus(trip) === 'ongoing').slice().sort(tripSort))
  const upcomingTrips = computed(() => trips.value.filter(trip => tripStatus(trip) === 'upcoming').slice().sort(tripSort))
  const draftTrips = computed(() => trips.value.filter(trip => tripStatus(trip) === 'draft').slice().sort(tripSort))
  const historyTrips = computed(() => trips.value.filter(trip => tripStatus(trip) === 'expired').slice().sort(tripSort))
  const planningTrips = computed(() => trips.value.filter(trip => tripStatus(trip) === 'draft' || !trip.schedule.length || trip.schedule.some(day => !day.items.length)).slice().sort(tripSort))

  function selectTrip(id: string, tab: '首页' | '行程' = '行程') {
    if (!trips.value.some(trip => trip.id === id)) return
    activeTripId.value = id
    activeDay.value = 0
    activeTab.value = tab
    isChoosingDestination.value = false
    writeStorage('trip-active-id', id)
  }

  function createTrip(selection: Array<{ destination: DestinationTemplate; days: number }>, options: { startDate: string; title?: string }) {
    if (!selection.length) return null
    const timestamp = new Date().toISOString()
    const normalized = selection.slice(0, 4).map((entry, index) => ({
      destination: entry.destination,
      days: Math.max(1, Math.min(14, Math.round(entry.days))),
      order: index
    }))
    const destinations = normalized.map(entry => destinationRecord(entry.destination, entry.days, entry.order))
    const days = destinations.reduce((sum, destination) => sum + destination.days, 0)
    const primary = normalized[0].destination
    const endDate = options.startDate ? addDays(options.startDate, days - 1) : ''
    const customTitle = options.title?.trim() || ''
    const trip: PlannedTrip = {
      ...primary,
      id: `trip-${primary.id}-${Date.now()}`,
      destinationId: primary.id,
      destinations,
      city: destinations.map(item => item.city).join(' → '),
      region: destinations.map(item => item.region).filter((item, index, array) => array.indexOf(item) === index).join(' · '),
      title: customTitle || defaultTripTitle(destinations, days),
      dateRange: options.startDate ? `${formatShortDate(options.startDate)} — ${formatShortDate(endDate)}` : `${days}天 · 日期待定`,
      days,
      nights: Math.max(0, days - 1),
      startDate: options.startDate,
      endDate,
      createdAt: timestamp,
      updatedAt: timestamp,
      usesDefaultTitle: !customTitle,
      schedule: buildSchedule(options.startDate, destinations)
    }
    trips.value.push(trip)
    selectTrip(trip.id, '行程')
    return trip
  }

  function addPlace(item: Omit<PlanItem, 'id'>) {
    if (!currentTrip.value || !schedule.value.length) return
    currentTrip.value.schedule[activeDay.value].items.push({ ...item, id: Date.now() })
    currentTrip.value.updatedAt = new Date().toISOString()
  }

  function updatePlace(id: number, changes: Partial<Omit<PlanItem, 'id'>>) {
    if (!currentTrip.value) return
    const item = currentDay.value.items.find(place => place.id === id)
    if (!item) return
    Object.assign(item, changes)
    currentTrip.value.updatedAt = new Date().toISOString()
  }

  function movePlaceTo(id: number, target: number) {
    if (!currentTrip.value) return
    const items = currentTrip.value.schedule[activeDay.value].items
    const index = items.findIndex(item => item.id === id)
    const normalizedTarget = Math.max(0, Math.min(target, items.length - 1))
    if (index < 0 || index === normalizedTarget) return
    const [item] = items.splice(index, 1)
    items.splice(normalizedTarget, 0, item)
    currentTrip.value.updatedAt = new Date().toISOString()
  }

  function addDay(afterIndex = activeDay.value) {
    if (!currentTrip.value) return false
    const sourceDay = currentTrip.value.schedule[afterIndex] || currentTrip.value.schedule[currentTrip.value.schedule.length - 1]
    currentTrip.value.schedule.splice(afterIndex + 1, 0, { date: '待定', weekday: '', cityId: sourceDay?.cityId || currentTrip.value.destinationId, city: sourceDay?.city || currentTrip.value.city, items: [] })
    activeDay.value = afterIndex + 1
    syncTripDays(currentTrip.value)
    return true
  }

  function removeDay(index = activeDay.value) {
    if (!currentTrip.value || currentTrip.value.schedule.length <= 1) return false
    const day = currentTrip.value.schedule[index]
    if (currentTrip.value.destinations?.length && currentTrip.value.schedule.filter(item => item.cityId === day.cityId).length <= 1) return false
    currentTrip.value.schedule.splice(index, 1)
    activeDay.value = Math.max(0, Math.min(index, currentTrip.value.schedule.length - 1))
    syncTripDays(currentTrip.value)
    return true
  }

  function removePlace(id: number) {
    if (!currentTrip.value) return
    currentTrip.value.schedule[activeDay.value].items = currentDay.value.items.filter(item => item.id !== id)
    currentTrip.value.updatedAt = new Date().toISOString()
  }

  watch(trips, value => writeStorage('trip-records', JSON.stringify(value)), { deep: true })

  return {
    trips, activeTripId, activeDay, activeTab, currentTrip, schedule, isChoosingDestination, budget,
    hasTrip, spent, currentDay, activeTrips, ongoingTrips, upcomingTrips, draftTrips, historyTrips, planningTrips,
    getTripStatus: tripStatus, selectTrip, createTrip, addDay, removeDay, addPlace, updatePlace, movePlaceTo, removePlace
  }
})

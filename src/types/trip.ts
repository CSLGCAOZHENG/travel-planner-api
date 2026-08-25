export type PlaceType = '交通' | '景点' | '美食' | '住宿'

export interface PlanItem {
  id: number
  time: string
  title: string
  subtitle: string
  address?: string
  note?: string
  photo?: string
  duration?: string
  type: PlaceType
  amount: number
  color: string
  latitude?: number
  longitude?: number
  poiId?: string
}

export interface DayPlan {
  date: string
  weekday: string
  cityId?: string
  city?: string
  items: PlanItem[]
}

export interface TripDestination {
  id: string
  city: string
  region: string
  coverKey: string
  coverUrl?: string
  days: number
  order: number
}

export interface DestinationTemplate {
  id: string
  city: string
  region: string
  title: string
  description: string
  moodTitle: string
  moodCopy: string
  travelTip: string
  coverKey: string
  coverUrl?: string
  weather: string
  temperature: number
  dateRange: string
  days: number
  nights: number
  schedule: DayPlan[]
}

export type TripStatus = 'ongoing' | 'upcoming' | 'draft' | 'expired'

export interface PlannedTrip extends DestinationTemplate {
  destinationId: string
  destinations?: TripDestination[]
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  usesDefaultTitle?: boolean
}

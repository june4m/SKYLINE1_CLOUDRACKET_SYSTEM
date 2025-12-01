// src/schemas/booking.schema.ts
export interface BookingCreateDTO {
  booking_date: string // "YYYY-MM-DD"
  club_id: string
  court_id: string
  duration: number // hours
  start_time: string // "HH:MM"
  user_id: string
  rating_given?: number | null
  booking_status?: string
}

export interface BookingItem {
  booking_id: string
  booking_date: string
  club_id: string
  court_id: string
  duration: number
  start_time: string
  end_time: string
  user_id: string
  rating_given?: number | null
  booking_status: string
  created_at: string
}

export interface BookingFilterDTO {
  user_id?: string
  court_id?: string
  club_id?: string
  booking_date?: string
}

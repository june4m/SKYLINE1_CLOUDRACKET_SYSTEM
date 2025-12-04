// src/schemas/court.schema.ts
export interface CourtDTO {
  club_id: string // liên kết với ClubData
  court_name: string
  court_status?: 'available' | 'booked' | 'maintenance' // mặc định 'available'
}

// src/schemas/club.schema.ts
export interface ClubDTO {
  club_name: string
  club_district: string
  club_address: string
  open_time: string
  close_time: string
  num_courts: number // đổi từ num_court
  popularity_score?: number
  price?: number
  rating_avg?: number
  rating_counts?: number // đổi từ rating_count
}

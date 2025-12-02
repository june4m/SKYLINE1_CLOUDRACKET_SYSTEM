// src/user-services/user.schema.ts

export interface UserCreateDTO {
  email: string
  password: string
  name: string
  phone: string
  role: 'User' | 'CourtOwner'
}

export interface UserItem {
  user_id: string
  email: string
  name: string
  phone: string
  role: 'User' | 'CourtOwner'
  created_at: string
  updated_at?: string
  email_verified?: boolean
  status?: 'active' | 'inactive' | 'banned'
}

export interface UserUpdateDTO {
  name?: string
  phone?: string
  email?: string
}

export interface UserLoginDTO {
  email: string
  password: string
}

export interface UserFilterDTO {
  role?: 'User' | 'CourtOwner'
  status?: 'active' | 'inactive' | 'banned'
  email?: string
}

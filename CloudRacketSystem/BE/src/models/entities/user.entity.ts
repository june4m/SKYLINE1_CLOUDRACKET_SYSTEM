export interface UserEntity {
  PK: string; // USER#{userId}
  SK: string; // PROFILE
  GSI1PK: string; // EMAIL#{email}
  GSI1SK: string; // USER
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  userType: 'player' | 'court_owner';
  profileImage?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Player specific fields
  favoriteCourtIds?: string[];
  totalBookings?: number;
  // Court owner specific fields
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface UserPreferencesEntity {
  PK: string; // USER#{userId}
  SK: string; // PREFERENCES
  userId: string;
  preferredLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  maxDistance?: number; // in km
  preferredTimeSlots?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
export interface CourtEntity {
  PK: string; // COURT#{courtId}
  SK: string; // DETAILS
  GSI1PK: string; // OWNER#{ownerId}
  GSI1SK: string; // COURT#{courtId}
  GSI2PK: string; // LOCATION#{district}
  GSI2SK: string; // COURT#{courtId}
  courtId: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  district: string;
  city: string;
  location: {
    latitude: number;
    longitude: number;
  };
  images: string[]; // S3 URLs
  facilities: string[]; // ['parking', 'shower', 'equipment_rental', 'cafe']
  pricePerHour: number;
  currency: string;
  operatingHours: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  totalCourts: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourtAvailabilityEntity {
  PK: string; // COURT#{courtId}
  SK: string; // AVAILABILITY#{date}#{courtNumber}
  courtId: string;
  date: string; // YYYY-MM-DD
  courtNumber: number;
  timeSlots: {
    [time: string]: {
      isAvailable: boolean;
      bookingId?: string;
      price: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourtReviewEntity {
  PK: string; // COURT#{courtId}
  SK: string; // REVIEW#{reviewId}
  GSI1PK: string; // USER#{userId}
  GSI1SK: string; // REVIEW#{reviewId}
  reviewId: string;
  courtId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  bookingId: string;
  sentiment?: 'positive' | 'negative' | 'neutral'; // From Amazon Comprehend
  sentimentScore?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
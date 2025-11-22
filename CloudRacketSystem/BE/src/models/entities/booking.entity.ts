export interface BookingEntity {
  PK: string; // BOOKING#{bookingId}
  SK: string; // DETAILS
  GSI1PK: string; // USER#{userId}
  GSI1SK: string; // BOOKING#{date}#{bookingId}
  GSI2PK: string; // COURT#{courtId}
  GSI2SK: string; // BOOKING#{date}#{bookingId}
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  courtId: string;
  courtName: string;
  courtAddress: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
  timeSlots: string[]; // ['09:00-10:00', '10:00-11:00']
  courtNumber: number;
  totalHours: number;
  pricePerHour: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  cancellationReason?: string;
  cancellationPolicy?: {
    refundPercentage: number;
    deadlineHours: number;
  };
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
}

export interface BookingHistoryEntity {
  PK: string; // BOOKING#{bookingId}
  SK: string; // HISTORY#{timestamp}
  bookingId: string;
  action: 'created' | 'confirmed' | 'cancelled' | 'completed' | 'payment_updated';
  previousStatus?: string;
  newStatus: string;
  performedBy: string; // userId
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
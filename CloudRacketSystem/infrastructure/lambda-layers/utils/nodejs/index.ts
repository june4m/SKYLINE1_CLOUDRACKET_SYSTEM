/**
 * Utils Layer - Business logic utilities
 * This layer provides validation, formatting, and error handling utilities
 * for all Lambda functions in the Cloud Racket Platform.
 */

// Validation utilities
export const validators = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },

  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  isValidDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  isValidTimeSlot: (timeSlot: string): boolean => {
    const timeSlotRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeSlotRegex.test(timeSlot);
  },

  isValidPrice: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && isFinite(price);
  },

  isValidRating: (rating: number): boolean => {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
  },

  isValidCoordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
};

// Date formatting utilities
export const dateUtils = {
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  formatDateTime: (date: Date): string => {
    return date.toISOString();
  },

  parseDate: (dateString: string): Date => {
    return new Date(dateString);
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  isDateInPast: (date: Date): boolean => {
    return date < new Date();
  },

  isDateInFuture: (date: Date): boolean => {
    return date > new Date();
  },

  getStartOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  getEndOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
};

// String formatting utilities
export const stringUtils = {
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  truncate: (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },

  sanitize: (str: string): string => {
    return str.replace(/[<>\"'&]/g, '');
  },
};

// Number formatting utilities
export const numberUtils = {
  formatCurrency: (amount: number, currency: string = 'VND'): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  formatPercentage: (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  roundToDecimal: (value: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
};

// Error handling utilities
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Pagination utilities
export interface PaginationParams {
  limit: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
  hasMore: boolean;
}

export const paginationUtils = {
  getDefaultPagination: (limit?: number): PaginationParams => ({
    limit: Math.min(limit || 20, 100),
  }),

  createPaginatedResult: <T>(
    items: T[],
    lastEvaluatedKey?: Record<string, unknown>
  ): PaginatedResult<T> => ({
    items,
    lastEvaluatedKey,
    hasMore: !!lastEvaluatedKey,
  }),
};

// Geolocation utilities
export const geoUtils = {
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  getBoundingBox: (lat: number, lng: number, radiusKm: number) => {
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  },
};

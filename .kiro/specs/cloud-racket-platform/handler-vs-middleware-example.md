# Handler vs Middleware - Chi tiết

## 1. Middleware (Chạy TRƯỚC handler)

### `shared/middleware/auth-middleware.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { ResponseBuilder } from '../lib/response-builder';

type Handler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

export const authMiddleware = (handler: Handler): Handler => {
  return async (event: APIGatewayProxyEvent, context: Context) => {
    try {
      // 1. Extract token from header
      const token = event.headers.Authorization?.replace('Bearer ', '');
      
      if (!token) {
        return ResponseBuilder.error(
          { code: 'AUTH_REQUIRED', message: 'No token provided' },
          401
        );
      }

      // 2. Verify JWT token
      const decoded = verify(token, process.env.JWT_SECRET!);
      
      // 3. Attach user to event (để handler sử dụng)
      (event as any).user = decoded;

      // 4. Gọi handler tiếp theo
      return await handler(event, context);
      
    } catch (error) {
      return ResponseBuilder.error(
        { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' },
        401
      );
    }
  };
};
```

### `shared/middleware/validation-middleware.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Schema } from 'joi';
import { ResponseBuilder } from '../lib/response-builder';

type Handler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

export const validationMiddleware = (schema: Schema) => {
  return (handler: Handler): Handler => {
    return async (event: APIGatewayProxyEvent, context: Context) => {
      try {
        // 1. Parse request body
        const body = JSON.parse(event.body || '{}');
        
        // 2. Validate against schema
        const { error, value } = schema.validate(body);
        
        if (error) {
          return ResponseBuilder.error(
            { 
              code: 'VALIDATION_ERROR', 
              message: error.details[0].message 
            },
            400
          );
        }

        // 3. Replace body with validated value
        event.body = JSON.stringify(value);

        // 4. Gọi handler tiếp theo
        return await handler(event, context);
        
      } catch (error) {
        return ResponseBuilder.error(
          { code: 'INVALID_JSON', message: 'Invalid JSON in request body' },
          400
        );
      }
    };
  };
};
```

### `shared/middleware/cors-middleware.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

type Handler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

export const corsMiddleware = (handler: Handler): Handler => {
  return async (event: APIGatewayProxyEvent, context: Context) => {
    // 1. Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: ''
      };
    }

    // 2. Gọi handler
    const response = await handler(event, context);

    // 3. Add CORS headers to response
    return {
      ...response,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    };
  };
};
```

### `shared/middleware/logging-middleware.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '../lib/logger';

type Handler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

export const loggingMiddleware = (serviceName: string) => {
  return (handler: Handler): Handler => {
    return async (event: APIGatewayProxyEvent, context: Context) => {
      const logger = new Logger(serviceName);
      const startTime = Date.now();

      // 1. Log request
      logger.info('Request received', {
        method: event.httpMethod,
        path: event.path,
        requestId: context.requestId
      });

      try {
        // 2. Gọi handler
        const response = await handler(event, context);

        // 3. Log response
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          statusCode: response.statusCode,
          duration: `${duration}ms`
        });

        return response;

      } catch (error) {
        // 4. Log error
        const duration = Date.now() - startTime;
        logger.error('Request failed', {
          error: error.message,
          duration: `${duration}ms`
        });
        throw error;
      }
    };
  };
};
```

---

## 2. Handler (Controller) - Sử dụng middleware

### `services/booking-service/src/handlers/create-booking.ts`
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import Joi from 'joi';
import { authMiddleware } from '../../../../shared/middleware/auth-middleware';
import { validationMiddleware } from '../../../../shared/middleware/validation-middleware';
import { corsMiddleware } from '../../../../shared/middleware/cors-middleware';
import { loggingMiddleware } from '../../../../shared/middleware/logging-middleware';
import { BookingService } from '../services/booking.service';
import { ResponseBuilder } from '../../../../shared/lib/response-builder';

// Validation schema
const createBookingSchema = Joi.object({
  courtId: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  timeSlot: Joi.string().pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/).required()
});

// Handler chính (Controller)
const createBookingHandler: APIGatewayProxyHandler = async (event) => {
  try {
    // User đã được authMiddleware attach vào event
    const user = (event as any).user;
    
    // Body đã được validationMiddleware validate
    const { courtId, date, timeSlot } = JSON.parse(event.body!);

    // Business logic
    const bookingService = new BookingService();
    const booking = await bookingService.createBooking({
      userId: user.sub,
      courtId,
      date,
      timeSlot
    });

    return ResponseBuilder.success(booking, 201);

  } catch (error) {
    return ResponseBuilder.error(error);
  }
};

// Export handler với middleware chain
export const handler = 
  loggingMiddleware('booking-create')(
    corsMiddleware(
      authMiddleware(
        validationMiddleware(createBookingSchema)(
          createBookingHandler
        )
      )
    )
  );
```

**Flow khi có request:**
```
1. loggingMiddleware → Log request
2. corsMiddleware → Add CORS headers
3. authMiddleware → Verify JWT token
4. validationMiddleware → Validate request body
5. createBookingHandler → Business logic (CONTROLLER)
6. loggingMiddleware → Log response
```

---

## 3. Middleware Composer (Tiện lợi hơn)

### `shared/middleware/compose.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

type Handler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
type Middleware = (handler: Handler) => Handler;

export const compose = (...middlewares: Middleware[]) => {
  return (handler: Handler): Handler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
};
```

### Sử dụng composer
```typescript
import { compose } from '../../../../shared/middleware/compose';
import { authMiddleware } from '../../../../shared/middleware/auth-middleware';
import { validationMiddleware } from '../../../../shared/middleware/validation-middleware';
import { corsMiddleware } from '../../../../shared/middleware/cors-middleware';
import { loggingMiddleware } from '../../../../shared/middleware/logging-middleware';

// Handler chính
const createBookingHandler: APIGatewayProxyHandler = async (event) => {
  // Business logic
};

// Export với middleware chain (dễ đọc hơn)
export const handler = compose(
  loggingMiddleware('booking-create'),
  corsMiddleware,
  authMiddleware,
  validationMiddleware(createBookingSchema)
)(createBookingHandler);
```

---

## 4. Middleware với Middy (Library phổ biến)

### Cài đặt
```bash
npm install @middy/core @middy/http-json-body-parser @middy/http-cors
```

### Sử dụng Middy
```typescript
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { APIGatewayProxyHandler } from 'aws-lambda';

// Handler chính
const createBookingHandler: APIGatewayProxyHandler = async (event) => {
  // event.body đã được parse thành object (không cần JSON.parse)
  const { courtId, date, timeSlot } = event.body as any;
  
  // Business logic
  const bookingService = new BookingService();
  const booking = await bookingService.createBooking({
    userId: event.requestContext.authorizer?.claims.sub,
    courtId,
    date,
    timeSlot
  });

  return {
    statusCode: 201,
    body: JSON.stringify(booking)
  };
};

// Export với Middy middleware
export const handler = middy(createBookingHandler)
  .use(jsonBodyParser()) // Parse JSON body
  .use(cors()); // Add CORS headers
```

---

## Tóm tắt

| Component | Vai trò | Khi nào chạy | Ví dụ |
|-----------|---------|--------------|-------|
| **Handler** | Controller - Entry point | Sau middleware | `createBookingHandler` |
| **Middleware** | Pre/post processing | Trước/sau handler | `authMiddleware`, `validationMiddleware` |
| **Service** | Business logic | Được gọi bởi handler | `BookingService.createBooking()` |
| **Repository** | Data access | Được gọi bởi service | `BookingRepository.create()` |

**Handler ≠ Middleware**
- **Handler = Controller** (xử lý business logic)
- **Middleware = Interceptor** (xử lý cross-cutting concerns)

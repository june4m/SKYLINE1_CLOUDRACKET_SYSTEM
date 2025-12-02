import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './routers/users.routers';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware phải đặt TRƯỚC routes
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', router);

// Ensure JWT secret is set -- warn developer during startup
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set. Using a default secret is insecure. Create a .env file and set JWT_SECRET before running in production.');
}

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
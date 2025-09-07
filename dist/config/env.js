import dotenv from 'dotenv';
dotenv.config();
export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret',
    DATABASE_URL: process.env.DATABASE_URL || '',
    // Token lifetimes
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m', // 15 minutes
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d' // 7 days
};

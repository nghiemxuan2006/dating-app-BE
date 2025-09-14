const settings = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT,
    DB_URI: process.env.DB_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    HOST: process.env.HOST || 'localhost',
    // Add more environment variables as needed
};

export default settings;
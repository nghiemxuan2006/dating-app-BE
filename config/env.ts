const settings = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'your-secret-key-here',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    HOST: process.env.HOST || 'localhost',
    MONGODB_NAME: process.env.MONGODB_NAME || 'dating-app',
    MONGODB_USERNAME: process.env.MONGODB_USERNAME || '',
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || '',
    MONGODB_HOST: process.env.MONGODB_HOST || 'localhost',
    MONGODB_SERVER_PORT: process.env.MONGODB_SERVER_PORT || '27017',
    // ZEGOCLOUD ZIM server API credentials and region (optional)
    ZIM_APP_ID: process.env.ZIM_APP_ID || '',
    ZIM_SERVER_SECRET: process.env.ZIM_SERVER_SECRET || '',
    // Region short code: sha | hkg | fra | lax | bom | sgp | or leave empty for global endpoint
    ZIM_REGION: process.env.ZIM_REGION || '',
    // Add more environment variables as needed
};

export default settings;
const settings = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app',
    JWT_SECRET: process.env.JWT_SECRET || '',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    HOST: process.env.HOST || 'localhost',
    MONGODB_NAME: process.env.MONGODB_NAME || 'dating-app',
    MONGODB_USERNAME: process.env.MONGODB_USERNAME || '',
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || '',
    MONGODB_HOST: process.env.MONGODB_HOST || 'localhost',
    MONGODB_SERVER_PORT: process.env.MONGODB_SERVER_PORT || '27017',
    // Add more environment variables as needed
};

export default settings;
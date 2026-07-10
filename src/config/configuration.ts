export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-super-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});

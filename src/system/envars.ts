const envars = {
  admin: {
    authKey: process.env.AUTH_KEY
  },
  external: {
    production:
      process.env.NODE_ENV !== "test" || process.env.EXTERNAL === "production"
  },
  logging: {
    debug: process.env.DEBUG === "1",
    elapsed: process.env.ELAPSED === "1"
  },
  redis: {
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD
  },
  repository: {
    s3: {
      bucketName: process.env.BUCKET_NAME
    }
  },
  actor: {
    bottomHalf: process.env.BOTTOM_HALF_LAMBDA!
  }
};

export default envars;

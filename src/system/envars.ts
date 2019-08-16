const envars = {
  admin: {
    authKey: process.env.AUTH_KEY
  },
  external: {
    production:
      process.env.NODE_ENV !== "test" || process.env.EXTERNAL === "production"
  },
  logging: {
    debug: !!process.env.DEBUG,
    elapsed: !!process.env.ELAPSED
  },
  redis: {
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD
  },
  repository: {
    s3: {
      bucketName: process.env.BUCKET_NAME
    }
  }
};

export default envars;

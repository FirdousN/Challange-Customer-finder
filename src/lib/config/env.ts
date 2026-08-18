export const env = {
  get MONGODB_URI() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Environment variable MONGODB_URI is missing");
    return uri;
  },
  get SESSION_SECRET() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("Environment variable SESSION_SECRET is missing");
    if (secret.length < 32) throw new Error("Environment variable SESSION_SECRET must be at least 32 characters long");
    return secret;
  },
  get APP_URL() {
    const url = process.env.APP_URL;
    if (!url) throw new Error("Environment variable APP_URL is missing");
    return url;
  },
  get RATE_LIMIT_SECRET() {
    const secret = process.env.RATE_LIMIT_SECRET;
    if (!secret) throw new Error("Environment variable RATE_LIMIT_SECRET is missing");
    return secret;
  }
};

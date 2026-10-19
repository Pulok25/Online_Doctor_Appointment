require('dotenv').config()

const serverPort = process.env.SERVER_PORT || 3002
const mongodbURL = process.env.MONGODB_URL || 'mongodb://localhost:27017/doctor-appointment'
const defaultImagePath = process.env.DEFAULT_USER_IMAGE_PATH || 'public/images/users/default.webp'

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const isProd = process.env.NODE_ENV === 'production'

const jwtActivationKey = process.env.JWT_ACTIVATION_KEY
const jwtAccessKey = process.env.JWT_ACCESS_KEY
const jwtRefreshKey = process.env.JWT_REFRESH_KEY
const doctorImagePath = process.env.DOCTOR_IMAGE_PATH || "public/images/doctorImg"
if (!jwtActivationKey || !jwtAccessKey || !jwtRefreshKey) {
  throw new Error('JWT secret keys must be defined in .env')
}
for (const [k, v] of Object.entries({ jwtActivationKey, jwtAccessKey, jwtRefreshKey })) {
  if (v.trim().length < 32) throw new Error(`${k} must be at least 32 characters`)
}
if (new Set([jwtActivationKey, jwtAccessKey, jwtRefreshKey]).size !== 3) {
  throw new Error('JWT keys must all be different')
}

module.exports = { serverPort, mongodbURL, defaultImagePath, jwtActivationKey, jwtAccessKey, jwtRefreshKey, doctorImagePath, clientOrigin, isProd }
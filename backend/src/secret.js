require('dotenv').config()

const serverPort = process.env.SERVER_PORT || 3002

const mongodbURL =process.env.MONGODB_URL|| 'mongodb://localhost:27017/'
const defaultImagePath = process.env.DEFAULT_USER_IMAGE_PATH || 'public/images/users/default.webp'
const jwtActivationKey = process.env.JWT_ACTIVATION_KEY  || 'akakakakakaiakkkaka'

const jwtAccessKey = process.env.JWT_ACCESS_KEY || 'aqaqakilailaimslaaaa'
const jwtRefreshKey= process.env.JWT_REFRESH_KEY || "sxsxaaaaaaaaaalmmmm"


module.exports = {serverPort, mongodbURL,defaultImagePath,jwtActivationKey,jwtAccessKey,jwtRefreshKey}
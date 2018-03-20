'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const winston = require('winston')
const cors = require('cors')
const mongoose = require('mongoose')
mongoose.Promise = Promise

const pkg = require('../package.json')
const permNodes = require('./permNodes.json')

const GenericRouter = require('@weeb_services/wapi-core').GenericRouter
const WildcardRouter = require('@weeb_services/wapi-core').WildcardRouter
const ReputationRouter = require('./routers/reputation.router')
const SettingsRouter = require('./routers/settings.router')

const AuthMiddleware = require('@weeb_services/wapi-core').AccountAPIMiddleware
const TrackMiddleware = require('@weeb_services/wapi-core').TrackingMiddleware

const Registrator = require('@weeb_services/wapi-core').Registrator
const ShutdownHandler = require('@weeb_services/wapi-core').ShutdownHandler

const config = require('../config/main')

let registrator

if (config.registration && config.registration.enabled) {
  registrator = new Registrator(config.registration.host, config.registration.token)
}
let shutdownManager

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  timestamp: true,
  colorize: true
})

const init = async () => {
  try {
    await mongoose.connect(config.dburl)
  } catch (e) {
    winston.error('Unable to connect to Mongo Server.')
    return process.exit(1)
  }
  winston.info('MongoDB connected.')

  // Initialize express
  const app = express()

  // Middleware for config
  app.use((req, res, next) => {
    req.config = config
    next()
  })

  // Some other middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(cors())

  // Auth middleware
  app.use(new AuthMiddleware(config.irohUrl, `${pkg.name}/${pkg.version}/${config.env}`, config.whitelist).middleware())

  if (config.track) {
    app.use(new TrackMiddleware(pkg.name, pkg.version, config.env, config.track).middleware())
  }

  // Routers
  app.use(new GenericRouter(pkg.version, `Welcome to ${pkg.name}, a simple reputation api`, `${pkg.name}-${config.env}`, permNodes).router())

  // add custom routers here:
  app.use(new SettingsRouter().router())
  app.use(new ReputationRouter().router())

  // Always use this last
  app.use(new WildcardRouter().router())

  const server = app.listen(config.port, config.host)
  shutdownManager = new ShutdownHandler(server, registrator, mongoose, pkg.name)
  if (registrator) {
    await registrator.register(pkg.serviceName, [config.env], config.port)
  }
  winston.info(`Server started on ${config.host}:${config.port}`)
}

init()
  .catch(e => {
    winston.error(e)
    winston.error('Failed to initialize.')
    process.exit(1)
  })

process.on('SIGTERM', () => shutdownManager.shutdown())
process.on('SIGINT', () => shutdownManager.shutdown())

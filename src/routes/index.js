const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const login = require('./login')
const users = require('./users')
const logs = require('./logs')
const applications = require('./applications')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('../../swagger.json')

router.get('/', (req, res) => {
  const protocol = req.protocol
  const host = req.get('host')
  res.json({
    login: `${protocol}://${host}/v1/login`,
    users: `${protocol}://${host}/v1/users`,
    logs: `${protocol}://${host}/v1/logs`,
    applications:`${protocol}://v1/applications`
  })
})

router.use('/login', login)
router.use('/users', auth.validate, auth.isAdmin, users)
router.use('/logs', auth.validate, logs)
router.use('/applications', auth.validate, applications)
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.use((err, req, res, next) => {
  let error = (err.parent || {}).sqlMessage
  if (err.errors) {
    error = ''
    for (const i in err.errors) {
      if (error !== '') error += ', '
      error += err.errors[i].message + ''
    }
  } else {
    error = 'The request is incorrect'
  }
  res.status(400).json({ error })    
})

module.exports = router 
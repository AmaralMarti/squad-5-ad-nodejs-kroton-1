const model = require('../models/notifications')
const applicationModel = require('../models/applications')
const applicationController = require('./applications')
const triggerModel = require('../models/notificationsTriggers')
const alertModel = require('../models/notificationsAlerts')

let Notifications = {}

Notifications.getAll = async (req, res, next) =>{
  const applicationId = req.parentParams.appId
  try {
    const data = await Notifications.getAllNotifications(applicationId)

		res.status(200).json({
			total:data.length,
			data
		})
	} catch(e) {
		next(e)
	}
}

Notifications.getById = async (req, res, next) =>{
	try {
    const id = req.params.notificationId
    let notification = await Notifications.getNotificationById(id)
    
    if (notification) {
      const appId = req.parentParams.appId
      if (notification.application.id !== appId) {
        return res.status(403).json({ error: `The notification id ${id} does not belong to that application` })
      }

      notification = Notifications.clearApplication(notification)
      res.status(200).json(notification)
    } else {
      res.status(404).json({ error: `The notification id ${id} couldn't be found.` })
    }
	} catch(e) {
		next(e)
	}
}

Notifications.create = async (req, res, next) =>{
	try {
    const applicationId = req.parentParams.appId
    let { name, detail = '' } = req.body
    
    const created = await model.create({ applicationId, name, detail })
    let notification = await Notifications.getNotificationById(created.id)
    notification = Notifications.clearApplication(notification)

		res.status(201).json(notification)
	} catch(e) {
		next(e)
	}
}

Notifications.update = async (req, res, next) =>{
  try {
    const id = req.params.notificationId
    let notification = await Notifications.getNotificationById(id)

    if (notification) {
      const appId = req.parentParams.appId
      if (notification.application.id !== appId) {
        return res.status(403).json({ error: `The notification id ${id} does not belong to that application` })
      }

      let { name, detail } = req.body
      
      notification.name = name || notification.name
      notification.detail = detail || notification.detail

      await notification.save()
      notification = Notifications.clearApplication(notification)
      return res.status(200).json(notification)

    } else {
      return res.status(404).json({ error: `The notification id ${id} couldn't be found.` })  
    }
  } catch(e) {
    next(e)
  }
}

Notifications.delete = async (req, res, next) =>{
  try{
    const id = req.params.notificationId
    const notification = await Notifications.getNotificationById(id) 

    if (notification) {
      const appId = req.parentParams.appId
      if (notification.application.id !== appId) {
        return res.status(403).json({ error: `The notification id ${id} does not belong to that application` })
      }    

      await notification.destroy()
      res.status(204).end()
    } else {
      res.status(404).json({ error: `The notification id ${id} couldn't be found.` })
    }
  } catch(e) {
    next(e)
  }
}

Notifications.getAllNotifications = async applicationId => {
  const notifications = await model.findAll({
    where: { applicationId },
    attributes: ['id', 'name', 'detail', 'createdAt', 'updatedAt'],
    include: [
      {
        model: triggerModel,
        as: 'triggers',
        attributes: ['id', 'field', 'condition', 'value'],
      },
      {
        model: alertModel,
        as: 'alerts',
        attributes: ['id', 'type', 'to', 'message'],
      },
    ]
  })

  return notifications
}

Notifications.getNotificationById = async id => {
  id = parseInt(id)
  const notification = await model.findOne({
    where: { id }, 
    attributes: ['id', 'name', 'detail', 'createdAt', 'updatedAt'],
    include: [
      {
        model: applicationModel,
        as: 'application',
        attributes: ['id', 'name'],
      },
      {
        model: triggerModel,
        as: 'triggers',
        attributes: ['id', 'field', 'condition', 'value'],
      },
      {
        model: alertModel,
        as: 'alerts',
        attributes: ['id', 'type', 'to', 'message'],
      },
    ]
  })
  return notification
}

Notifications.redirectParams = (req, res, next) => {
  const parentParams = req.parentParams || {}

  parentParams.notificationId = parseInt(req.params.notificationId)

  req.parentParams = parentParams
  next() 
}

Notifications.validateParams = async (req, res, next) => {
  try {
    const appId = req.parentParams.appId
    const notificationId = req.params.notificationId

    const notification = await Notifications.getNotificationById(notificationId)

    if (!notification) {
      return res.status(404).json({ error: `The notification id ${notificationId} couldn't be found.` })
    }

    if (notification.application.id !== appId) {
      return res.status(403).json({ error: `The notification id ${notificationId} does not belong to that application` })
    }

    next()
  } catch(e) {
    next(e)
  }
}

Notifications.clearApplication = (notification) => {
  let output

  if (notification) {
    output = {
      id: notification.id,
      name: notification.name,
      detail: notification.detail,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      triggers: notification.triggers,
      alerts: notification.alerts,
    }
  }

  return output
}

module.exports = Notifications

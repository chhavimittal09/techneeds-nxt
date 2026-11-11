const { Activity, Notification } = require('../models');

const logActivity = ({ user, cohort, kind, resource, label = '', meta, at }) =>
  Activity.create({ user, cohort, kind, resource, label, meta, at: at || new Date() });

const notify = (user, { type, title, body = '', link = '' }) => Notification.create({ user, type, title, body, link });

const notifyMany = (users, { type, title, body = '', link = '' }) =>
  users.length ? Notification.insertMany(users.map((user) => ({ user, type, title, body, link }))) : Promise.resolve([]);

module.exports = { logActivity, notify, notifyMany };

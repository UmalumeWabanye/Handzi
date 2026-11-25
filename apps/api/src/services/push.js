const { Expo } = require('expo-server-sdk');
const { User } = require('../models');
const { isTest } = require('../config/env');

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

/**
 * Send an Expo push to every device of a user. Fire-and-forget: failures are logged, never thrown,
 * and tokens Expo reports as unregistered are removed.
 */
async function pushToUser(userId, { title, body, data }) {
  if (isTest()) return;
  try {
    const user = await User.findById(userId).select('pushTokens');
    const tokens = (user?.pushTokens || []).filter((t) => Expo.isExpoPushToken(t));
    if (!tokens.length) return;

    const messages = tokens.map((to) => ({ to, title, body, data, sound: 'default', channelId: 'default' }));
    const dead = [];
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((t, i) => {
        if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') dead.push(chunk[i].to);
      });
    }
    if (dead.length) await User.updateOne({ _id: userId }, { $pull: { pushTokens: { $in: dead } } });
  } catch (err) {
    console.warn('[push] failed:', err.message);
  }
}

module.exports = { pushToUser };

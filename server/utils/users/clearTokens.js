const cron = require('node-cron');
const usersBL = require('../../models/usersBL');

// Schedule a task to run every hour
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        await usersBL.clearExpiredTokens(now);
        console.log('Expired tokens cleaned up');
    } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
    }
});
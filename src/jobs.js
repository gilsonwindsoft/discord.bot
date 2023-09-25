var cron = require('node-cron');

function startJobs() {
    cron.schedule('* * * * *', () => {
        console.log('running a task every minute');
      });
}

exports.startJobs = startJobs;
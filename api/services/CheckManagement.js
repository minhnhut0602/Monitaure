module.exports = {

    listUserChecks: function(id, callback) {
        var criteria = {id: id};
        User.findOne(criteria).populate('checks').exec(function (err, user) {
            return callback(err, user);
        });
    },

    createCheck: function(data, callback) {
        Check.create(data).exec(function (err, created) {
            if (err) throw err;
            callback(created);
        });
    },

    // updateCheck: function(id, data, callback) {
    //     var criteria = {id: id};
    //     Check.update(criteria, data).exec(function (err, updated) {
    //         if (err) throw err;
    //         callback(updated);
    //     });
    // },

    destroyCheck: function(id, callback) {
        Check.destroy(id).exec(function (err, destroyed) {
            if (err) throw err;
            callback(destroyed);
        });
    },

    insertHistory: function(ping) {
        Check.findOne({id: ping.checkId}).exec(function (err, check) {
            if (err) throw err;

            var newHistoryArray = check.history;

            var oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            // If the first value of the array is older than a month, we remove it
            // We keep doing that until the oldest value is younger than a month
            if (typeof newHistoryArray[0] !== 'undefined') {
                while (newHistoryArray[0].date.getTime() < oneMonthAgo.getTime()) {
                    newHistoryArray.shift();
                }
            }

            newHistoryArray.push({date: ping.date, time: ping.open ? ping.duration : null, interval: check.interval});

            // And update the DB record
            Check.update({id: ping.checkId}, {history: newHistoryArray}).exec(function(err, updated) {
                if (err) throw err;
            });

        });
    },

    getData: function(checkId, callback) {
        Check.findOne({id: checkId}).exec(function (err, check) {
            if (err) throw err;

            CheckManagement.checkStats(check, function(err, data) {
                return callback(err, data);
            });

       });
    },

    getGlobalData: function(id, callback) {
        var criteria = {id: id};
        User.findOne(criteria).populate('checks').exec(function (err, user) {

            var lastError = {
                    time: null,
                    checkName: null
                },
                checksDown = 0,
                availabilitiesArray = [],
                userChecks = user.checks;

            for(var i = 0; i < userChecks.length; i++) {

                var currentCheck = userChecks[i];

                CheckManagement.checkStats(currentCheck, function(err, checkStats) {

                    // If current check is currently down, we add increment checksDown array
                    // We do that by looking up his last 'history' array value
                    if (checkStats.history[checkStats.history.length - 1].time === null) {
                        checksDown++;
                    }
                    // We add current check's availability stats to the ad hoc array
                    availabilitiesArray.push(checkStats.availability);
                    // If current check's last outage is more recent than the one
                    // stored in lastError, we update the lastError object
                    if (checkStats.lastOutage > lastError.time) {
                        lastError.time = checkStats.lastOutage;
                        lastError.checkName = checkStats.name;
                    }

                });
            }

            // Calculate the average of all the checks availabilities
            var sumAvailabilities = 0;
            for(var j = 0; j < availabilitiesArray.length; j++) {
                sumAvailabilities += availabilitiesArray[j];
            }
            var availabilitiesAvg = sumAvailabilities / availabilitiesArray.length;

            return callback(err, {
                checksDown,
                availabilitiesAvg,
                lastError
            });
        });
    },

    checkStats: function(check, callback) {
        var historyArray = check.history;
        if (historyArray.length > 0) {
            var sum = 0,
                min = historyArray[0].time,
                max = historyArray[0].time,
                avg = 0,
                totalOutage = 0,
                historyLength = 0,
                lastOutage = null;

            for (var i=0; i<historyArray.length; i++) {
                if (historyArray[i].time !== null) {
                    sum += historyArray[i].time;
                    min = historyArray[i].time < min ? historyArray[i].time : min;
                    max = historyArray[i].time > max ? historyArray[i].time : max;
                } else {
                    totalOutage += historyArray[i].interval;
                    lastOutage = historyArray[i].date;
                }
                historyLength += historyArray[i].interval;
            }
            avg = Math.round(sum / historyArray.length);

            // Number of miliseconds in a month (30 days more exactly)
            var percent = 100 - (totalOutage * 100) / historyLength;
            // We round the percentage to two places
            var availability = Utilities.customFloor(percent, 2);

            var historyShort = historyArray.splice(historyArray.length - 20, 20);

            return callback(null, {
                name: check.name,
                min: min,
                max: max,
                avg: avg,
                availability: availability,
                lastOutage: lastOutage,
                history: historyShort
            });
        } else {
            return callback('No data yet!', null);
        }
    }

};

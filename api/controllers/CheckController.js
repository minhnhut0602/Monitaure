module.exports = {

    show: function (req, res) {
        if (req.user) {
            CheckManagement.getUserAndChecksData(DB.fetchAndPopulate, req.user.id, function(err, data) {
                if (err) return res.serverError(err);

                if (req.wantsJSON) {
                    return res.json(data);
                } else {
                    return res.view({ data });
                }
            });
        } else {
            return res.view('homepage');
        }
    },

    showsimple: function (req, res) {
        CheckManagement.getCheckMinimalData(DB.fetchOne, req.user.id, req.param('id'), function(err, data) {
            if (err) return res.serverError(err);

            return res.json(data);
        });
    },

    getallstats: function (req, res) {
        CheckManagement.getUserAndChecksData(DB.fetchAndPopulate, req.user.id, function(err, data) {
            if (err) return res.serverError(err);

            return res.json(data);
        });
    },

    getcheckstats: function (req, res) {
        CheckManagement.getData(DB.fetchOne, req.user.id, req.param('id'), function(err, data) {
            if (err) return res.serverError(err);

            return res.json(data);
        });
    },

    create: function (req, res) {
        const data = {
            name: String(req.param('name')),
            domainNameOrIP: String(req.param('domainNameOrIP')),
            port: Number(req.param('port')),
            emailNotifications: Boolean(req.param('emailNotifications')),
            owner: req.user.id
        };
        CheckManagement.createCheck(DB.fetchAndPopulate, req.user.id, data, function (err, created) {
            if (err) return res.serverError(err);

            return res.json(created);
        });
    },

    update: function (req, res) {
        const data = {
            name: String(req.param('name')),
            emailNotifications: req.param('emailNotifications') ? true : false
        };
        CheckManagement.updateCheck(DB.fetchOne, DB.update, req.user.id, req.param('checkId'), data, function(err, updated) {
            if (err) return res.serverError(err);

            return res.json(updated[0]);
        });
    },

    destroy: function (req, res) {
        CheckManagement.destroyCheck(DB.fetchOne, DB.destroy, req.user.id, req.query.checkId, function(err, destroyed) {
            if (err) return res.serverError(err);

            return res.json(destroyed[0]);
        });
    }
};


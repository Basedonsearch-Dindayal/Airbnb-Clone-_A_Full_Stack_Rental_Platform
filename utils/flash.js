module.exports = function flash() {
    return (req, res, next) => {
        if (!req.session) {
            throw new Error("flash middleware requires session middleware");
        }

        req.flash = (type, message) => {
            req.session.flash = req.session.flash || {};

            if (typeof message !== "undefined") {
                req.session.flash[type] = req.session.flash[type] || [];
                req.session.flash[type].push(message);
                return req.session.flash[type];
            }

            const messages = req.session.flash[type] || [];
            delete req.session.flash[type];
            return messages;
        };

        next();
    };
};

const bcrypt = require('bcryptjs');

let adminPasswordHash = null;

const getPasswordHash = () => {
    if (!adminPasswordHash) {
        const plainPassword = process.env.ADMIN_PASSWORD;
        if (!plainPassword) {
            console.error("ERROR: ADMIN_PASSWORD environment variable is not set.");
            process.exit(1); // Stop the server if no password is set
        }
        adminPasswordHash = bcrypt.hashSync(plainPassword, 10);
    }
    return adminPasswordHash;
};

const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

const attemptLogin = (username, password) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername || username !== adminUsername) {
        return false;
    }
    
    const hash = getPasswordHash();
    return bcrypt.compareSync(password, hash);
};

module.exports = {
    requireAuth,
    attemptLogin
};

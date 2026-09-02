const bcrypt = require('bcryptjs');

let adminPasswordHash = null;

const getPasswordHash = () => {
    if (!adminPasswordHash) {
        const plainPassword = process.env.ADMIN_PASSWORD || 'admin';
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
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    if (username !== adminUsername) {
        return false;
    }
    
    const hash = getPasswordHash();
    return bcrypt.compareSync(password, hash);
};

module.exports = {
    requireAuth,
    attemptLogin
};

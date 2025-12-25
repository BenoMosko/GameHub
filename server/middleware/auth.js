const jwt = require('jsonwebtoken');
const config = require('config');

const auth = async (request, response, next) => {
    try {
        const token = request.header('x-auth-token');
        if (!token) {
            return response.status(401).json({ msg: 'No token, authorization denied' });
        }
        jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
            if (error) {
                return response.status(401).json({ msg: 'Token is not valid' });
            } else {
                request.user = decoded.user;
                next();
            }
        });
    } catch (error) {
        console.error('something wrong with auth middleware');
        response.status(500).json({ msg: 'Server Error' });
    }
}
module.exports = {auth};
const axios = require('axios');
const updateUser = async () => {
    try {
        const id = '66c4a331e796d7578bebe850';
        const name = 'ben1';
        const username = 'ben1';
        const email = 'ben1@ben1.com';
        const password = 'ben1123'
        const body = {
            name: name,
            username: username,
            email: email,
            password: password
        };
        const url = `http://localhost:8200/api/users/${id}`;
        const request = axios.put(url, body);
    } catch (error) {
        throw(error)
    }
}
updateUser();
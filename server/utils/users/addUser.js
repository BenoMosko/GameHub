const axios = require('axios');

const addUser = async () => {
    try {
        const url = 'http://localhost:8200/api/users/register';
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        };
        const postData = {
            name: 'admin',
            username: 'admin',
            email: 'admin@admin.com',
            password: 'admin123',
            role: 'admin'
        };
        const request = await axios.post(url, postData, config);
    } catch (error) {
        console.log(error.response.data.message);
    }
}
addUser();
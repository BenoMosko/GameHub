const axios = require('axios');
const loginUser = async () => {
    try {
        const url = 'http://localhost:8200/api/users/login';
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        };
        const postData = {
            email: 'ben@ben.com',
            password: 'ben123'
        };
        const request = await axios.post(url, postData, config);
        console.log(request.data.token)
    } catch (error) {
        console.log(error.response.data.message);
    }
}
loginUser();
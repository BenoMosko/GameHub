const axios = require('axios');

const getUsers = async () => {
    try {
        const url = 'http://localhost:8200/api/users';
        const request = await axios.get(url);
        console.log(request.data);
    } catch (error) {
        
    }
}
getUsers();
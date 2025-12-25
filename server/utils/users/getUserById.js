const axios = require('axios');

const getUserById = async () => {
    try {
        const id = '66bcf4232e6e521ec696381d';
        const url = `http://localhost:8200/api/users/${id}`;
        const request = await axios.get(url);
        console.log(request.data);
    } catch (error) {
        throw(error);
    }
}
getUserById();
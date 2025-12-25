const axios = require('axios');
const deleteUser = async () => {
    try {
        const id = '67ce829d44d85ca458fb429e';
        const url = `http://localhost:8200/api/users/${id}`;
        const request = await axios.delete(url);
    } catch (error) {
        throw(error);
    }
}
deleteUser();
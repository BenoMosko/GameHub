const bcrypt = require('bcryptjs');
const password = 'ben1123';
const hashedPassword = '$2a$10$FTHmht2/WE4f9vIjrLtwiOA..j1pmd0QTGQWnep8ZvqHyxo1TAG8W';
const compare = async () => {
    const check = await bcrypt.compare(password, hashedPassword);
    console.log(check);
}
compare();
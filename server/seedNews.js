const mongoose = require('mongoose');
const News = require('./models/newsModel');

// DB Config
const db = "mongodb+srv://Admin:Dallas41@sarajevo.nyyt3.mongodb.net/Sarajevo?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.log(err));

const seedData = [
    {
        title: 'INTER-DIMENSIONAL INTEL: DARK SOULS REMASTERED',
        content: "Detailed structural analysis of the 'Dark Souls' simulation indicates a highly hostile environment. Subject 'Chosen Undead' faces extreme resistance. Review: 9/10. The tactical depth of combat remains unsurpassed, though the visual fidelity has been enhanced. Prepare for heavy casualties.",
        author: 'Intelligence Officer',
        date: new Date('2025-12-20')
    },
    {
        title: 'BIOLOGICAL THREAT ASSESSMENT: BLOODBORNE',
        content: "Yharnam Sector reports outbreak of 'Beast Scourge'. Hunter units deployed. Combat protocol requires aggression over defense. Weaponry: Trick Weapons recommended. Risk Level: EXTREME. This simulation is a masterpiece of atmospheric horror and aggressive combat systems.",
        author: 'Medical Corps',
        date: new Date('2025-12-22')
    },
    {
        title: 'TACTICAL REVIEW: ELDEN RING EXPANSION',
        content: "Shadow of the Erdtree expansion detected. New regions mapped. The integration of open-world mechanics with classic Souls-like difficulty creates a compelling battlefield. Tarnished units are advised to explore thoroughly. Rating: ESSENTIAL.",
        author: 'Field Marshal',
        date: new Date('2025-12-23')
    },
    {
        title: 'SYSTEM UPDATE: SEKIRO COMBAT MECHANICS',
        content: "Analysis of 'Sekiro' deflection system complete. Unlike standard shielding, this requires precise timing. Hesitation is defeat. This module offers the tightest swordplay in the archive.",
        author: 'Combat Instructor',
        date: new Date('2025-12-18')
    }
];

const seedDB = async () => {
    try {
        await News.deleteMany({}); // Optional: clear old news
        await News.insertMany(seedData);
        console.log('Intel Updates Seeded Successfully');
    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();

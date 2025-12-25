const express = require('express');
const router = express.Router();
const News = require('../../models/newsModel');

// @route   GET api/news
// @desc    Get all news items
// @access  Public
router.get('/', async (req, res) => {
    try {
        const news = await News.find().sort({ date: -1 });
        res.json(news);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/news
// @desc    Create a news item
// @access  Private (TODO: Add Auth Middleware)
router.post('/', async (req, res) => {
    const { title, content, author } = req.body;

    try {
        const newNews = new News({
            title,
            content,
            author
        });

        const news = await newNews.save();
        res.json(news);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/news/:id
// @desc    Update a news item
// @access  Private (TODO: Add Auth Middleware)
router.put('/:id', async (req, res) => {
    const { title, content, author } = req.body;

    // Build header object
    const newsFields = {};
    if (title) newsFields.title = title;
    if (content) newsFields.content = content;
    if (author) newsFields.author = author;

    try {
        let news = await News.findById(req.params.id);

        if (!news) return res.status(404).json({ msg: 'News not found' });

        news = await News.findByIdAndUpdate(
            req.params.id,
            { $set: newsFields },
            { new: true }
        );

        res.json(news);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/news/:id
// @desc    Delete a news item
// @access  Private (TODO: Add Auth Middleware)
router.delete('/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id);

        if (!news) return res.status(404).json({ msg: 'News not found' });

        await News.findByIdAndDelete(req.params.id);

        res.json({ msg: 'News item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

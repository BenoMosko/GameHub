import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsItem from './NewsItem';
import '../../css/NewsPage/NewsPage.css';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await axios.get('http://localhost:8200/api/news');
                setNews(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching news:", err);
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="news-page">
            <h1 className="news-page-title">Intelligence Briefings</h1>
            <div className="news-container">
                {loading ? (
                    <div className="loading-text">DECYPHERING TRANSMISSIONS...</div>
                ) : news.length > 0 ? (
                    news.map(item => (
                        <NewsItem key={item._id} news={item} />
                    ))
                ) : (
                    <div className="no-news">NO INTELLIGENCE AVAILABLE</div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;

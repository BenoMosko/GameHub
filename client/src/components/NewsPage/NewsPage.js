import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsItem from './NewsItem';
import '../../css/NewsPage/NewsPage.css';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState(null);

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

    const openBriefing = (item) => {
        setSelectedNews(item);
    };

    const closeBriefing = () => {
        setSelectedNews(null);
    };

    return (
        <div className="news-page">
            <h1 className="news-page-title">Intelligence Briefings</h1>
            <div className="news-container">
                {loading ? (
                    <div className="loading-text">DECYPHERING TRANSMISSIONS...</div>
                ) : news.length > 0 ? (
                    news.map(item => (
                        <div key={item._id} onClick={() => openBriefing(item)}>
                            <NewsItem news={item} />
                        </div>
                    ))
                ) : (
                    <div className="no-news">NO INTELLIGENCE AVAILABLE</div>
                )}
            </div>

            {/* INTEL MODAL */}
            {selectedNews && (
                <div className="news-modal-overlay" onClick={closeBriefing}>
                    <div className="news-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="news-modal-close" onClick={closeBriefing}>×</button>

                        <div className="news-modal-header">
                            <h2 className="news-modal-title">CLASSIFIED INTEL // {selectedNews.title}</h2>
                            <div className="news-modal-meta">
                                <span>DATE: {new Date(selectedNews.date).toLocaleDateString()}</span>
                                <span>SOURCE: {selectedNews.author}</span>
                            </div>
                        </div>

                        <div className="news-modal-body">
                            <p>{selectedNews.content}</p>
                        </div>

                        <div className="news-modal-footer">
                            <button
                                className="btn-share-intel"
                                onClick={() => {
                                    const text = `CLASSIFIED INTEL: ${selectedNews.title}\nRead full briefing: https://games-hub-client.onrender.com/`;
                                    navigator.clipboard.writeText(text);
                                    alert("Intel Access Link copied to clipboard.");
                                }}
                            >
                                TRANSMIT TO ALLIES
                            </button>
                            <div style={{ marginTop: '1rem' }}>END OF TRANSMISSION</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsPage;

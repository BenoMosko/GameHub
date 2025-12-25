import React from 'react';
import '../../css/NewsPage/NewsItem.css';

const NewsItem = ({ news }) => {
    return (
        <div className="news-item">
            <div className="news-header">
                <span className="news-title">{news.title}</span>
                <span className="news-date">{new Date(news.date).toLocaleDateString()}</span>
            </div>
            <div className="news-content">
                <p>{news.content}</p>
            </div>
            <div className="news-footer">
                <span className="news-author">TRANSMISSION BY: {news.author}</span>
            </div>
        </div>
    );
};

export default NewsItem;

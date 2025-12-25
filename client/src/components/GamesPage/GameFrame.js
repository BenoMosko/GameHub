import React from 'react';
import '../../css/GamesPage/GameFrame.css'; // Will create this

function GameFrame({ url, title, onClose }) {
    if (!url) return null;

    return (
        <div className="game-frame-overlay">
            <div className="game-frame-container">
                <div className="game-frame-header">
                    <span className="game-frame-title">SIMULATION ACTIVE: {title}</span>
                    <button className="btn-close-game" onClick={onClose}>ABORT SIMULATION</button>
                </div>
                <div className="game-frame-body">
                    <iframe
                        src={url}
                        title={title}
                        className="game-iframe"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}

export default GameFrame;

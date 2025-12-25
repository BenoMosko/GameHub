import React, { useState } from 'react';
import GameFrame from './GameFrame';
import '../../css/GamesPage/GamesPage.css';

const GAMES_DATA = [
    {
        id: 1,
        title: 'CHRONO DIVIDE (RA2)',
        description: 'Web-based Red Alert 2 multiplayer reconstruction. Full faction support.',
        image: 'https://image.pollinations.ai/prompt/red%20alert%202%20kirov%20reporting%20screenshot?width=400&height=250&nologo=true',
        url: 'https://game.chronodivide.com/',
        type: 'BROWSER',
        status: 'ONLINE',
        external: true
    },
    {
        id: 2,
        title: 'RED ALERT 1 (CLASSIC)',
        description: 'Original Red Alert running via DOSbox emulation. Skirmish compatible.',
        image: 'https://image.pollinations.ai/prompt/red%20alert%201%20soviet%20tank%20rush%20screenshot?width=400&height=250&nologo=true',
        url: 'https://dos.zone/player/?bundleUrl=https%3A%2F%2Fcdn.dos.zone%2Fcustom%2Fdos%2Fred-alert.jsdos?anonymous=1',
        type: 'EMULATOR',
        status: 'ONLINE',
        external: true
    },
    {
        id: 3,
        title: 'TIBERIAN DAWN',
        description: 'The conflict that started it all. GDI vs Brotherhood of Nod.',
        image: 'https://image.pollinations.ai/prompt/command%20and%20conquer%20tiberian%20dawn%20base%20screenshot?width=400&height=250&nologo=true',
        url: 'https://dos.zone/player/?bundleUrl=https%3A%2F%2Fcdn.dos.zone%2Fcustom%2Fdos%2Fcommand-and-conquer.jsdos?anonymous=1',
        type: 'EMULATOR',
        status: 'ONLINE',
        external: true
    }
];

function GamesPage() {
    const [activeGame, setActiveGame] = useState(null);

    return (
        <div className="games-page">
            <h1 className="games-title">TACTICAL SIMULATIONS HUB</h1>
            <div className="games-grid">
                {GAMES_DATA.map(game => (
                    <div key={game.id} className="game-card">
                        <div className="game-image-container">
                            <img src={game.image} alt={game.title} className="game-image" />
                            <div className={`game-status status-${game.status.toLowerCase()}`}>
                                {game.status}
                            </div>
                        </div>
                        <div className="game-info">
                            <h3>{game.title}</h3>
                            <p>{game.description}</p>
                            <button
                                className="btn-launch"
                                disabled={game.status !== 'ONLINE'}
                                onClick={() => {
                                    if (game.external) {
                                        window.open(game.url, '_blank', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
                                    } else {
                                        setActiveGame(game);
                                    }
                                }}
                            >
                                {game.status === 'ONLINE' ? 'INITIATE SEQUENCE' : 'UNAVAILABLE'}
                            </button>

                            {/* Comms Link Button */}
                            <button
                                className="btn-launch"
                                style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #4ade80', color: '#4ade80' }}
                                onClick={() => {
                                    window.open('/minichat', 'CommsLink', 'width=400,height=600,menubar=no,toolbar=no,location=no,status=no,right=0,top=0');
                                }}
                            >
                                OPEN COMMS LINK
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Render Game Frame if active */}
            {activeGame && (
                <GameFrame
                    url={activeGame.url}
                    title={activeGame.title}
                    onClose={() => setActiveGame(null)}
                />
            )}
        </div>
    );
}

export default GamesPage;

document.addEventListener('DOMContentLoaded', () => {
    drawInitialCard();
    logContainer = document.getElementById('log-container');
    const dragHandle = logContainer.querySelector('.drag-handle');
    if (!logContainer || !dragHandle) {
        console.error('Log container or drag handle not found!');
        return;
    }
    console.log('Initializing drag for log-container...');

    // Função para inicializar a posição do log-container
    function initializeLogContainerPosition() {
        if (window.innerWidth > 600) {
            logContainer.style.position = 'absolute';
            logContainer.style.right = '20px'; // Corresponde ao CSS
            logContainer.style.top = '20px';
            logContainer.style.margin = '0';
            currentX = parseFloat(logContainer.style.right) || 20;
            currentY = parseFloat(logContainer.style.top) || 20;
        } else {
            logContainer.style.position = 'relative';
            logContainer.style.right = 'auto';
            logContainer.style.top = 'auto';
            logContainer.style.bottom = 'auto';
            logContainer.style.margin = '20px auto';
            currentX = 0;
            currentY = 0;
        }
        console.log('Log container initialized at x:', currentX, 'y:', currentY);
    }

    // Inicializar posição quando o game-content for exibido
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameContent = document.getElementById('game-content');
    const playGameBtn = document.getElementById('play-game-btn');
    playGameBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        gameContent.style.display = 'block';
        initializeLogContainerPosition(); // Inicializa posição após exibir o jogo
    });

    // Inicializar posição se o game-content já estiver visível (caso a tela inicial seja desativada)
    if (gameContent.style.display !== 'none') {
        initializeLogContainerPosition();
    }

    logContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        console.log('Drag started on log-container');
        e.preventDefault();
        e.stopPropagation();
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;
        logContainer.style.position = 'absolute';
        logContainer.style.margin = '0';
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            logContainer.style.right = 'auto';
            logContainer.style.left = `${currentX}px`;
            logContainer.style.top = `${currentY}px`;
            logContainer.style.bottom = 'auto';
            logContainer.style.margin = '0';
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            e.stopPropagation();
        }
    });
    logContainer.addEventListener('touchstart', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        initialX = touch.clientX - currentX;
        initialY = touch.clientY - currentY;
        isDragging = true;
        logContainer.style.position = 'absolute';
        logContainer.style.margin = '0';
    });
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;
            logContainer.style.right = 'auto';
            logContainer.style.left = `${currentX}px`;
            logContainer.style.top = `${currentY}px`;
            logContainer.style.bottom = 'auto';
            logContainer.style.margin = '0';
        }
    });
    document.addEventListener('touchend', (e) => {
        if (isDragging) {
            isDragging = false;
            e.stopPropagation();
        }
    });
    logContainer.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
    document.getElementById('card-board').addEventListener('touchstart', function (e) {
        if (!isWalletConnected) {
            toggleConnectMessage(true);
            e.preventDefault();
            return;
        }
        if (!isSpinning && !isRoundStarted) {
            startRound();
            e.preventDefault();
        }
    });
    document.getElementById('play-btn').addEventListener('click', () => {
        if (window.sendGameAction) {
            window.sendGameAction();
        } else {
            console.log('Game action function not ready!');
        }
        if (!isWalletConnected) {
            toggleConnectMessage(true);
            return;
        }
        if (!isSpinning && !isRoundStarted) {
            startRound();
        }
    });
    document.getElementById('stop-btn').addEventListener('click', () => {
        if (isRoundStarted) {
            updateSessionPoints();
            toggleTotalPointsMessage(true);
            window.dispatchEvent(new CustomEvent('prizeAwarded', { detail: { prize: sessionPoints } }));
            endGame(true);
        } else {
            window.dispatchEvent(new CustomEvent('prizeAwarded', { detail: { prize: 0 } }));
        }
    });
    document.getElementById('skip-btn').addEventListener('click', () => {
        if (!isRoundStarted) {
            drawInitialCard();
        }
    });
    window.addEventListener('walletConnected', () => {
        isWalletConnected = true;
        console.log('Wallet connected');
    });
    window.addEventListener('userLoggedOut', () => {
        isWalletConnected = false;
        console.log('User logged out');
    });
    window.addEventListener('leaderboardUpdated', (event) => {
        console.log('leaderboardUpdated event received:', event.detail);
        leaderboardData = event.detail.leaderboard || [];
        currentPlayerRank = event.detail.playerRank || { rank: 0, score: 0 };
        if (document.getElementById('leaderboard-message').style.display === 'block') {
            toggleLeaderboardMessage(true, leaderboardData, currentPlayerRank);
        }
    });
    window.addEventListener('prizeConfirmed', (event) => {
        const prize = event.detail.prize;
        toggleTotalPointsMessage(true);
    });
});
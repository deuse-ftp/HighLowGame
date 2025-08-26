try {
    console.log("Initializing HiLo...");
    size = Math.min(window.innerWidth * 0.9, 400);
    window.addEventListener('resize', () => {
        size = Math.min(window.innerWidth * 0.9, 400);
    });
    function updateSessionPoints() {
        const multiplierDiff = Number((sessionMultiplier - 1).toFixed(2));
        sessionPoints = Math.max(0, Math.round(100 * multiplierDiff));
        console.log(`ℹ️ Updating session points: multiplier=${sessionMultiplier}, diff=${multiplierDiff}, points=${sessionPoints}`);
        const pointsList = document.getElementById('points-list');
        if (pointsList) {
            const pointItem = document.createElement('li');
            pointItem.textContent = `Points: ${sessionPoints} (x${sessionMultiplier.toFixed(2)})`;
            pointsList.insertBefore(pointItem, pointsList.firstChild);
        }
        if (document.getElementById('total-points-message').style.display === 'block') {
            toggleTotalPointsMessage(true);
        }
    }
    function moveToDiscardPile(card) {
        const discardPile = document.getElementById('discard-pile');
        const discardCard = document.createElement('div');
        discardCard.className = 'discard-card';
        const rankDisplay = rankDisplayMap[card.rank] || card.rank;
        const suitDisplay = suitDisplayMap[card.suit];
        discardCard.innerHTML = `<img src="${card.image}" alt="${rankDisplay} de ${suitDisplay}" style="width:100%; height:100%; object-fit: cover;">`;
        discardPile.appendChild(discardCard);
        while (discardPile.children.length > 5) {
            discardPile.removeChild(discardPile.firstChild);
        }
    }
    function startRound() {
        if (isSpinning || isRoundStarted || !isWalletConnected) {
            toggleConnectMessage(true);
            return;
        }
        // Check if username exists and is not 'Unknown' or empty
        const username = window.privyUsername || 'Unknown';
        if (username === 'Unknown' || !username) {
            toggleNoUsernameMessage(true);
            return;
        }
        isRoundStarted = true;
        sessionMultiplier = 1.0;
        sessionPoints = 0;
        greenStreak = 0;
        gameHistory = [];
        document.getElementById('points-list').innerHTML = '';
        document.getElementById('next-card').style.display = 'none';
        document.getElementById('discard-pile').innerHTML = '';
        const currentCardElem = document.getElementById('current-card');
        const card = JSON.parse(currentCardElem.dataset.card);
        const rank = getRank(card);
        updateProbabilities(rank);
        document.getElementById('probabilities').style.display = 'block';
        document.getElementById('skip-btn').style.display = 'none';
        const higherBtn = document.getElementById('higher-btn');
        const lowerBtn = document.getElementById('lower-btn');
        const stopBtn = document.getElementById('stop-btn');
        const playBtn = document.getElementById('play-btn');
        playBtn.disabled = true;
        playBtn.style.display = 'none'; // Ocultar Play durante a partida
        higherBtn.disabled = false;
        lowerBtn.disabled = false;
        stopBtn.disabled = false;
        // Mostrar botões Stop, Lower e Higher
        higherBtn.style.display = 'inline-block';
        lowerBtn.style.display = 'inline-block';
        stopBtn.style.display = 'inline-block';
    }
    function updateProbabilities(rank) {
        const probHi = ((13 - rank) / 13 * 100).toFixed(0);
        const probLo = ((rank - 1) / 13 * 100).toFixed(0);
        const probTie = (1 / 13 * 100).toFixed(0);
        let html = '';
        if (rank > 1) html += `Lower: ${probLo}%<br>`;
        if (rank < 13) html += `Higher: ${probHi}%<br>`;
        html += `Same: ${probTie}%`;
        document.getElementById('probabilities').innerHTML = html;
    }
    function endGame(savePoints) {
        if (savePoints) {
            updateSessionPoints();
        } else {
            console.log('❌ Game Over');
            toggleGameOverMessage(true);
            sessionPoints = 0;
            updateSessionPoints();
        }
        isRoundStarted = false;
        isSpinning = false;
        document.getElementById('current-card').textContent = '';
        document.getElementById('next-card').style.display = 'none';
        document.getElementById('probabilities').innerHTML = '';
        document.getElementById('probabilities').style.display = 'none';
        document.getElementById('discard-pile').innerHTML = '';
        const higherBtn = document.getElementById('higher-btn');
        const lowerBtn = document.getElementById('lower-btn');
        const stopBtn = document.getElementById('stop-btn');
        const playBtn = document.getElementById('play-btn');
        const skipBtn = document.getElementById('skip-btn');
        playBtn.disabled = false;
        playBtn.style.display = 'inline-block'; // Mostrar Play quando a partida termina
        higherBtn.disabled = true;
        lowerBtn.disabled = true;
        stopBtn.disabled = true;
        // Ocultar botões Stop, Lower e Higher
        higherBtn.style.display = 'none';
        lowerBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        skipBtn.style.display = 'inline-block';
        drawInitialCard();
        if (document.getElementById('total-points-message').style.display === 'block') {
            toggleTotalPointsMessage(true);
        }
    }
    function toggleGameOverMessage(show) {
        const messageDiv = document.getElementById('game-over-message');
        messageDiv.style.display = show ? 'block' : 'none';
    }
    function toggleNoUsernameMessage(show) {
        const messageDiv = document.getElementById('no-username-message');
        const messageP = document.getElementById('no-username-message').querySelector('p');
        messageP.textContent = 'You need register your Monad Username to play this game';
        messageDiv.style.display = show ? 'flex' : 'none';
        if (show) {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 7000);
        }
    }
    function makeGuess(guess) {
        if (window.sendGameAction) {
            window.sendGameAction();
        } else {
            console.log('Game action function not ready!');
        }
        if (!isRoundStarted || isSpinning) return;
        isSpinning = true;
        const currentCardElem = document.getElementById('current-card');
        const currentCard = JSON.parse(currentCardElem.dataset.card);
        const rank = getRank(currentCard);
        const payout = (guess === 'higher') ? higherPayouts[rank] : lowerPayouts[rank];
        let nextCard = getRandomCard();
        let nextRank = getRank(nextCard);
        let result = '';
        let pointsAdded = 0;
        const nextCardElem = document.getElementById('next-card');
        const nextRankDisplay = rankDisplayMap[nextCard.rank] || nextCard.rank;
        const nextSuitDisplay = suitDisplayMap[nextCard.suit];
        nextCardElem.innerHTML = `<img src="${nextCard.image}" alt="${nextRankDisplay} de ${nextSuitDisplay}" style="width:100%; height:100%; border-radius:10px; object-fit: cover;">`;
        nextCardElem.dataset.card = JSON.stringify(nextCard);
        nextCardElem.style.display = 'flex';
        nextCardElem.style.opacity = '0';
        nextCardElem.style.transform = 'translate(-50%, -50%) rotateY(90deg)';
        setTimeout(() => {
            nextCardElem.style.opacity = '1';
            nextCardElem.style.transform = 'translate(-50%, -50%) rotateY(0deg)';
        }, 10);
        console.log(`Carta atual: ${currentCard.rank} (rank ${rank}), Próxima: ${nextCard.rank} (rank ${nextRank}), Aposta: ${guess}`);
        if (nextRank === rank) {
            if ((rank === 1 && guess === 'higher') || (rank === 13 && guess === 'lower')) {
                result = 'RED';
                setTimeout(() => {
                    endGame(false);
                }, 400);
            } else {
                while (nextCard.suit === currentCard.suit) {
                    nextCard.suit = suits[Math.floor(Math.random() * suits.length)];
                }
                nextCard.image = `/cards/${rankMap[nextCard.rank]}_${nextCard.suit}.png`;
                const updatedNextSuitDisplay = suitDisplayMap[nextCard.suit];
                nextCardElem.innerHTML = `<img src="${nextCard.image}" alt="${nextRankDisplay} de ${updatedNextSuitDisplay}" style="width:100%; height:100%; border-radius:10px; object-fit: cover;">`;
                nextCardElem.dataset.card = JSON.stringify(nextCard);
                setTimeout(() => {
                    currentCardElem.innerHTML = nextCardElem.innerHTML;
                    currentCardElem.dataset.card = nextCardElem.dataset.card;
                    nextCardElem.style.display = 'none';
                    isSpinning = false;
                }, 800);
                console.log('Same card - void, continuing with new suit...');
                result = 'SAME';
            }
        } else {
            if ((guess === 'higher' && nextRank > rank) || (guess === 'lower' && nextRank < rank)) {
                moveToDiscardPile(currentCard);
                sessionMultiplier *= payout;
                pointsAdded = Math.round(10 * (payout - 1));
                currentCardElem.style.opacity = '0';
                currentCardElem.style.transform = 'translate(-50%, -50%) rotateY(-90deg)';
                setTimeout(() => {
                    currentCardElem.innerHTML = nextCardElem.innerHTML;
                    currentCardElem.dataset.card = nextCardElem.dataset.card;
                    currentCardElem.style.opacity = '1';
                    currentCardElem.style.transform = 'translate(-50%, -50%) rotateY(0deg)';
                    nextCardElem.style.display = 'none';
                    updateSessionPoints();
                    greenStreak++;
                    updateProbabilities(nextRank);
                    const higherBtn = document.getElementById('higher-btn');
                    const lowerBtn = document.getElementById('lower-btn');
                    higherBtn.disabled = false;
                    lowerBtn.disabled = false;
                    isSpinning = false;
                }, 400);
                result = 'GREEN';
            } else {
                result = 'RED';
                setTimeout(() => {
                    endGame(false);
                }, 400);
            }
        }
        console.log(`Resultado: ${result}`);
        const currentRankDisplay = rankDisplayMap[currentCard.rank] || currentCard.rank;
        const currentSuitDisplay = suitDisplayMap[currentCard.suit];
        gameHistory.push({
            card: `${currentRankDisplay} de ${currentSuitDisplay}`,
            guess: guess.toUpperCase(),
            result: result,
            points: result === 'GREEN' ? pointsAdded : 0
        });
    }
    function toggleConnectMessage(show) {
        const messageDiv = document.getElementById('connect-wallet-message');
        const messageP = document.getElementById('connect-wallet-message').querySelector('p');
        let message = '';
        if (!isWalletConnected) {
            message = 'Connect your Monad ID Wallet';
        }
        messageP.textContent = message;
        messageDiv.style.display = show && message ? 'flex' : 'none';
        if (show && message) {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 7000);
        }
    }
    function toggleTotalPointsMessage(show) {
        const messageDiv = document.getElementById('total-points-message');
        const messageP = document.getElementById('total-points-message').querySelector('p');
        if (show) {
            const formattedPoints = Number.isInteger(sessionPoints) ? sessionPoints.toString() : sessionPoints.toFixed(1);
            messageP.textContent = `Total Points: ${formattedPoints} points`;
        }
        messageDiv.style.display = show ? 'block' : 'none';
    }
    function toggleSegmentCountsMessage(show) {
        const messageDiv = document.getElementById('segment-counts-message');
        const list = document.getElementById('segment-counts-list');
        if (show) {
            list.innerHTML = '';
            if (gameHistory.length > 0) {
                let tempMultiplier = 1.0;
                gameHistory.forEach((entry, index) => {
                    const li = document.createElement('li');
                    let points = 0;
                    if (entry.result === 'GREEN') {
                        const rank = getRank({rank: entry.card.split(' ')[0]});
                        const payout = (entry.guess === 'HIGHER') ? higherPayouts[rank] : lowerPayouts[rank];
                        tempMultiplier *= payout;
                        points = Math.max(0, Math.round(100 * (tempMultiplier - 1)));
                    }
                    li.textContent = `Card: ${entry.card}, Choice: ${entry.guess}, Result: ${entry.result}`;
                    list.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No games played yet.';
                list.appendChild(li);
            }
        }
        messageDiv.style.display = show ? 'block' : 'none';
    }
    function toggleLeaderboardMessage(show, leaderboardData, playerRank) {
        const messageDiv = document.getElementById('leaderboard-message');
        const list = document.getElementById('leaderboard-list');
        if (show) {
            list.innerHTML = '';
            if (!leaderboardData || leaderboardData.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'Loading leaderboard...';
                list.appendChild(li);
            } else {
                leaderboardData.forEach((entry, index) => {
                    const li = document.createElement('li');
                    const formattedScore = Number.isInteger(entry.score) ? entry.score.toString() : entry.score.toFixed(1);
                    li.textContent = `${index + 1}. ${entry.username || 'Unknown'}: ${formattedScore} points`;
                    list.appendChild(li);
                });
            }
            if (isWalletConnected && playerRank && typeof playerRank.score === 'number' && playerRank.score >= 0) {
                const playerLi = document.createElement('li');
                const formattedPlayerScore = Number.isInteger(playerRank.score) ? playerRank.score.toString() : playerRank.score.toFixed(1);
                playerLi.textContent = `Your Rank: ${playerRank.rank || 'Not ranked'}, Your Score: ${formattedPlayerScore} points`;
                playerLi.style.marginTop = '10px';
                playerLi.style.borderTop = '1px solid #836EF9';
                playerLi.id = 'player-rank';
                if (!list.querySelector('#player-rank')) {
                    list.appendChild(playerLi);
                }
            }
        }
        messageDiv.style.display = show ? 'block' : 'none';
    }
    function closeAllPanels() {
        toggleTotalPointsMessage(false);
        toggleSegmentCountsMessage(false);
        toggleLeaderboardMessage(false);
        toggleGameOverMessage(false);
        toggleNoUsernameMessage(false);
    }
    document.getElementById('total-points-btn').addEventListener('click', () => {
        closeAllPanels();
        toggleTotalPointsMessage(true);
    });
    document.querySelector('.close-points-btn').addEventListener('click', () => {
        toggleTotalPointsMessage(false);
    });
    document.getElementById('segment-counts-btn').addEventListener('click', () => {
        closeAllPanels();
        toggleSegmentCountsMessage(true);
    });
    document.querySelector('.close-segment-counts-btn').addEventListener('click', () => {
        toggleSegmentCountsMessage(false);
    });
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
        console.log('Leaderboard button clicked');
        closeAllPanels();
        toggleLeaderboardMessage(true, leaderboardData, currentPlayerRank);
    });
    document.querySelector('.close-leaderboard-btn').addEventListener('click', () => {
        toggleLeaderboardMessage(false);
    });
    document.getElementById('higher-btn').addEventListener('click', () => makeGuess('higher'));
    document.getElementById('lower-btn').addEventListener('click', () => makeGuess('lower'));
    document.querySelector('.close-game-over-btn').addEventListener('click', () => {
        toggleGameOverMessage(false);
    });
    document.querySelector('.close-no-username-btn').addEventListener('click', () => {
        toggleNoUsernameMessage(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            if (!isSpinning && !isRoundStarted) {
                startRound();
            }
        } else if (e.key.toLowerCase() === 'h') {
            makeGuess('higher');
        } else if (e.key.toLowerCase() === 'l') {
            makeGuess('lower');
        }
    });
    console.log("HiLo initialized successfully!");
} catch (error) {
    console.error("Error initializing HiLo:", error);
}
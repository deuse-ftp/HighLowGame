let logContainer = null;
let size = 0;
let currentX;
let currentY;
let initialX;
let initialY;
let isDragging = false;
let isWalletConnected = false;
let isSpinning = false;
let isRoundStarted = false;
let sessionPoints = 0;
let sessionMultiplier = 1.0;
let greenStreak = 0;
let gameHistory = [];
let leaderboardData = [];
let currentPlayerRank = { rank: 0, score: 0 };
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['coracao', 'espada', 'ouro', 'paus'];
const rankMap = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
const suitDisplayMap = {
    'coracao': 'coração',
    'espada': 'espada',
    'ouro': 'ouro',
    'paus': 'paus'
};
const rankDisplayMap = {
    'A': 'Ás',
    'J': 'Valete',
    'Q': 'Dama',
    'K': 'Rei'
};
const higherPayouts = {
    1: 1.1,
    2: 1.1,
    3: 1.2,
    4: 1.3,
    5: 1.4,
    6: 1.5,
    7: 1.8,
    8: 2,
    9: 3,
    10: 4,
    11: 5,
    12: 12,
    13: 0
};
const lowerPayouts = {
    1: 0,
    2: 12,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1.8,
    8: 1.5,
    9: 1.4,
    10: 1.3,
    11: 1.2,
    12: 1.1,
    13: 1.1
};
function getRandomCard() {
    const rankIndex = Math.floor(Math.random() * ranks.length);
    const suitIndex = Math.floor(Math.random() * suits.length);
    const rank = ranks[rankIndex];
    const suit = suits[suitIndex];
    const imageRank = rankMap[rank];
    const image = `/cards/${imageRank}_${suit}.png`;
    return { rank, suit, image };
}
function getRank(card) {
    return rankMap[card.rank] || 1;
}
function drawInitialCard() {
    const card = getRandomCard();
    console.log('Carta inicial: ' + card.image);
    const currentCardElem = document.getElementById('current-card');
    const rankDisplay = rankDisplayMap[card.rank] || card.rank;
    const suitDisplay = suitDisplayMap[card.suit];
    currentCardElem.innerHTML = `<img src="${card.image}" alt="${rankDisplay} de ${suitDisplay}" style="width:100%; height:100%; border-radius:10px; object-fit: cover;">`;
    currentCardElem.dataset.card = JSON.stringify(card);
}
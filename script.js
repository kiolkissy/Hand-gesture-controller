const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureFeedback = document.getElementById('gestureFeedback');

// Sample card data - Famous Architects
const cards = [
    {
        title: "Frank Lloyd Wright",
        subtitle: "1867-1959",
        image: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop"
    },
    {
        title: "Frank Gehry",
        subtitle: "1929-Present",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    },
    {
        title: "I. M. Pei",
        subtitle: "1917-2019",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
        title: "Zaha Hadid",
        subtitle: "1950-2016",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    {
        title: "Philip Johnson",
        subtitle: "1906-2005",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop"
    },
    {
        title: "Ludwig Mies van der Rohe",
        subtitle: "1886-1969",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop"
    },
    {
        title: "Le Corbusier",
        subtitle: "1887-1965",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    }
];

let currentCardIndex = 0;
let removedCards = []; // Stack for undo
let handStartX = null;
let handStartTime = null;
let lastGestureTime = 0;

// Render all cards
function renderCards() {
    const track = document.getElementById('carouselTrack');
    track.innerHTML = '';

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.index = index;

        cardEl.innerHTML = `
            <img src="${card.image}" alt="${card.title}" class="card-image">
            <div class="card-content">
                <h2 class="card-title">${card.title}</h2>
                <p class="card-subtitle">${card.subtitle}</p>
            </div>
        `;

        track.appendChild(cardEl);
    });
}

// Show gesture feedback
function showFeedback(text) {
    gestureFeedback.textContent = text;
    gestureFeedback.classList.add('show');
    setTimeout(() => {
        gestureFeedback.classList.remove('show');
    }, 800);
}

// Navigate to next card
function nextCard() {
    if (cards.length === 0) return;
    currentCardIndex = (currentCardIndex + 1) % cards.length;
    updateCarousel(currentCardIndex);
    showFeedback('Next →');
}

// Navigate to previous card
function previousCard() {
    if (cards.length === 0) return;
    currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
    updateCarousel(currentCardIndex);
    showFeedback('← Previous');
}

// Dismiss (remove) a card
function dismissCard(index, direction) {
    if (cards.length <= 1) return;

    const track = document.getElementById('carouselTrack');
    const cardElements = track.querySelectorAll('.card');
    const cardEl = cardElements[index];

    if (cardEl) {
        // Save to undo stack
        removedCards.push({
            card: cards[index],
            index: index
        });

        // Animate card out
        const translateY = direction === 'up' ? '-150%' : '150%';
        cardEl.style.transition = 'all 0.6s cubic-bezier(0.6, 0, 0.4, 1)';
        cardEl.style.transform = `translateY(${translateY}) scale(0.5) rotate(${direction === 'up' ? -15 : 15}deg)`;
        cardEl.style.opacity = '0';

        showFeedback(direction === 'up' ? 'Removed ↑' : 'Removed ↓');

        setTimeout(() => {
            cards.splice(index, 1);
            renderCards();
            const newIndex = Math.min(index, cards.length - 1);
            updateCarousel(newIndex);
        }, 600);
    }
}

// Undo last removal
function undoRemoval() {
    if (removedCards.length === 0) {
        showFeedback('Nothing to undo');
        return;
    }

    const lastRemoved = removedCards.pop();
    cards.splice(lastRemoved.index, 0, lastRemoved.card);
    renderCards();
    updateCarousel(lastRemoved.index);
    showFeedback('✓ Restored');
}

// Update carousel position and active card
function updateCarousel(index) {
    if (cards.length === 0) return;

    // Wrap index
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;

    currentCardIndex = index;

    // Update card positions and active state
    const track = document.getElementById('carouselTrack');
    const cardElements = track.querySelectorAll('.card');

    cardElements.forEach((cardEl, i) => {
        if (i === index) {
            cardEl.classList.add('active');
        } else {
            cardEl.classList.remove('active');
        }
    });

    // Center the active card
    const cardWidth = 220 + 20;
    const containerWidth = track.parentElement.offsetWidth;
    const offset = (containerWidth / 2) - (index * cardWidth) - (cardWidth / 2);
    track.style.transform = `translateX(${offset}px)`;
}

// Initialize
renderCards();
updateCarousel(0);

// MediaPipe Hands Setup
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF88', lineWidth: 2 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

        // Gesture Detection
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];

        if (wrist && indexMCP && indexTip && middleTip) {
            // Calculate palm size
            const palmSize = Math.sqrt(
                Math.pow(indexMCP.x - wrist.x, 2) +
                Math.pow(indexMCP.y - wrist.y, 2)
            );

            // Check if fingers are extended
            const indexDist = Math.sqrt(
                Math.pow(indexTip.x - wrist.x, 2) +
                Math.pow(indexTip.y - wrist.y, 2)
            );

            const middleDist = Math.sqrt(
                Math.pow(middleTip.x - wrist.x, 2) +
                Math.pow(middleTip.y - wrist.y, 2)
            );

            // Open hand detection
            const OPEN_HAND_THRESHOLD = 1.5;
            const isOpenHand = indexDist > palmSize * OPEN_HAND_THRESHOLD && middleDist > palmSize * OPEN_HAND_THRESHOLD;

            const currentTime = Date.now();
            const handX = wrist.x;

            if (isOpenHand) {
                // Start tracking when hand is first detected
                if (handStartX === null) {
                    handStartX = handX;
                    handStartTime = currentTime;
                    console.log('Started tracking flick at X:', handX.toFixed(3));
                } else {
                    // Calculate movement
                    const deltaX = handX - handStartX;
                    const deltaTime = currentTime - handStartTime;

                    console.log('DeltaX:', deltaX.toFixed(3), 'Time:', deltaTime, 'ms');

                    // Flick thresholds
                    const FLICK_DISTANCE = 0.08; // 8% of screen width (lowered for easier detection)
                    const MIN_TIME = 80; // At least 80ms
                    const MAX_TIME = 600; // At most 600ms for a flick

                    // Detect flick (no cooldown needed since we reset tracking)
                    if (Math.abs(deltaX) > FLICK_DISTANCE &&
                        deltaTime > MIN_TIME &&
                        deltaTime < MAX_TIME) {

                        console.log('FLICK DETECTED! Distance:', deltaX.toFixed(3));

                        if (deltaX > 0) {
                            console.log('Flick RIGHT → Next Card');
                            nextCard();
                        } else {
                            console.log('Flick LEFT → Previous Card');
                            previousCard();
                        }

                        // Reset tracking for next flick
                        handStartX = null;
                        handStartTime = null;
                        lastGestureTime = currentTime;
                    }
                    // Reset if hand held too long (not a flick)
                    else if (deltaTime > MAX_TIME) {
                        console.log('Held too long - resetting');
                        handStartX = handX;
                        handStartTime = currentTime;
                    }
                }
            } else {
                // Hand closed - reset tracking
                if (handStartX !== null) {
                    console.log('Hand closed - reset tracking');
                    handStartX = null;
                    handStartTime = null;
                }
            }
        }
    } else {
        // No hand detected - reset
        if (handStartX !== null) {
            console.log('No hand - reset tracking');
            handStartX = null;
            handStartTime = null;
        }
    }

    canvasCtx.restore();
}

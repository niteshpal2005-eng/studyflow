// StudyFlow Flashcards Module
import storage from './storage.js';

let activeDeckId = null;
let currentCardIndex = 0;
let isFlipped = false;
let studySessionStats = { correct: 0, total: 0 };

export const FlashcardsModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadDecks();
  },

  cacheDOM() {
    this.deckListEl = document.getElementById('deck-list');
    this.studyAreaEl = document.getElementById('study-area');
    
    // Decks Modals and Forms
    this.createDeckBtn = document.getElementById('create-deck-btn');
    this.deckModal = document.getElementById('deck-modal');
    this.deckForm = document.getElementById('deck-form');
    this.deckNameInput = document.getElementById('deck-name-input');
    this.deckDescInput = document.getElementById('deck-desc-input');
    this.closeDeckModal = document.getElementById('close-deck-modal');

    // Cards Modals and Forms
    this.addCardBtn = document.getElementById('add-card-btn');
    this.cardModal = document.getElementById('card-modal');
    this.cardForm = document.getElementById('card-form');
    this.cardFrontInput = document.getElementById('card-front-input');
    this.cardBackInput = document.getElementById('card-back-input');
    this.closeCardModal = document.getElementById('close-card-modal');
  },

  bindEvents() {
    // Deck creation modal events
    if (this.createDeckBtn) {
      this.createDeckBtn.addEventListener('click', () => {
        this.deckModal.classList.add('active');
      });
    }
    if (this.closeDeckModal) {
      this.closeDeckModal.addEventListener('click', () => {
        this.deckModal.classList.remove('active');
      });
    }
    if (this.deckForm) {
      this.deckForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createDeck();
      });
    }

    // Card creation modal events
    if (this.addCardBtn) {
      this.addCardBtn.addEventListener('click', () => {
        if (!activeDeckId) {
          alert('Please select or create a deck first!');
          return;
        }
        this.cardModal.classList.add('active');
      });
    }
    if (this.closeCardModal) {
      this.closeCardModal.addEventListener('click', () => {
        this.cardModal.classList.remove('active');
      });
    }
    if (this.cardForm) {
      this.cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addCardToActiveDeck();
      });
    }
  },

  loadDecks() {
    const decks = storage.getDecks();
    if (decks.length > 0 && !activeDeckId) {
      activeDeckId = decks[0].id;
    }
    this.renderDecksList();
    this.renderStudyArea();
  },

  createDeck() {
    const name = this.deckNameInput.value.trim();
    const description = this.deckDescInput.value.trim();
    if (!name) return;

    const newDeck = {
      id: 'deck_' + Date.now(),
      name,
      description,
      cards: []
    };

    const decks = storage.getDecks();
    decks.push(newDeck);
    storage.saveDecks(decks);

    activeDeckId = newDeck.id;
    this.deckNameInput.value = '';
    this.deckDescInput.value = '';
    this.deckModal.classList.remove('active');

    this.loadDecks();
  },

  addCardToActiveDeck() {
    const front = this.cardFrontInput.value.trim();
    const back = this.cardBackInput.value.trim();
    if (!front || !back) return;

    const decks = storage.getDecks();
    const updated = decks.map(deck => {
      if (deck.id === activeDeckId) {
        deck.cards.push({
          id: 'card_' + Date.now(),
          front,
          back
        });
      }
      return deck;
    });

    storage.saveDecks(updated);
    this.cardFrontInput.value = '';
    this.cardBackInput.value = '';
    this.cardModal.classList.remove('active');

    currentCardIndex = 0;
    this.loadDecks();
  },

  deleteActiveDeck() {
    if (!activeDeckId) return;
    if (!confirm('Are you sure you want to delete this deck? All cards inside it will be lost.')) return;

    const decks = storage.getDecks();
    const filtered = decks.filter(d => d.id !== activeDeckId);
    storage.saveDecks(filtered);

    activeDeckId = filtered.length > 0 ? filtered[0].id : null;
    currentCardIndex = 0;
    this.loadDecks();
  },

  renderDecksList() {
    if (!this.deckListEl) return;
    const decks = storage.getDecks();

    this.deckListEl.innerHTML = '';
    
    if (decks.length === 0) {
      this.deckListEl.innerHTML = `<p style="padding: 1rem; text-align: center; color: var(--text-muted);">No decks created yet.</p>`;
      return;
    }

    decks.forEach(deck => {
      const cardEl = document.createElement('div');
      cardEl.className = `deck-card ${deck.id === activeDeckId ? 'active' : ''}`;
      cardEl.innerHTML = `
        <div>
          <div class="deck-title">${this.escapeHTML(deck.name)}</div>
          <div class="deck-count">${deck.cards.length} cards</div>
        </div>
        <svg style="width:16px; height:16px; opacity:0.6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      `;

      cardEl.addEventListener('click', () => {
        activeDeckId = deck.id;
        currentCardIndex = 0;
        isFlipped = false;
        studySessionStats = { correct: 0, total: 0 };
        this.renderDecksList();
        this.renderStudyArea();
      });

      this.deckListEl.appendChild(cardEl);
    });
  },

  renderStudyArea() {
    if (!this.studyAreaEl) return;
    
    if (!activeDeckId) {
      this.studyAreaEl.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
          <svg style="width:64px; height:64px; margin-bottom:1rem; opacity:0.4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3>No Active Decks</h3>
          <p style="margin-top:0.5rem;">Create a deck on the left panel to begin reviewing.</p>
        </div>
      `;
      if (this.addCardBtn) this.addCardBtn.style.display = 'none';
      return;
    }

    if (this.addCardBtn) this.addCardBtn.style.display = 'inline-flex';

    const decks = storage.getDecks();
    const deck = decks.find(d => d.id === activeDeckId);

    if (!deck) return;

    if (deck.cards.length === 0) {
      this.studyAreaEl.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem; width: 100%;">
          <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">${this.escapeHTML(deck.name)}</div>
          <p style="margin-bottom: 1.5rem; font-size: 0.9rem;">${this.escapeHTML(deck.description || 'No description provided')}</p>
          <svg style="width:48px; height:48px; margin-bottom:1rem; opacity:0.4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <p>This deck is currently empty.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('card-modal').classList.add('active')">Add First Flashcard</button>
          <button class="btn btn-secondary" style="margin-top: 1rem; margin-left: 0.5rem;" id="delete-deck-btn">Delete Deck</button>
        </div>
      `;
      
      const delBtn = document.getElementById('delete-deck-btn');
      if (delBtn) delBtn.addEventListener('click', () => this.deleteActiveDeck());
      return;
    }

    // Study Carousel Mode
    if (currentCardIndex >= deck.cards.length) {
      // Completed Study Session
      const scorePercent = Math.round((studySessionStats.correct / deck.cards.length) * 100);
      this.studyAreaEl.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 3rem; width: 100%; max-width: 480px; animation: fadeIn 0.4s ease;">
          <h2 style="font-family: var(--font-heading); margin-bottom: 1rem;">Deck Completed!</h2>
          <div style="font-size: 4rem; font-weight: 800; color: var(--accent-indigo); margin-bottom: 0.5rem;">${scorePercent}%</div>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">You remembered ${studySessionStats.correct} out of ${deck.cards.length} cards.</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button class="btn btn-primary" id="restart-study-btn">Study Again</button>
            <button class="btn btn-secondary" id="delete-deck-btn">Delete Deck</button>
          </div>
        </div>
      `;
      
      document.getElementById('restart-study-btn').addEventListener('click', () => {
        currentCardIndex = 0;
        studySessionStats = { correct: 0, total: 0 };
        isFlipped = false;
        this.renderStudyArea();
      });

      document.getElementById('delete-deck-btn').addEventListener('click', () => this.deleteActiveDeck());
      return;
    }

    const card = deck.cards[currentCardIndex];
    const progressPercent = ((currentCardIndex) / deck.cards.length) * 100;

    this.studyAreaEl.innerHTML = `
      <div style="width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
          <span>Deck: <strong>${this.escapeHTML(deck.name)}</strong></span>
          <span>Card ${currentCardIndex + 1} of ${deck.cards.length}</span>
        </div>

        <div class="flashcard-3d-wrapper ${isFlipped ? 'flipped' : ''}" id="flashcard-card-item">
          <div class="flashcard-inner">
            <div class="flashcard-face front">
              <div class="flashcard-content">${this.escapeHTML(card.front)}</div>
              <div class="flashcard-tip">Click card to reveal answer</div>
            </div>
            <div class="flashcard-face back">
              <div class="flashcard-content" style="font-size: 1.15rem; font-weight: 400; text-align: left; overflow-y: auto; max-height: 180px;">
                ${this.escapeHTML(card.back)}
              </div>
              <div class="flashcard-tip">Did you get it right?</div>
            </div>
          </div>
        </div>

        <div class="study-controls">
          <div class="study-progress">
            <div class="study-progress-bar" style="width: ${progressPercent}%"></div>
          </div>

          <div style="display: ${isFlipped ? 'none' : 'block'}; text-align: center;">
            <button class="btn btn-secondary" id="flip-card-btn">Reveal Answer</button>
          </div>

          <div class="rating-buttons" style="display: ${isFlipped ? 'flex' : 'none'};">
            <button class="btn btn-danger" id="rate-again-btn">
              <svg style="width:16px; height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>Review Again
            </button>
            <button class="btn-primary btn" style="background: var(--gradient-success); box-shadow: 0 0 15px rgba(16,185,129,0.15);" id="rate-gotit-btn">
              <svg style="width:16px; height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>I Got It!
            </button>
          </div>
        </div>
      </div>
    `;

    // Event Bindings for inside the cards
    const cardItem = document.getElementById('flashcard-card-item');
    const flipBtn = document.getElementById('flip-card-btn');
    const rateAgainBtn = document.getElementById('rate-again-btn');
    const rateGotitBtn = document.getElementById('rate-gotit-btn');

    const handleFlip = () => {
      isFlipped = !isFlipped;
      cardItem.classList.toggle('flipped', isFlipped);
      
      const flipBtnEl = document.getElementById('flip-card-btn');
      const ratingsEl = document.querySelector('.rating-buttons');
      if (isFlipped) {
        if (flipBtnEl) flipBtnEl.parentElement.style.display = 'none';
        if (ratingsEl) ratingsEl.style.display = 'flex';
      } else {
        if (flipBtnEl) flipBtnEl.parentElement.style.display = 'block';
        if (ratingsEl) ratingsEl.style.display = 'none';
      }
    };

    cardItem.addEventListener('click', handleFlip);
    if (flipBtn) flipBtn.addEventListener('click', handleFlip);

    if (rateAgainBtn) {
      rateAgainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        studySessionStats.total++;
        storage.incrementStat('cardsReviewed');
        this.nextCard();
      });
    }

    if (rateGotitBtn) {
      rateGotitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        studySessionStats.correct++;
        studySessionStats.total++;
        storage.incrementStat('cardsReviewed');
        this.nextCard();
      });
    }
  },

  nextCard() {
    currentCardIndex++;
    isFlipped = false;
    this.renderStudyArea();
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
export default FlashcardsModule;

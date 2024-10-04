import "./dark_mode.js";
import { levenshtein } from "./levenshtein.js";

const searchInput = document.querySelector("#search-input");
const cardsSection = document.querySelector("#cards");
const filterSelect = document.querySelector("#tags-filter");
let listOfCardsFiltered = [];
let favoriteCards = [];
// SVG icons from https://heroicons.com/
const starIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>');
const starIconFilled = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg>');

function insertTagsIntoSelect(tags) {
    tags.sort();
    for (const tag of tags) {
        const newOption = document.createElement("option");
        newOption.value = tag;
        newOption.text = tag;
        filterSelect.appendChild(newOption);
    }
}

function getTagsFromCards(data) {
    const tags = ["Favoritos"];
    data.map((objeto) => {
        if (objeto.tags) {
            objeto.tags.map((tag) => {
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            });
        } else {
            objeto.tags = [];
        }
    });
    insertTagsIntoSelect(tags);
}

function filterCards() {
    listOfCardsFiltered = [];
    const listOfCards = document.querySelectorAll(".card");
    listOfCards.forEach((element) => {
        if (
            element.getAttribute("tags").includes(filterSelect.value) ||
            filterSelect.value == "Todos"
        ) {
            element.style.display = "";
            listOfCardsFiltered.push(element);
        } else {
            element.style.display = "none";
        }
    });
    searchCards();
}

function sortCards(sortingArray) {
    if (listOfCardsFiltered.length > 0) {
        if (!Array.isArray(sortingArray) || !sortingArray.length) {
            const cards = document.querySelector("#cards");
            // selects all cards that are not hidden and sorts them by title
            // every child is re-appended to cards in the order of the now sorted array. When an element is re-appended it is actually moved from its previous location
            [...cards.querySelectorAll(".card:not([style*='display: none;'])")]
            .sort((a, b) => a.querySelector(".card__title").textContent.toLowerCase().localeCompare(b.querySelector(".card__title").textContent.toLowerCase()))
            .forEach(node => cards.appendChild(node));
        } else {
            const cards = document.querySelector("#cards");
            // selects all cards that are not hidden and sorts them by the order of the sortingArray
            // every child is re-appended to cards in the order of the now sorted array. When an element is re-appended it is actually moved from its previous location
            [...cards.querySelectorAll(".card:not([style*='display: none;'])")]
            .sort((a, b) => sortingArray.indexOf(a) - sortingArray.indexOf(b))
            .forEach(node => cards.appendChild(node));
        }
    }
}

function searchCards() {
    const inputValue = searchInput.value.toLowerCase().trim();
    let cardsScores = [];

    if (inputValue.length > 0) {
        for (const card of listOfCardsFiltered) {
            let cardScore = 0;

            // search for words inside the title that either contain the input value or have a levenshtein distance lower or equal to 2
            const cardTitle = card.querySelector(".card__title").textContent.toLowerCase();
            let titleWords = cardTitle.split(/(\s+)/);
            let titleScore = 0;

            titleWords.forEach((word) => {
                const levenshteinDistance = levenshtein(word, inputValue);
                if (word.includes(inputValue)) {
                    titleScore = 10;
                } else if ((inputValue.length > 3) && (levenshteinDistance <= 3)) {
                    if (10 - levenshteinDistance > titleScore) {
                        // only the word with the lowest levenshtein distance will be considered
                        titleScore = 10 - levenshteinDistance;
                    }
                }
            });

            // give extra points for words in title
            cardScore += titleScore * 10;

            // search for words inside the description that either contain the input value or have a levenshtein distance lower or equal to 2
            const cardDescription = card.querySelector(".card__description").textContent.toLowerCase();
            let descriptionWords = cardDescription.split(/(\s+)/);
            let descriptionScore = 0;

            descriptionWords.forEach((word) => {
                const levenshteinDistance = levenshtein(word, inputValue);
                if (word.includes(inputValue)) {
                    descriptionScore = 10;
                } else if ((inputValue.length > 3) && (levenshteinDistance <= 3)) {
                    if (10 - levenshteinDistance > descriptionScore) {
                        // only the word with the lowest levenshtein distance will be considered
                        descriptionScore = 10 - levenshteinDistance;
                    }
                }
            });

            cardScore += descriptionScore;

            if (cardScore > 0) {
                card.style.display = "";
                cardsScores.push([card, cardScore]);
            } else {
                card.style.display = "none";
            }
        }

        const msgNotFound = document.querySelector("div.msg");

        if (cardsScores.length > 0) {
            msgNotFound.style.display = "none";
            // sort the array of cards by score
            cardsScores.sort((a, b) => b[1] - a[1]);
            // remove the scores from the array
            cardsScores = cardsScores.map((card) => card[0]);
            sortCards(cardsScores);
        } else {
            msgNotFound.style.display = "";
        }

    } else {
        // display all cards if search input is empty
        for (const card of listOfCardsFiltered) {
            card.style.display = "";
            cardsScores.push(card);
        }

        const msgNotFound = document.querySelector("div.msg");
        msgNotFound.style.display = "none";
        sortCards();
    }
}

function insertCardsIntoHtml(data) {
    let cards = `<div class="msg">
                    <div class=collumn-1>
                        <img src="assets/img/no-results-found.png" alt="Mulher olhando para site sem dados" />
                        <a href="https://storyset.com/data">Data illustrations by Storyset</a>
                    </div>
                    <div class=collumn-2>
                        <p> O termo pesquisado não foi encontrado! Verifique se foi digitado corretamente.</p>
                        <p>Caso esteja correto, por favor crie uma issue no <a href="https://github.com/levxyca/diciotech/issues">repositório</a> para que esse termo possa ser adicionado ao Diciotech.</p>
                        <p>Agradecemos sua colaboração! 😄</p>
                    </div>
                </div>`
    data.forEach((card) => {
        const cardId = generateCardId(card.id, card.title, card.description)
        cards += `
        <section class="card" tags="${
            card.tags ? card.tags : "Todos"
        }" id="${cardId}">
            <div class="card__header">
                <h3 class="card__title">${card.title}</h3>
                <img
                    alt="star"
                    unique-title="${cardId}"
                    id="fav_${cardId}"
                    src=${card.tags.includes("Favoritos") ? starIconFilled : starIcon}
                    class="fav__button"
                />
            </div>
            <p class="card__description">${card.description}</p>
        `;
        if (card.content && card.content.code) {
            cards += `
            <div class="card__content">
                <code class="card__code">${card.content.code}</code>
            </div>
            `;
        }
        cards += "</section>";
    });
    cardsSection.innerHTML = cards;

    const favButtons = document.querySelectorAll(".fav__button");
    favButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setCardAsFavorite(button.getAttribute("unique-title"));
        });
    });

    filterCards();
}

function addFavoriteTagToCard(cardId) {
    const card = document.getElementById(cardId);
    const tags = card.getAttribute("tags").split(",");

    if (tags.includes("Favoritos")) {
        tags.splice(tags.indexOf("Favoritos"), 1);
    } else {
        tags.push("Favoritos");
    }

    card.setAttribute("tags", tags);
}

function setCardAsFavorite(cardId) {
    const favIcon = document.querySelector(`#fav_${cardId}`);

    if (favoriteCards.includes(cardId)) {
        favIcon.src = starIcon;
        favoriteCards.splice(favoriteCards.indexOf(cardId), 1);
    } else {
        favIcon.src = starIconFilled;
        favoriteCards.push(cardId);
    }

    addFavoriteTagToCard(cardId);

    localStorage.setItem("favoriteCards", favoriteCards);
}

async function loadFavoriteCardsId() {
    const cardsId = localStorage.getItem("favoriteCards");
    if (cardsId) {
        favoriteCards = cardsId.split(",");
    }
}

async function addFavoriteTag(cards) {
    cards.map((card) => {
        const cardId = generateCardId(card.id, card.title, card.description)
        if (favoriteCards.includes(cardId)) {
            if (!card.tags) {
                card.tags = [];
            }
            card.tags.push("Favoritos");
        }
    });
    return cards;
}

async function sortCardsByTitle(data) {
    return data.cards.sort((a, b) => a.title.localeCompare(b.title));
}

async function getCardsFromJson() {
    try {
        const res = await fetch("./assets/data/cards_pt-br.json");
        const data = await res.json();
        const sortedCards = await sortCardsByTitle(data);
        await loadFavoriteCardsId();
        await addFavoriteTag(sortedCards);
        getTagsFromCards(sortedCards);
        insertCardsIntoHtml(sortedCards);
    } catch (error) {
        console.error("An error occurred while fetching card data.", error);
    }
}

searchInput.addEventListener("input", searchCards);
filterSelect.addEventListener("change", filterCards);
getCardsFromJson();

/**
 * Generates a card ID using a default UUID or a hash of the card description.
 *
 * @param {string} defaultCardId - A default UUID generated by the CLI.
 * @param {string} title - The title of the card.
 * @param {string} description - The description of the card.
 * @returns {string} - A generated ID
 */
function generateCardId(defaultCardId, title, description) {
    if (defaultCardId) return defaultCardId;
    return generateContentId(title, description);
}

/**
 * Calculates a simple hash of the given content.
 *
 * @param {string} content - The content to be hashed.
 * @param {string} title - An additional title to be added to the content.
 * @param {number} hash - The initial hash value.
 * @returns {string} The hashed representation of the content.
 */
function generateContentId(title = '', description = '', hash = 5381) {
    const data = (title + description).slice(0, 32).split(' ').join('')

    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) + hash) + data.charCodeAt(i);
    }

    const hashString = Math.abs(hash).toString(36); // Convert to base-36 string
    return hashString;
}

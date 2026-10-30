# Yu-Gi-Oh! Combo Search

A full-stack card search and combo simulator for exploring legal Yu-Gi-Oh! card interactions. Search the card database, inspect card details, follow suggested combo branches, pay material costs, and track cards as they move between simulated zones.

> This is an unofficial fan project. Yu-Gi-Oh! is a trademark of its respective owners. Card data and images are provided by the [YGOPRODeck API](https://ygoprodeck.com/api-guide/).

## Live App

Access the deployed project at [**yugioh-combo.vercel.app**](https://yugioh-combo.vercel.app/).

> **Cold-start notice:** If the backend has been inactive, the first request may take longer while the service starts. Refresh or retry the search after it becomes available.

You can also view the repository's latest development history on the [GitHub Activity page](https://github.com/AimeLih/Yugioh-Combo/activity).

## Features

- Search cards by partial name with a live, 10-result autocomplete menu
- Select an autocomplete option or search result to perform an exact-name lookup
- Filter cards by type, race, attribute, and archetype
- Find archetypes through a live, 10-result autocomplete menu
- Browse compact search summaries with lazily loaded card-art thumbnails
- View card text, stats, type, archetype, artwork, and once-per-turn information
- Add selected search results to the Hand without resetting the current board
- Explore ranked combo starters, extenders, and enders
- See why a route is available, when it can be used, its destination, and its cost
- Manually move monsters, Spells, Traps, and Pendulum cards between supported zones
- Simulate the Hand, five Main Monster Zones, Extra Monster Zone, Spell & Trap Zones, Pendulum Zones, Graveyard, banished cards, and face-up Extra Deck
- Activate non-summon effects manually while prompting for on-summon effects immediately
- Treat applicable monsters as Continuous Spells or Traps while they occupy the back row
- Search for Synchro, Xyz, and Link Monsters and summon them only when legal materials are present
- Pendulum Summon multiple eligible monsters from the Hand and face-up Extra Deck using the current scale range and available legal zones
- Select legal Fusion Materials and other effect costs from searchable suggestions
- Preserve the board while inspecting more cards, or reset it intentionally with **Clear Zones**
- Advance turns and phases to unlock delayed effects
- Step backward through a combo while restoring the previous game state
- Enforce a conservative subset of Official Rulebook Version 10

## Tech Stack

- **Frontend:** React 19, Vite 8
- **Backend:** Java 17, Spring Boot 4, Spring Data JPA
- **Database:** Neon PostgreSQL 18 with Flyway migrations
- **Card data:** YGOPRODeck API
- **Testing:** JUnit 5, Mockito

## Project Structure

```text
.
├── frontend/                  # React/Vite client
├── src/main/java/             # Spring Boot API and combo engine
├── src/main/resources/        # Application configuration
├── src/test/                  # Backend tests
├── .env.example               # Local environment template
└── Dockerfile                 # Production backend image
```

## Getting Started

### Prerequisites

- Java 17
- Node.js and npm
- PostgreSQL

### 1. Configure the database

Create a PostgreSQL database, then copy the example environment file:

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the connection values in `.env`:

```dotenv
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/yugioh
SPRING_DATASOURCE_USERNAME=your_database_user
SPRING_DATASOURCE_PASSWORD=your_database_password
SPRING_CACHE_TYPE=simple
IMPORT_TOKEN=choose_a_private_local_token
```

Flyway applies the database schema automatically at backend startup. The current
schema version is V5. Cards use numeric foreign keys for types, races, attributes,
and archetypes, while ordered link markers live in a child table.

### Database structure

```text
cards
├── type_id      → card_types.id
├── race_id      → card_races.id
├── attribute_id → card_attributes.id
├── archetype_id → archetypes.id
└── id           → card_link_markers.card_id
```

The application tables currently have 15 B-tree indexes:

- Primary and unique indexes for card IDs and names
- Primary and unique indexes for each reference table's ID and name
- Card relationship indexes on `type_id`, `race_id`, `attribute_id`, and `archetype_id`
- A composite link-marker index on `(card_id, marker_order)`

Flyway owns another two B-tree indexes for migration bookkeeping. Four GIN
trigram indexes support case-insensitive substring searches on card names, card
descriptions, type names, and archetype names.

### Search loading strategy

Search and filter requests return lightweight summaries containing only the card
ID, name, type, and image URL. The frontend lazily loads thumbnail images and
does not fetch descriptions, stats, reference relationships, or link markers for
every result. Selecting a card performs an exact-name lookup and loads its full
details through the `Card.details` entity graph.

### 2. Start the backend

macOS/Linux:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The API starts at `http://localhost:8080`.

### 3. Import card data

With the backend running against an empty database, import the current card catalog:

```bash
curl -X POST -H "X-Import-Token: choose_a_private_local_token" http://localhost:8080/yugioh/admin/import
```

The header value must match `IMPORT_TOKEN`. The import can take a moment because it fetches and stores card details and images from YGOPRODeck.

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend uses `http://localhost:8080` by default. To point it at another backend, create `frontend/.env.local`:

```dotenv
VITE_API_URL=https://your-api.example.com
```

## Using the App

1. Start typing a card name and choose one of the 10 live suggestions, or press **Search** for a larger result list.
2. Open **Filter** to narrow results by type, race, attribute, or archetype. Archetypes are selected through their own live autocomplete field.
3. Select a result to load its complete details. Existing zones are preserved.
4. Use the card's zone actions to Summon it, Set it, or place a Pendulum Monster in a Pendulum Zone.
5. On-summon effects prompt immediately. Activate other effects manually from the card's current zone.
6. Choose an available starter, extender, follow-up, or ender and pay any requested material costs.
7. Use **Synchro / Xyz / Link** to search for a legal Extra Deck summon, or **Pendulum Summon** after establishing two scales.
8. Advance the phase for timing-locked effects, use **Back** to revisit a route, or use **Clear Zones** to start with an empty board.

The combo engine presents routes it can derive from card text and the modeled game state. Extra Deck material validation covers common Synchro, Xyz, and Link requirements; complex card-specific rulings may still require manual judgment.

## API

All endpoints use the `/yugioh` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/admin/import` | Import cards not already in the database |
| `GET` | `/card?name=...` | Load one complete card by exact name |
| `GET` | `/card/substring?name=...&limit=...` | Return lightweight partial-name search summaries |
| `GET` | `/card/substring?name=...&typeId=...&raceId=...&attributeId=...&archetypeId=...` | Search with optional numeric filters |
| `GET` | `/card/filters` | List available types, races, and attributes |
| `GET` | `/card/archetypes?query=...&limit=10` | Return live archetype suggestions |
| `GET` | `/card/combos?name=...&zone=...` | Find supported combo routes |
| `GET` | `/card/fusion-materials?source=...&target=...` | Plan legal Fusion Materials |
| `GET` | `/card/cost-materials?source=...&target=...` | Plan legal effect costs |

Example:

```bash
curl "http://localhost:8080/yugioh/card/combos?name=Branded%20Fusion"
```

The frontend requests 10 results for autocomplete, 50 for ordinary name
searches, and up to 5,000 lightweight summaries when filters are active. The
backend enforces a maximum of 5,000 search summaries and 10 archetype
suggestions per request.

## Tests and Builds

Run the backend tests:

```bash
./mvnw test
```

On Windows, use `.\mvnw.cmd test`.

Check and build the frontend:

```bash
cd frontend
npm run lint
npm run build
npm test
```

Build the backend container:

```bash
docker build -t yugioh-combo-search .
```

## Current Scope

The simulator validates general rulebook behavior and parsed card text; it is not a tournament judge. Individual rulings, errata, Forbidden/Limited lists, and tournament policy are outside the current scope.

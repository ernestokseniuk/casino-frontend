# API Update - Nowe Funkcjonalności

## Data aktualizacji: 2 grudnia 2025

Ten dokument opisuje nowe funkcjonalności dodane do backendu gry ruletki.

---

## Spis treści
1. [Anulowanie zakładu](#1-anulowanie-zakładu)
2. [Chat w czasie rzeczywistym](#2-chat-w-czasie-rzeczywistym)
3. [Powiadomienia o wynikach zakładów](#3-powiadomienia-o-wynikach-zakładów)

---

## 1. Anulowanie zakładu

### DELETE `/api/game/bet/{betId}`

Pozwala na anulowanie zakładu **tylko podczas fazy BETTING_OPEN** dla aktualnej gry.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Path parameters:**
| Parametr | Typ | Opis |
|----------|-----|------|
| `betId` | Long | ID zakładu do anulowania |

**Response (200 OK):**
```json
{
  "id": 15,
  "gameId": 42,
  "betType": "COLOR",
  "betValue": "RED",
  "amount": 10.00,
  "potentialPayout": 20.00,
  "multiplier": 2,
  "settled": false,
  "winAmount": null,
  "createdAt": "2025-12-02T14:35:00"
}
```

**Błędy:**
| Kod | Komunikat | Opis |
|-----|-----------|------|
| `400 Bad Request` | "Bet not found" | Zakład o podanym ID nie istnieje |
| `400 Bad Request` | "Bet does not belong to user" | Zakład należy do innego użytkownika |
| `400 Bad Request` | "Can only cancel bets for the current game" | Próba anulowania zakładu z poprzedniej gry |
| `400 Bad Request` | "Betting phase is closed - cannot cancel bet" | Faza obstawiania już się zakończyła |
| `400 Bad Request` | "Bet is already settled - cannot cancel" | Zakład już został rozliczony |

**Uwagi:**
- Po anulowaniu kwota zakładu jest automatycznie zwracana na konto użytkownika
- Transakcja zwrotu ma typ `REFUND`
- Anulowanie możliwe TYLKO podczas statusu gry `BETTING_OPEN`

### Przykład integracji (JavaScript):
```javascript
async function cancelBet(token, betId) {
  const res = await fetch(`${API_BASE}/api/game/bet/${betId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message);
  }
  
  return res.json();
}
```

---

## 2. Chat w czasie rzeczywistym

Nowy system czatu pozwala użytkownikom komunikować się w czasie rzeczywistym.

### POST `/api/chat/send`

Wysyła wiadomość na czat.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Hej wszystkim! Ktoś obstawia czerwone?"
}
```

**Walidacja:**
- `message`: wymagane, niepuste, maksymalnie 500 znaków

**Response (200 OK):**
```json
{
  "id": 123,
  "username": "player123",
  "message": "Hej wszystkim! Ktoś obstawia czerwone?",
  "createdAt": "2025-12-02T14:35:00"
}
```

---

### GET `/api/chat/history`

Pobiera historię ostatnich wiadomości czatu.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query parameters:**
| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `limit` | int | 50 | Liczba wiadomości do pobrania (max 100) |

**Request:**
```
GET /api/chat/history?limit=30
```

**Response (200 OK):**
```json
[
  {
    "id": 120,
    "username": "player1",
    "message": "Witam!",
    "createdAt": "2025-12-02T14:30:00"
  },
  {
    "id": 121,
    "username": "player2",
    "message": "Cześć!",
    "createdAt": "2025-12-02T14:31:00"
  },
  {
    "id": 122,
    "username": "player1",
    "message": "Co obstawiacie?",
    "createdAt": "2025-12-02T14:32:00"
  }
]
```

**Uwaga:** Wiadomości są posortowane od najstarszych do najnowszych.

---

### WebSocket - Subskrypcja czatu

**Topic:** `/topic/chat`

Każda nowa wiadomość wysłana przez dowolnego użytkownika jest automatycznie broadcastowana do wszystkich podłączonych klientów.

**Message format:**
```json
{
  "id": 123,
  "username": "player123",
  "message": "Hej wszystkim!",
  "createdAt": "2025-12-02T14:35:00"
}
```

### Przykład integracji WebSocket (JavaScript):
```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const socket = new SockJS('http://localhost:8080/ws/game');
const stompClient = Stomp.over(socket);

stompClient.connect({}, (frame) => {
  // Subskrypcja czatu
  stompClient.subscribe('/topic/chat', (message) => {
    const chatMessage = JSON.parse(message.body);
    console.log(`${chatMessage.username}: ${chatMessage.message}`);
    
    // Dodaj wiadomość do UI
    addMessageToChat(chatMessage);
  });
  
  // Subskrypcja stanu gry (istniejąca)
  stompClient.subscribe('/topic/game', (message) => {
    const gameState = JSON.parse(message.body);
    updateGameUI(gameState);
  });
});

// Funkcja wysyłania wiadomości przez REST API
async function sendChatMessage(token, message) {
  const res = await fetch('http://localhost:8080/api/chat/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  return res.json();
}
```

### Bezpieczeństwo czatu
- Wiadomości są sanityzowane (usuwa znaczniki HTML)
- Maksymalna długość: 500 znaków
- Wymagana autentykacja do wysyłania wiadomości
- Odczyt historii również wymaga autentykacji

---

## 3. Powiadomienia o wynikach zakładów

Po zakończeniu każdej gry i rozliczeniu zakładów, każdy użytkownik który miał postawione zakłady otrzymuje **osobiste powiadomienie** z wynikami.

### WebSocket - Subskrypcja wyników zakładów

**Queue:** `/user/queue/bet-results`

To jest **prywatna kolejka** - każdy użytkownik otrzymuje tylko swoje wyniki.

**Message format:**
```json
{
  "gameId": 42,
  "winningNumber": 17,
  "winningColor": "BLACK",
  "bets": [
    {
      "betId": 15,
      "betType": "COLOR",
      "betValue": "RED",
      "amount": 10.00,
      "won": false,
      "winAmount": 0.00
    },
    {
      "betId": 16,
      "betType": "STRAIGHT",
      "betValue": "17",
      "amount": 5.00,
      "won": true,
      "winAmount": 180.00
    }
  ],
  "totalWon": 180.00,
  "newBalance": 270.00
}
```

**Pola:**
| Pole | Typ | Opis |
|------|-----|------|
| `gameId` | Long | ID zakończonej gry |
| `winningNumber` | Integer | Wylosowany numer (0-36) |
| `winningColor` | String | Kolor wygranego numeru (RED/BLACK/GREEN) |
| `bets` | Array | Lista zakładów użytkownika z wynikami |
| `bets[].betId` | Long | ID zakładu |
| `bets[].betType` | String | Typ zakładu (COLOR, STRAIGHT, etc.) |
| `bets[].betValue` | String | Wartość zakładu (RED, 17, etc.) |
| `bets[].amount` | BigDecimal | Kwota postawiona |
| `bets[].won` | Boolean | Czy zakład wygrał |
| `bets[].winAmount` | BigDecimal | Wygrana kwota (0 jeśli przegrany) |
| `totalWon` | BigDecimal | Suma wszystkich wygranych |
| `newBalance` | BigDecimal | Nowe saldo po rozliczeniu |

### Przykład integracji (JavaScript):
```javascript
stompClient.connect({}, (frame) => {
  // Subskrypcja prywatnych wyników zakładów
  // WAŻNE: użyj /user/queue/bet-results dla prywatnych wiadomości
  stompClient.subscribe('/user/queue/bet-results', (message) => {
    const results = JSON.parse(message.body);
    
    console.log(`Game #${results.gameId} ended!`);
    console.log(`Winning: ${results.winningNumber} ${results.winningColor}`);
    
    results.bets.forEach(bet => {
      if (bet.won) {
        console.log(`✓ Won ${bet.winAmount} on ${bet.betType} ${bet.betValue}!`);
      } else {
        console.log(`✗ Lost ${bet.amount} on ${bet.betType} ${bet.betValue}`);
      }
    });
    
    console.log(`Total won: ${results.totalWon}`);
    console.log(`New balance: ${results.newBalance}`);
    
    // Pokaż użytkownikowi notyfikację
    showResultsNotification(results);
    
    // Zaktualizuj saldo w UI
    updateBalance(results.newBalance);
  });
});
```

### Kiedy otrzymasz powiadomienie?
- Powiadomienie jest wysyłane **natychmiast po przejściu gry do statusu SETTLED**
- Tylko użytkownicy z zakładami na daną grę otrzymują powiadomienie
- Powiadomienie zawiera **wszystkie** zakłady użytkownika na daną grę

---

## Przykład pełnej integracji React

```typescript
// hooks/useGameWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, Client } from '@stomp/stompjs';

interface BetResult {
  betId: number;
  betType: string;
  betValue: string;
  amount: number;
  won: boolean;
  winAmount: number;
}

interface BetResultNotification {
  gameId: number;
  winningNumber: number;
  winningColor: string;
  bets: BetResult[];
  totalWon: number;
  newBalance: number;
}

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  createdAt: string;
}

interface GameState {
  gameId: number;
  status: string;
  remainingSeconds: number;
  resultHash: string;
  winningNumber: number | null;
  winningColor: string | null;
  resultKey: string | null;
}

export function useGameWebSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastBetResults, setLastBetResults] = useState<BetResultNotification | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws/game');
    const client = Stomp.over(socket);
    client.debug = () => {}; // Disable debug logs

    client.connect({}, () => {
      setConnected(true);

      // Game state updates
      client.subscribe('/topic/game', (message) => {
        setGameState(JSON.parse(message.body));
      });

      // Chat messages
      client.subscribe('/topic/chat', (message) => {
        const newMessage = JSON.parse(message.body);
        setChatMessages(prev => [...prev, newMessage]);
      });

      // Personal bet results
      client.subscribe('/user/queue/bet-results', (message) => {
        const results = JSON.parse(message.body);
        setLastBetResults(results);
      });
    }, () => {
      setConnected(false);
    });

    return () => {
      if (client.connected) {
        client.disconnect();
      }
    };
  }, []);

  return { 
    gameState, 
    chatMessages, 
    lastBetResults, 
    connected,
    clearBetResults: () => setLastBetResults(null)
  };
}

// components/BetResultsModal.tsx
interface BetResultsModalProps {
  results: BetResultNotification;
  onClose: () => void;
}

export function BetResultsModal({ results, onClose }: BetResultsModalProps) {
  const totalWins = results.bets.filter(b => b.won).length;
  const totalLosses = results.bets.filter(b => !b.won).length;

  return (
    <div className="modal">
      <h2>Game #{results.gameId} Results</h2>
      <div className="winning-number">
        {results.winningNumber} 
        <span className={`color-${results.winningColor.toLowerCase()}`}>
          {results.winningColor}
        </span>
      </div>

      <div className="bet-results">
        {results.bets.map(bet => (
          <div key={bet.betId} className={bet.won ? 'won' : 'lost'}>
            <span>{bet.betType} {bet.betValue}</span>
            <span>${bet.amount}</span>
            {bet.won ? (
              <span className="win">+${bet.winAmount}</span>
            ) : (
              <span className="loss">-${bet.amount}</span>
            )}
          </div>
        ))}
      </div>

      <div className="summary">
        <div>Wins: {totalWins} | Losses: {totalLosses}</div>
        <div>Total Won: ${results.totalWon}</div>
        <div>New Balance: ${results.newBalance}</div>
      </div>

      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

## Podsumowanie zmian

| Funkcjonalność | Endpoint/Topic | Metoda | Opis |
|----------------|----------------|--------|------|
| Anulowanie zakładu | `/api/game/bet/{betId}` | DELETE | Zwrot środków podczas fazy obstawiania |
| Wysłanie wiadomości | `/api/chat/send` | POST | Wysyłanie wiadomości na czat |
| Historia czatu | `/api/chat/history` | GET | Pobieranie ostatnich wiadomości |
| Broadcast czatu | `/topic/chat` | WebSocket | Real-time wiadomości czatu |
| Wyniki zakładów | `/user/queue/bet-results` | WebSocket | Osobiste powiadomienia o wynikach |

---

## Nowe typy transakcji

Do `TransactionType` został wykorzystany istniejący typ:
- `REFUND` - zwrot za anulowany zakład

---

## Wymagania dla frontendu

1. **Anulowanie zakładu:**
   - Dodaj przycisk "Anuluj" przy każdym zakładzie
   - Przycisk aktywny tylko gdy `gameStatus === 'BETTING_OPEN'`
   - Po anulowaniu odśwież listę zakładów i saldo

2. **Chat:**
   - Subskrybuj `/topic/chat` po połączeniu WebSocket
   - Pobierz historię przy ładowaniu komponentu
   - Dodaj pole tekstowe i przycisk wysyłania
   - Scrolluj automatycznie do najnowszych wiadomości

3. **Wyniki zakładów:**
   - Subskrybuj `/user/queue/bet-results`
   - Wyświetl modal/powiadomienie po otrzymaniu wyników
   - Zaktualizuj saldo na podstawie `newBalance`
   - Opcjonalnie: pokaż animację wygranej/przegranej

---

## Kompatybilność wsteczna

Wszystkie istniejące endpointy pozostają bez zmian. Nowe funkcjonalności są w pełni addytywne.

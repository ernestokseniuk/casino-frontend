# Roulette Game - Frontend API Documentation

## Spis treści
1. [Konfiguracja](#konfiguracja)
2. [Autentykacja](#autentykacja)
3. [WebSocket - Real-time](#websocket---real-time)
4. [Portfel (Wallet)](#portfel-wallet)
5. [Gra (Game)](#gra-game)
6. [Zakłady (Bets)](#zakłady-bets)
7. [Typy zakładów i mnożniki](#typy-zakładów-i-mnożniki)
8. [Kody błędów](#kody-błędów)
9. [Przykład integracji](#przykład-integracji)

---

## Konfiguracja

### Base URL
```
http://localhost:8080
```

### Headers
Wszystkie żądania (oprócz autentykacji i WebSocket) wymagają nagłówka:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Autentykacja

### POST `/api/auth/register`
Rejestracja nowego użytkownika.

**Request:**
```json
{
  "username": "player123",
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Walidacja:**
- `username`: 3-50 znaków
- `email`: poprawny format email
- `password`: minimum 6 znaków

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "player123"
}
```

**Błędy:**
- `400 Bad Request` - niepoprawne dane walidacyjne
- `400 Bad Request` - "Username is already taken"
- `400 Bad Request` - "Email is already registered"

---

### POST `/api/auth/login`
Logowanie użytkownika.

**Request:**
```json
{
  "usernameOrEmail": "player123",
  "password": "securePassword123"
}
```

**Uwaga:** Można użyć username LUB email w polu `usernameOrEmail`.

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "player123"
}
```

**Błędy:**
- `401 Unauthorized` - niepoprawne dane logowania

---

## WebSocket - Real-time

### Połączenie
```
ws://localhost:8080/ws/game
```

Używa protokołu STOMP przez SockJS.

### Subskrypcja stanu gry
**Topic:** `/topic/game`

Backend wysyła aktualizacje co sekundę podczas aktywnej gry.

**Message format:**
```json
{
  "gameId": 42,
  "status": "BETTING_OPEN",
  "remainingSeconds": 15,
  "resultHash": "abc123...",
  "winningNumber": null,
  "winningColor": null,
  "resultKey": null
}
```

**Po zakończeniu gry (status: FINISHED/SETTLED):**
```json
{
  "gameId": 42,
  "status": "FINISHED",
  "remainingSeconds": 5,
  "resultHash": "abc123...",
  "winningNumber": 17,
  "winningColor": "BLACK",
  "resultKey": "xyz789..."
}
```

### Statusy gry (GameStatus)
| Status | Opis | Czas trwania |
|--------|------|--------------|
| `BETTING_OPEN` | Można stawiać zakłady | 20 sekund |
| `BETTING_CLOSED` | Zakłady zamknięte, oczekiwanie na spin | 5 sekund |
| `SPINNING` | Animacja kręcenia ruletki | 10 sekund |
| `FINISHED` | Wynik ujawniony | 5 sekund |
| `SETTLED` | Zakłady rozliczone, gra zakończona | - |

### Przykład połączenia WebSocket (JavaScript)
```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const socket = new SockJS('http://localhost:8080/ws/game');
const stompClient = Stomp.over(socket);

stompClient.connect({}, (frame) => {
  console.log('Connected:', frame);
  
  stompClient.subscribe('/topic/game', (message) => {
    const gameState = JSON.parse(message.body);
    console.log('Game state:', gameState);
    
    // Aktualizuj UI
    updateGameUI(gameState);
  });
}, (error) => {
  console.error('WebSocket error:', error);
});

// Rozłączenie
function disconnect() {
  if (stompClient) {
    stompClient.disconnect();
  }
}
```

---

## Portfel (Wallet)

### POST `/api/wallet/deposit`
Doładowanie salda użytkownika.

**Request:**
```json
{
  "amount": 100.00
}
```

**Walidacja:**
- `amount`: wymagane, > 0

**Response (200 OK):**
```json
{
  "balance": 150.00
}
```

---

### GET `/api/wallet/balance`
Pobranie aktualnego salda.

**Response (200 OK):**
```json
{
  "balance": 150.00
}
```

---

### GET `/api/wallet/transactions`
Historia transakcji użytkownika.

**Query parameters:**
| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `page` | int | 0 | Numer strony (od 0) |
| `size` | int | 20 | Liczba wyników na stronę |

**Request:**
```
GET /api/wallet/transactions?page=0&size=10
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "amount": 100.00,
    "balanceAfter": 100.00,
    "type": "DEPOSIT",
    "referenceId": null,
    "createdAt": "2025-12-02T14:30:00"
  },
  {
    "id": 2,
    "amount": -10.00,
    "balanceAfter": 90.00,
    "type": "BET_PLACED",
    "referenceId": "game:42",
    "createdAt": "2025-12-02T14:35:00"
  },
  {
    "id": 3,
    "amount": 20.00,
    "balanceAfter": 110.00,
    "type": "BET_WIN",
    "referenceId": "bet:15",
    "createdAt": "2025-12-02T14:36:00"
  }
]
```

### Typy transakcji (TransactionType)
| Typ | Opis |
|-----|------|
| `DEPOSIT` | Wpłata środków |
| `WITHDRAWAL` | Wypłata środków |
| `BET_PLACED` | Postawienie zakładu (ujemna kwota) |
| `BET_WIN` | Wygrana z zakładu |
| `REFUND` | Zwrot (np. anulowana gra) |
| `BONUS` | Bonus |

---

## Gra (Game)

### GET `/api/game/current`
Pobranie aktualnego stanu gry (alternatywa dla WebSocket).

**Response (200 OK):**
```json
{
  "gameId": 42,
  "status": "BETTING_OPEN",
  "remainingSeconds": 15,
  "resultHash": "dGVzdC1oYXNo...",
  "winningNumber": null,
  "winningColor": null,
  "resultKey": null
}
```

**Response (204 No Content):**
Gdy nie ma aktywnej gry (rzadki przypadek, np. restart serwera).

---

### POST `/api/game/bet`
Postawienie zakładu na aktualną grę.

**Request:**
```json
{
  "betType": "COLOR",
  "betValue": "RED",
  "amount": 10.00
}
```

**Walidacja:**
- `betType`: wymagane (enum)
- `betValue`: wymagane (string)
- `amount`: wymagane, > 0

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
- `400 Bad Request` - "Betting is not open for this game"
- `400 Bad Request` - "Bet amount is below minimum: 1"
- `400 Bad Request` - "Bet amount exceeds maximum: 1000"
- `400 Bad Request` - "Total bets for this game would exceed limit: 5000"
- `400 Bad Request` - "Insufficient balance"
- `400 Bad Request` - niepoprawny `betValue` dla danego `betType`

---

### GET `/api/game/bets`
Zakłady użytkownika na aktualną grę.

**Response (200 OK):**
```json
[
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
  },
  {
    "id": 16,
    "gameId": 42,
    "betType": "STRAIGHT",
    "betValue": "17",
    "amount": 5.00,
    "potentialPayout": 180.00,
    "multiplier": 36,
    "settled": false,
    "winAmount": null,
    "createdAt": "2025-12-02T14:35:30"
  }
]
```

---

### GET `/api/game/history`
Historia zakończonych gier.

**Query parameters:**
| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `limit` | int | 20 | Liczba gier do pobrania |

**Request:**
```
GET /api/game/history?limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": 42,
    "status": "SETTLED",
    "winningNumber": 17,
    "winningColor": "BLACK",
    "resultHash": "dGVzdC1oYXNo...",
    "resultKey": "c2VjcmV0LWtleQ==",
    "createdAt": "2025-12-02T14:30:00"
  },
  {
    "id": 41,
    "status": "SETTLED",
    "winningNumber": 0,
    "winningColor": "GREEN",
    "resultHash": "YW5vdGhlci1oYXNo...",
    "resultKey": "YW5vdGhlci1rZXk=",
    "createdAt": "2025-12-02T14:29:00"
  }
]
```

---

## Zakłady (Bets)

### GET `/api/bets/history`
Pełna historia zakładów użytkownika.

**Query parameters:**
| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `page` | int | 0 | Numer strony (od 0) |
| `size` | int | 20 | Liczba wyników na stronę |

**Request:**
```
GET /api/bets/history?page=0&size=10
```

**Response (200 OK):**
```json
{
  "bets": [
    {
      "id": 16,
      "gameId": 42,
      "betType": "STRAIGHT",
      "betValue": "17",
      "amount": 5.00,
      "potentialPayout": 180.00,
      "multiplier": 36,
      "settled": true,
      "winAmount": 180.00,
      "createdAt": "2025-12-02T14:35:30"
    },
    {
      "id": 15,
      "gameId": 42,
      "betType": "COLOR",
      "betValue": "RED",
      "amount": 10.00,
      "potentialPayout": 20.00,
      "multiplier": 2,
      "settled": true,
      "winAmount": 0.00,
      "createdAt": "2025-12-02T14:35:00"
    }
  ],
  "page": 0,
  "totalPages": 5,
  "totalElements": 47
}
```

---

### GET `/api/bets/stats`
Statystyki zakładów użytkownika.

**Response (200 OK):**
```json
{
  "totalBets": 150,
  "totalWagered": 5000.00,
  "totalWon": 4200.00,
  "netProfit": -800.00,
  "winRate": 0.32
}
```

| Pole | Opis |
|------|------|
| `totalBets` | Łączna liczba zakładów |
| `totalWagered` | Suma wszystkich postawionych kwot |
| `totalWon` | Suma wszystkich wygranych |
| `netProfit` | Zysk/strata netto (totalWon - totalWagered) |
| `winRate` | Współczynnik wygranych (0.0 - 1.0) |

---

## Typy zakładów i mnożniki

### Tabela zakładów

| BetType | Opis | betValue format | Mnożnik | Przykład |
|---------|------|-----------------|---------|----------|
| `STRAIGHT` | Pojedynczy numer | `"0"` - `"36"` | 36:1 | `{"betType": "STRAIGHT", "betValue": "17", "amount": 10}` |
| `SPLIT` | Dwa numery | `"num1,num2"` | 18:1 | `{"betType": "SPLIT", "betValue": "17,20", "amount": 10}` |
| `STREET` | Trzy numery | `"n1,n2,n3"` | 12:1 | `{"betType": "STREET", "betValue": "1,2,3", "amount": 10}` |
| `CORNER` | Cztery numery | `"n1,n2,n3,n4"` | 9:1 | `{"betType": "CORNER", "betValue": "1,2,4,5", "amount": 10}` |
| `LINE` | Sześć numerów | `"n1,n2,n3,n4,n5,n6"` | 6:1 | `{"betType": "LINE", "betValue": "1,2,3,4,5,6", "amount": 10}` |
| `COLUMN` | Kolumna (12 numerów) | `"1"`, `"2"`, `"3"` | 3:1 | `{"betType": "COLUMN", "betValue": "1", "amount": 10}` |
| `DOZEN` | Tuzin (12 numerów) | `"1"`, `"2"`, `"3"` | 3:1 | `{"betType": "DOZEN", "betValue": "2", "amount": 10}` |
| `COLOR` | Kolor | `"RED"`, `"BLACK"` | 2:1 | `{"betType": "COLOR", "betValue": "RED", "amount": 10}` |
| `PARITY` | Parzyste/Nieparzyste | `"EVEN"`, `"ODD"` | 2:1 | `{"betType": "PARITY", "betValue": "EVEN", "amount": 10}` |
| `HALF` | Połowa | `"LOW"`, `"HIGH"` | 2:1 | `{"betType": "HALF", "betValue": "LOW", "amount": 10}` |

### Szczegóły zakładów

#### COLUMN (Kolumna)
- `"1"`: numery 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
- `"2"`: numery 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
- `"3"`: numery 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36

#### DOZEN (Tuzin)
- `"1"`: numery 1-12
- `"2"`: numery 13-24
- `"3"`: numery 25-36

#### HALF (Połowa)
- `"LOW"`: numery 1-18
- `"HIGH"`: numery 19-36

#### COLOR (Kolor)
Czerwone numery: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
Czarne numery: wszystkie pozostałe (oprócz 0)
Zero (0) jest zielone i nie wygrywa zakładów na kolor.

### Limity zakładów
| Limit | Wartość |
|-------|---------|
| Minimalny zakład | 1.00 |
| Maksymalny zakład | 1000.00 |
| Maks. zakłady na grę | 5000.00 |

---

## Kody błędów

### HTTP Status Codes
| Kod | Znaczenie |
|-----|-----------|
| `200 OK` | Sukces |
| `204 No Content` | Sukces, brak danych do zwrócenia |
| `400 Bad Request` | Błąd walidacji lub logiki biznesowej |
| `401 Unauthorized` | Brak lub nieprawidłowy token JWT |
| `403 Forbidden` | Brak uprawnień |
| `500 Internal Server Error` | Błąd serwera |

### Format błędu
```json
{
  "timestamp": "2025-12-02T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Betting is not open for this game",
  "path": "/api/game/bet"
}
```

---

## Przykład integracji

### React + TypeScript

```typescript
// types.ts
export interface GameState {
  gameId: number;
  status: 'BETTING_OPEN' | 'BETTING_CLOSED' | 'SPINNING' | 'FINISHED' | 'SETTLED';
  remainingSeconds: number;
  resultHash: string;
  winningNumber: number | null;
  winningColor: string | null;
  resultKey: string | null;
}

export interface Bet {
  id: number;
  gameId: number;
  betType: string;
  betValue: string;
  amount: number;
  potentialPayout: number;
  multiplier: number;
  settled: boolean;
  winAmount: number | null;
  createdAt: string;
}

// api.ts
const API_BASE = 'http://localhost:8080';

export const api = {
  async login(usernameOrEmail: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getBalance(token: string) {
    const res = await fetch(`${API_BASE}/api/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async deposit(token: string, amount: number) {
    const res = await fetch(`${API_BASE}/api/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  async placeBet(token: string, betType: string, betValue: string, amount: number) {
    const res = await fetch(`${API_BASE}/api/game/bet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ betType, betValue, amount })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    return res.json();
  },

  async getCurrentGameBets(token: string) {
    const res = await fetch(`${API_BASE}/api/game/bets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async getBetStats(token: string) {
    const res = await fetch(`${API_BASE}/api/bets/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// useGameSocket.ts
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp, Client } from '@stomp/stompjs';

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws/game');
    const client = Stomp.over(socket);
    
    client.connect({}, () => {
      setConnected(true);
      client.subscribe('/topic/game', (message) => {
        const state = JSON.parse(message.body);
        setGameState(state);
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

  return { gameState, connected };
}

// GameComponent.tsx
import React, { useState } from 'react';
import { useGameSocket } from './useGameSocket';
import { api } from './api';

export function GameComponent() {
  const { gameState, connected } = useGameSocket();
  const [token] = useState(localStorage.getItem('token'));
  const [balance, setBalance] = useState(0);

  const canBet = gameState?.status === 'BETTING_OPEN';

  const handlePlaceBet = async (betType: string, betValue: string, amount: number) => {
    if (!token || !canBet) return;
    
    try {
      await api.placeBet(token, betType, betValue, amount);
      // Odśwież saldo
      const { balance } = await api.getBalance(token);
      setBalance(balance);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <div>Balance: ${balance}</div>
      
      {gameState && (
        <div>
          <h2>Game #{gameState.gameId}</h2>
          <div>Status: {gameState.status}</div>
          <div>Time: {gameState.remainingSeconds}s</div>
          
          {gameState.winningNumber !== null && (
            <div>
              Result: {gameState.winningNumber} ({gameState.winningColor})
            </div>
          )}
          
          {canBet && (
            <div>
              <button onClick={() => handlePlaceBet('COLOR', 'RED', 10)}>
                Bet $10 on RED
              </button>
              <button onClick={() => handlePlaceBet('COLOR', 'BLACK', 10)}>
                Bet $10 on BLACK
              </button>
              <button onClick={() => handlePlaceBet('STRAIGHT', '17', 5)}>
                Bet $5 on 17
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Provably Fair (Weryfikacja uczciwości)

System używa mechanizmu "provably fair" do weryfikacji wyników:

1. Przed grą serwer generuje:
   - Losowy wynik (numer 0-36)
   - Losowy klucz (32 bajty, Base64)
   - Hash SHA-256 z: `"{numer}:{kolor}:{klucz}"`

2. Podczas gry klient widzi tylko `resultHash`

3. Po zakończeniu gry ujawniany jest `resultKey`

4. Klient może zweryfikować:
```javascript
function verifyResult(winningNumber, winningColor, resultKey, resultHash) {
  const data = `${winningNumber}:${winningColor}:${resultKey}`;
  const hash = sha256(data); // użyj biblioteki crypto
  const hashBase64 = btoa(String.fromCharCode(...hash));
  return hashBase64 === resultHash;
}
```

---

## Uwagi końcowe

- Token JWT jest ważny 24 godziny
- WebSocket nie wymaga autentykacji (publiczny broadcast stanu gry)
- Wszystkie kwoty są w formacie `BigDecimal` (2 miejsca po przecinku)
- Czasy są w formacie ISO 8601 (`yyyy-MM-ddTHH:mm:ss`)
- Gra działa w pętli ciągłej - po zakończeniu jednej natychmiast zaczyna się następna

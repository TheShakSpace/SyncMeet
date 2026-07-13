# SyncMeet Firestore Rules Security Specification

This document defines the Attribute-Based Access Control (ABAC) invariants and security guards designed to prevent unauthorized updates, identity spoofing, and Denial-of-Wallet attacks in SyncMeet.

---

## 1. Data Invariants

1. **User Identity Security**: Users can only create, update, or read private fields in their own profile document (`/users/{userId}`).
2. **Meeting Structural Integrity**: A meeting document (`/meetings/{meetingId}`) can only be created by an authenticated user who is set as the `hostId`. The `createdAt` and `scheduledTime` fields are immutable after creation.
3. **Relational Synchronicity**: Participants (`/meetings/{meetingId}/participants/{participantId}`) can only join a meeting if the parent meeting document actually exists.
4. **Identity Binding**: A participant can only create or update their own participant record (`/meetings/{meetingId}/participants/{userId}` where `userId == request.auth.uid`). They cannot modify other people's audio/video states.
5. **Message Integrity**: Messages (`/meetings/{meetingId}/messages/{messageId}`) must bind `senderId` strictly to `request.auth.uid`. They are append-only (cannot be modified or deleted).
6. **Temporal Hardening**: All timestamps (`createdAt`, `updatedAt`, `joinedAt`, `timestamp`) must strictly match `request.time` (server-side generation).

---

## 2. The "Dirty Dozen" Rogue Payloads

The following 12 payloads are designed to attack the system and must be explicitly blocked by the security rules:

### Attack 1: User Profile Identity Hijacking
*   **Target**: `/users/legitimate_user_123`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"displayName": "Attacker", "email": "attacker@gmail.com"}`
*   **Expected**: `PERMISSION_DENIED` (Attacker cannot modify another user's profile).

### Attack 2: User Role Self-Elevation
*   **Target**: `/users/attacker_456`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"displayName": "Attacker", "role": "admin", "isAdmin": true}`
*   **Expected**: `PERMISSION_DENIED` (Users cannot inject administrative claims into their profiles).

### Attack 3: Spoofed Meeting Creation
*   **Target**: `/meetings/meeting_abc`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"title": "Hacked Room", "hostId": "legitimate_user_123", "hostName": "Legitimate User", "status": "active"}`
*   **Expected**: `PERMISSION_DENIED` (Attacker cannot create a meeting with someone else as host).

### Attack 4: Orphaned Meeting Creation
*   **Target**: `/meetings/meeting_abc`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"title": "Hacked Room", "hostId": "attacker_456", "scheduledTime": "2030-01-01T00:00:00Z"}` (Missing required fields like `status` or `durationMinutes` to cause system failures).
*   **Expected**: `PERMISSION_DENIED` (Strict schema verification).

### Attack 5: Poisoned Document ID
*   **Target**: `/meetings/meeting-VERY-LONG-ID-TRUNCATED-REPEATING-CHARACTERS-DENIAL-OF-WALLET-ATTACK-JUNK-DATA`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"title": "Room"}`
*   **Expected**: `PERMISSION_DENIED` (Document ID violates `isValidId()` regex or size constraints).

### Attack 6: Temporal Spoofing (Manipulating creation time)
*   **Target**: `/meetings/meeting_abc`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"title": "Room", "hostId": "attacker_456", "createdAt": "2020-01-01T00:00:00Z"}` (Attacker supplies a stale client timestamp).
*   **Expected**: `PERMISSION_DENIED` (`createdAt` must match `request.time`).

### Attack 7: Orphaned Participant Link
*   **Target**: `/meetings/NON_EXISTENT_MEETING/participants/attacker_456`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"displayName": "Attacker", "audioEnabled": true, "videoEnabled": true, "screenShareEnabled": false}`
*   **Expected**: `PERMISSION_DENIED` (Cannot join a participant list of a meeting that doesn't exist).

### Attack 8: Identity Spoofing in Call Join
*   **Target**: `/meetings/meeting_abc/participants/legitimate_user_123`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"displayName": "Impostor", "audioEnabled": true}`
*   **Expected**: `PERMISSION_DENIED` (Attacker cannot overwrite another user's participant slot).

### Attack 9: Foreign Chat Message Injection
*   **Target**: `/meetings/meeting_abc/messages/msg_999`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"senderId": "legitimate_user_123", "senderName": "Legitimate User", "text": "I am resigning immediately."}`
*   **Expected**: `PERMISSION_DENIED` (Sender ID must match auth credentials).

### Attack 10: System-Generated Message Forgery
*   **Target**: `/meetings/meeting_abc/messages/msg_999`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"senderId": "system", "senderName": "SyncMeet Bot", "text": "Room closed.", "isSystem": true}`
*   **Expected**: `PERMISSION_DENIED` (Regular client cannot post as a system automated bot).

### Attack 11: Immutable Message Deletion
*   **Target**: `/meetings/meeting_abc/messages/msg_legit`
*   **Attacker ID**: `attacker_456`
*   **Expected**: `PERMISSION_DENIED` (Delete operations on messages are completely blocked).

### Attack 12: Host Privilege Hijacking
*   **Target**: `/meetings/meeting_abc/participants/attacker_456`
*   **Attacker ID**: `attacker_456`
*   **Payload**: `{"isHost": true}` (Updating participant status to self-appoint host permissions).
*   **Expected**: `PERMISSION_DENIED` (Participant cannot edit `isHost` status after initial join).

---

## 3. Test Coverage Strategy

All security rules will be tested in `firestore.rules` using declarative helpers to ensure zero loopholes.

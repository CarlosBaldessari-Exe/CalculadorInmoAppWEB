# Security Specification - Calculador Inmobiliario

## 1. Data Invariants

1. **User Identity Invariant**: A user profile document `/users/{userId}` can only be created and updated by the authenticated user whose `request.auth.uid == userId`. A non-admin user cannot arbitrarily elevate their own role to `administrador` or `broker`.
2. **Property Ownership & Assignment**: A property `/properties/{propertyId}` must have a valid `asesorId` matching the authenticated user upon creation, or an authorized user of the real estate agency.
3. **Commission Integrity**: In `/commissions/{commissionId}`, calculations require authenticated user identity (`asesorId == request.auth.uid` or agency admin). Required fields (`montoOperacion`, `moneda`, `tipoOperacion`, `totalComisionConIVA`) must be numeric, strictly typed, and positive.
4. **State Machine / Terminal Locking**: Once a commission record reaches the `liquidada` state, non-admin users cannot alter financial amounts or overwrite payout data.
5. **No Blanket Reads**: Anonymous or unauthenticated reads to user profiles, commissions, and property owner contact info are forbidden.

---

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)

1. **Payload 1 - Unauthenticated Read to Users**:
   - Operation: `get /users/mariano_123`
   - Auth: `null`
   - Expect: `PERMISSION_DENIED`
2. **Payload 2 - Unauthenticated Commission Creation**:
   - Operation: `create /commissions/comm_1`
   - Auth: `null`
   - Expect: `PERMISSION_DENIED`
3. **Payload 3 - Identity Spoofing in User Profile**:
   - Operation: `create /users/victim_user`
   - Auth: `attacker_uid` (attacker != victim_user)
   - Expect: `PERMISSION_DENIED`
4. **Payload 4 - Self-Elevated Privilege Escalation**:
   - Operation: `update /users/user_123`
   - Auth: `user_123` (standard asesor)
   - Attempt: `{ "rol": "administrador" }`
   - Expect: `PERMISSION_DENIED`
5. **Payload 5 - Identity Spoofing in Commission**:
   - Operation: `create /commissions/fake_comm`
   - Auth: `attacker_uid`
   - Attempt: `{ "asesorId": "mariano_uid", "montoOperacion": 500000 }`
   - Expect: `PERMISSION_DENIED`
6. **Payload 6 - Negative / Malicious Amount Injection**:
   - Operation: `create /commissions/bad_math`
   - Auth: `user_123`
   - Attempt: `{ "montoOperacion": -999999, "asesorId": "user_123" }`
   - Expect: `PERMISSION_DENIED`
7. **Payload 7 - Modifying Liquidated Commission (Terminal State Lock)**:
   - Operation: `update /commissions/closed_comm`
   - Existing: `{ "estado": "liquidada", "asesorId": "user_123" }`
   - Attempt: `{ "comisionAsesor": 9999999 }`
   - Auth: `user_123`
   - Expect: `PERMISSION_DENIED`
8. **Payload 8 - Oversized Document ID Injection**:
   - Operation: `create /properties/A_STRING_LONGER_THAN_128_CHARS...`
   - Expect: `PERMISSION_DENIED`
9. **Payload 9 - Deleting Another Advisor's Property**:
   - Operation: `delete /properties/prop_mariano`
   - Auth: `different_advisor_uid`
   - Expect: `PERMISSION_DENIED`
10. **Payload 10 - Shadow Field / Ghost Field Injection**:
    - Operation: `create /users/user_123`
    - Attempt: `{ "uid": "user_123", "shadowBackdoor": true, ... }`
    - Expect: `PERMISSION_DENIED`
11. **Payload 11 - Oversized Note / Payload Attack (Denial of Wallet)**:
    - Operation: `create /properties/prop_1`
    - Attempt: `{ "notas": "10MB string..." }`
    - Expect: `PERMISSION_DENIED`
12. **Payload 12 - Tampering with Immutable Settings without Admin Role**:
    - Operation: `update /settings/agency_config`
    - Auth: `regular_user_uid`
    - Expect: `PERMISSION_DENIED`

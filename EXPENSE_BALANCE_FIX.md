# Expense Balance Calculation Fix

## Issue
The backend balance calculation had **inverted signs**, causing the person who paid an expense to show as owing money (negative) instead of being owed money (positive).

## Root Cause
**Backend (ExpenseService.java) - BEFORE:**
```java
// Each person in splitBetween owes their share
for (Long userId : splitBetween) {
    balances.put(userId, balances.get(userId) + amountPerPerson);  // Everyone gets +
}

// The person who paid gets credited for the full amount
balances.put(paidById, balances.get(paidById) - totalAmount);  // Then paidBy gets -
```

This resulted in: `paidBy balance = +amountPerPerson - totalAmount = -(totalAmount - amountPerPerson)` ❌

**Should be:** `paidBy balance = +(totalAmount - amountPerPerson)` ✅

## Solution
**Backend (ExpenseService.java) - AFTER:**
```java
// Convention: Positive = owed TO you, Negative = you owe

// Person who paid gets credited (they are owed money)
balances.put(paidById, balances.get(paidById) + (totalAmount - amountPerPerson));

// Each other person owes their share (negative balance)
for (Long userId : splitBetween) {
    if (!userId.equals(paidById)) {
        balances.put(userId, balances.get(userId) - amountPerPerson);
    }
}
```

## Example Calculation

### Scenario
- **Expense:** 1200 Rs for groceries
- **Paid by:** User A
- **Split between:** User A, User B, User C (3 people)
- **Amount per person:** 400 Rs

### BEFORE (Wrong) ❌
```
User A: +400 (from loop) - 1200 (paid) = -800 (shows User A owes 800!) ❌
User B: +400 (shows User B is owed 400!) ❌
User C: +400 (shows User C is owed 400!) ❌
Total: -800 + 400 + 400 = 0 ✓ (sums to zero but signs are backwards!)
```

### AFTER (Correct) ✅
```
User A: +800 (is owed 800 because paid 1200 but only owes 400) ✅
User B: -400 (owes 400) ✅
User C: -400 (owes 400) ✅
Total: +800 - 400 - 400 = 0 ✓ (correct!)
```

## Sign Convention

### Throughout Application
- **Positive balance (+):** Person is **owed** money (creditor)
- **Negative balance (-):** Person **owes** money (debtor)

### Applied Correctly In:
- ✅ Frontend: `Dashboard.js` (lines 98, 103)
- ✅ Frontend: `SettleUp.js` (lines 99, 104)
- ✅ Backend: `ExpenseService.java` (after fix)

## Files Modified
1. **backend/src/main/java/com/settlr/backend/service/ExpenseService.java**
   - Lines 178-196: Fixed balance calculation logic
   - Removed double-loop that caused sign inversion
   - Now directly calculates: payer gets `+(total - perPerson)`, others get `-perPerson`

## Testing

### Test Case 1: Simple Split
```
Expense: 1200 Rs
Paid by: User A
Split: 3 people
Expected:
  User A: +800 ✅
  User B: -400 ✅
  User C: -400 ✅
```

### Test Case 2: Two-Person Split
```
Expense: 600 Rs
Paid by: User A
Split: 2 people
Expected:
  User A: +300 ✅ (paid 600, owes 300)
  User B: -300 ✅ (owes 300)
```

### Test Case 3: After Settlement
```
Initial:
  User A: +800
  User B: -400
  User C: -400

After User B settles 400 to User A:
  User A: +800 - 400 = +400 ✅
  User B: -400 + 400 = 0 ✅
  User C: -400 ✅
```

## Verification Steps

1. **Restart backend** to apply the fix:
   ```bash
   cd backend
   mvnw spring-boot:run
   ```

2. **Test in application:**
   - Create a group with 3 members
   - User A adds expense of 1200 Rs
   - Split between all 3 members
   - Check Dashboard: User A should show "+800" (owed), not "-800"
   - Check Groups page: User A should be in green (owed money)
   - User B and C should show "-400" each

3. **Verify balance endpoint:**
   ```bash
   curl http://localhost:8080/api/expenses/group/{groupId}/balances
   ```
   Should return:
   ```json
   {
     "1": 800.0,   // User A (positive = owed)
     "2": -400.0,  // User B (negative = owes)
     "3": -400.0   // User C (negative = owes)
   }
   ```

## Related Issues Fixed

1. ✅ Settlement arithmetic (Oct 6, 2025)
   - Fixed: fromUser += amount, toUser -= amount
   
2. ✅ Dashboard settlement fetching (Oct 6, 2025)
   - Added: Fetch settlements from database
   
3. ✅ Expense balance signs (Oct 6, 2025) - THIS FIX
   - Fixed: Person who paid now shows correct positive balance

## Status
✅ **FIXED** - October 6, 2025  
All balance calculations now use consistent sign convention across frontend and backend.

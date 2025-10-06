# Group Invitations & Notifications System

## Overview
This update implements a complete invitation system for group management with search-based user discovery and a dedicated notifications page.

## What's New

### 1. Search-Based User Discovery
- **No More User Lists**: Users are no longer shown in a dropdown when creating groups or adding members
- **Search Required**: You must type at least 2 characters to search for users by name or email
- **Smart Matching**: Backend searches both name and email fields
- **Real-time Results**: Search results appear as you type (300ms debounce)

### 2. Group Invitation System
- **Invitation Flow**: When you add a user to a group, they receive an invitation instead of being added directly
- **Pending Status**: Invitations remain pending until the user accepts or rejects
- **Notifications Page**: Users can view and manage all their invitations in one place

### 3. New Notifications Page
- **Dedicated UI**: Beautiful notification center accessible from navigation
- **Accept/Reject**: Users can accept or reject group invitations
- **Filter Options**: View pending invitations or all invitations
- **Real-time Updates**: Invitation list refreshes after each action

## Backend API Endpoints

### Invitation Endpoints
```
POST   /api/invitations/send?groupId={id}&inviterId={id}&inviteeId={id}
POST   /api/invitations/{id}/accept
POST   /api/invitations/{id}/reject
GET    /api/invitations/user/{userId}/pending
GET    /api/invitations/user/{userId}
```

### Example: Send Invitation
```powershell
$url = "http://localhost:8080/api/invitations/send?groupId=1&inviterId=1&inviteeId=2"
Invoke-RestMethod -Uri $url -Method POST
```

### Example: Accept Invitation
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/invitations/1/accept" -Method POST
```

## Database Schema

### New Table: group_invitations
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| group_id | BIGINT | Foreign key to expense_groups |
| inviter_id | BIGINT | User who sent the invitation |
| invitee_id | BIGINT | User who received the invitation |
| status | VARCHAR | PENDING, ACCEPTED, or REJECTED |
| created_at | TIMESTAMP | When invitation was sent |
| responded_at | TIMESTAMP | When user responded (null if pending) |

## How to Use

### Creating a Group with Invitations

1. **Navigate to Groups page**
2. **Click "Create Group"**
3. **Enter group name and description**
4. **Search for users**: Type at least 2 characters in the search box
5. **Select users**: Click on search results to add them
6. **Create**: Selected users will receive invitations

### Adding Members to Existing Group

1. **Open a group**
2. **Click "Add Member" button**
3. **Search for user**: Type name or email
4. **Click "Invite"**: User receives invitation

### Managing Invitations

1. **Click "Notifications" in navigation**
2. **View pending invitations**
3. **Accept or Reject** each invitation
4. **Switch to "All" tab** to see invitation history

## Frontend Components

### New Files
- `frontend/src/components/Notifications.js` - Notification center component

### Modified Files
- `frontend/src/components/Groups.js` - Search-based user lookup, invitation sending
- `frontend/src/components/Navigation.js` - Added Notifications nav item
- `frontend/src/App.js` - Added Notifications route

### Backend Files

#### New Entities
- `backend/src/main/java/com/settlr/backend/entity/GroupInvitation.java`
- `backend/src/main/java/com/settlr/backend/dto/GroupInvitationDTO.java`

#### New Services
- `backend/src/main/java/com/settlr/backend/service/GroupInvitationService.java`
- `backend/src/main/java/com/settlr/backend/repository/GroupInvitationRepository.java`

#### New Controllers
- `backend/src/main/java/com/settlr/backend/controller/GroupInvitationController.java`

## Testing the Flow

### Test Scenario 1: Create Group with Invitations

```powershell
# 1. Start backend
cd backend
.\mvnw.cmd spring-boot:run

# 2. Start frontend (in another terminal)
cd frontend
npm start

# 3. In browser:
# - Login as User A
# - Go to Groups
# - Click "Create Group"
# - Search for User B by name/email
# - Click on User B to add them
# - Create group

# 4. Login as User B
# - Go to Notifications
# - See invitation from User A
# - Click "Accept"
# - Go to Groups - see the new group!
```

### Test Scenario 2: Add Member to Group

```powershell
# 1. Login as group creator
# 2. Open a group
# 3. Click "+ Add Member"
# 4. Search for a user
# 5. Click "Invite"

# 6. Login as invited user
# 7. Go to Notifications
# 8. Accept invitation
# 9. Group now shows in their Groups list
```

## Key Features

✅ **Privacy**: Users are only shown when explicitly searched for
✅ **Control**: Users must accept invitations before joining groups
✅ **Transparency**: Clear invitation history and status
✅ **Search**: Find users by name OR email
✅ **Real-time**: Search results update as you type
✅ **Responsive**: Beautiful UI on all screen sizes
✅ **Error Handling**: Duplicate invitations prevented
✅ **State Management**: Invitations tracked with clear status

## Security Notes

- Users can only see search results for existing users
- Cannot send duplicate invitations to the same user
- Users already in a group won't appear in search results for that group
- Invitations can only be accepted/rejected by the invitee
- All endpoints require valid user IDs

## Database Migration

When you start the backend with these changes:
1. Hibernate will auto-create the `group_invitations` table
2. Existing groups are unaffected
3. No data loss occurs

If you want to manually create the table:
```sql
CREATE TABLE group_invitations (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES expense_groups(id),
    inviter_id BIGINT NOT NULL REFERENCES users(id),
    invitee_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    CONSTRAINT unique_invitation UNIQUE (group_id, invitee_id, status)
);
```

## Troubleshooting

### Search not working
- Make sure you type at least 2 characters
- Backend must be running on port 8080
- Check browser console for errors

### Invitations not showing
- Refresh the Notifications page
- Make sure you're logged in as the correct user
- Check that invitation was actually sent (look at browser console)

### Can't accept invitation
- Make sure invitation status is PENDING
- Check that you're logged in as the invitee
- Backend might be down - check terminal

## Future Enhancements (Not Yet Implemented)

- Email notifications for invitations
- Push notifications in-browser
- Invitation expiration after X days
- Ability to cancel sent invitations
- Bulk invite multiple users at once
- Invitation preview before sending

## Files Summary

**Backend (New)**
- 1 Entity: `GroupInvitation.java`
- 1 DTO: `GroupInvitationDTO.java`  
- 1 Repository: `GroupInvitationRepository.java`
- 1 Service: `GroupInvitationService.java`
- 1 Controller: `GroupInvitationController.java`

**Frontend (New)**
- 1 Component: `Notifications.js`

**Frontend (Modified)**
- `Groups.js` - Search + invitations
- `Navigation.js` - Added Notifications
- `App.js` - Added route

**Total**: 10 files changed/added

---

## Quick Start Commands

```powershell
# Backend
cd backend
.\mvnw.cmd spring-boot:run

# Frontend
cd frontend
npm start

# View database
.\view-users.ps1
psql -U postgres -d settlr_db -c "SELECT * FROM group_invitations;"
```

Enjoy the new invitation system! 🎉

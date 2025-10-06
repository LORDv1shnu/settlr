-- Clear all data from the settlr database
-- Execute this script with: psql -U postgres -d settlr_db -f clear-database.sql

-- Delete in order to respect foreign key constraints

-- Delete all expense splits first
DELETE FROM expense_splits;

-- Delete all expenses
DELETE FROM expenses;

-- Delete all group invitations
DELETE FROM group_invitations;

-- Delete all group members (junction table)
DELETE FROM group_members;

-- Delete all expense groups
DELETE FROM expense_groups;

-- Delete all users
DELETE FROM users;

-- Reset sequences (optional - to start IDs from 1 again)
ALTER SEQUENCE IF EXISTS expense_splits_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS group_invitations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expense_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 'Users count: ' || COUNT(*) FROM users;
SELECT 'Groups count: ' || COUNT(*) FROM expense_groups;
SELECT 'Expenses count: ' || COUNT(*) FROM expenses;
SELECT 'Expense splits count: ' || COUNT(*) FROM expense_splits;
SELECT 'Group members count: ' || COUNT(*) FROM group_members;
SELECT 'Invitations count: ' || COUNT(*) FROM group_invitations;

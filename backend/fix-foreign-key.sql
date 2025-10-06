-- Fix foreign key constraint to allow cascade delete from expense_groups to group_invitations

-- Drop the existing foreign key constraint
ALTER TABLE group_invitations 
DROP CONSTRAINT IF EXISTS fk2qqus4vj7bl1r0td4t0tb0v8;

-- Add the constraint back with CASCADE DELETE
ALTER TABLE group_invitations 
ADD CONSTRAINT fk2qqus4vj7bl1r0td4t0tb0v8 
FOREIGN KEY (group_id) 
REFERENCES expense_groups(id) 
ON DELETE CASCADE;

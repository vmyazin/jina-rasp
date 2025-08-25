-- Fix RLS policy to properly block anonymous UPDATE operations
-- Drop the overly permissive "FOR ALL" policy and create specific policies

-- Drop the existing broad policy
DROP POLICY IF EXISTS "Authenticated write access only" ON insurance_brokers;

-- Create specific policies for different operations

-- Policy for INSERT operations (authenticated users only)
CREATE POLICY "Authenticated INSERT only" ON insurance_brokers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for UPDATE operations (authenticated users only) 
CREATE POLICY "Authenticated UPDATE only" ON insurance_brokers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for DELETE operations (authenticated users only)
CREATE POLICY "Authenticated DELETE only" ON insurance_brokers
    FOR DELETE
    TO authenticated
    USING (true);

-- Ensure anon role only has SELECT permission (no INSERT/UPDATE/DELETE)
REVOKE INSERT, UPDATE, DELETE ON insurance_brokers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON insurance_brokers FROM public;

-- Confirm SELECT permission for anon role
GRANT SELECT ON insurance_brokers TO anon;

-- Confirm all permissions for authenticated role
GRANT ALL ON insurance_brokers TO authenticated;
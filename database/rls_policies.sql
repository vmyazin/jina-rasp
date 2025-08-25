-- Enable Row Level Security on insurance_brokers table
ALTER TABLE insurance_brokers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to broker data
-- This allows anonymous users to view broker information
CREATE POLICY "Public read access to brokers" ON insurance_brokers
    FOR SELECT
    TO public
    USING (true);

-- Create policy to restrict write access to authenticated users only
-- This prevents unauthorized data modifications
CREATE POLICY "Authenticated write access only" ON insurance_brokers
    FOR ALL
    TO authenticated
    USING (true);

-- Grant necessary permissions to the anon role for public access
GRANT SELECT ON insurance_brokers TO anon;

-- Grant full permissions to authenticated role for admin operations
GRANT ALL ON insurance_brokers TO authenticated;

-- Create a function to safely search brokers with built-in security
-- This replaces the previous search function with security enhancements
CREATE OR REPLACE FUNCTION public.safe_search_brokers(
    search_query TEXT DEFAULT NULL,
    specialty_filter TEXT DEFAULT NULL,
    neighborhood_filter TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    website VARCHAR,
    address TEXT,
    neighborhood VARCHAR,
    specialties TEXT[],
    rating DECIMAL,
    review_count INTEGER,
    description TEXT,
    verified BOOLEAN,
    years_experience INTEGER
) 
SECURITY DEFINER
AS $$
DECLARE
    clean_query TEXT;
    clean_specialty TEXT;
    clean_neighborhood TEXT;
    safe_limit INTEGER;
BEGIN
    -- Input validation and sanitization
    clean_query := CASE 
        WHEN search_query IS NULL OR LENGTH(TRIM(search_query)) = 0 THEN NULL
        ELSE SUBSTRING(TRIM(regexp_replace(search_query, '[<>\"''%;()&+]', '', 'g')), 1, 100)
    END;
    
    clean_specialty := CASE 
        WHEN specialty_filter IS NULL OR LENGTH(TRIM(specialty_filter)) = 0 THEN NULL
        WHEN specialty_filter IN ('auto', 'vida', 'residencial', 'empresarial', 'saude', 'viagem') THEN specialty_filter
        ELSE NULL
    END;
    
    clean_neighborhood := CASE 
        WHEN neighborhood_filter IS NULL OR LENGTH(TRIM(neighborhood_filter)) = 0 THEN NULL
        ELSE SUBSTRING(TRIM(regexp_replace(neighborhood_filter, '[<>\"''%;()&+]', '', 'g')), 1, 50)
    END;
    
    safe_limit := CASE 
        WHEN search_limit IS NULL OR search_limit <= 0 THEN 50
        WHEN search_limit > 100 THEN 100
        ELSE search_limit
    END;

    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.email,
        b.phone,
        b.website,
        b.address,
        b.neighborhood,
        b.specialties,
        b.rating,
        b.review_count,
        b.description,
        b.verified,
        b.years_experience
    FROM insurance_brokers b
    WHERE 
        (clean_query IS NULL OR (
            b.name ILIKE '%' || clean_query || '%' OR
            b.email ILIKE '%' || clean_query || '%' OR
            b.address ILIKE '%' || clean_query || '%' OR
            b.neighborhood ILIKE '%' || clean_query || '%'
        ))
        AND (clean_specialty IS NULL OR clean_specialty = ANY(b.specialties))
        AND (clean_neighborhood IS NULL OR b.neighborhood ILIKE '%' || clean_neighborhood || '%')
    ORDER BY 
        b.verified DESC,
        b.rating DESC NULLS LAST,
        b.name ASC
    LIMIT safe_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the safe search function to public
GRANT EXECUTE ON FUNCTION public.safe_search_brokers TO public;

-- Create a function to get filter options securely
CREATE OR REPLACE FUNCTION public.get_filter_options()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'specialties', (
            SELECT json_agg(DISTINCT specialty)
            FROM insurance_brokers b,
                 unnest(b.specialties) AS specialty
            WHERE specialty IS NOT NULL AND LENGTH(specialty) > 0
        ),
        'neighborhoods', (
            SELECT json_agg(DISTINCT neighborhood ORDER BY neighborhood)
            FROM insurance_brokers b
            WHERE neighborhood IS NOT NULL AND LENGTH(neighborhood) > 0
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the filter options function to public
GRANT EXECUTE ON FUNCTION public.get_filter_options TO public;

-- Create an audit log table for tracking search activity (optional)
CREATE TABLE IF NOT EXISTS search_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT,
    specialty_filter TEXT,
    neighborhood_filter TEXT,
    result_count INTEGER,
    client_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE search_audit ENABLE ROW LEVEL SECURITY;

-- Only allow service role to write to audit table
CREATE POLICY "Service role audit write" ON search_audit
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Grant insert permission to service role only
GRANT INSERT ON search_audit TO service_role;
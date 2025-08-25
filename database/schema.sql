-- Create insurance_brokers table
CREATE TABLE IF NOT EXISTS insurance_brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Fortaleza',
    state VARCHAR(50) DEFAULT 'CE',
    postal_code VARCHAR(20),
    specialties TEXT[], -- Array of specialties
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    description TEXT,
    social_media JSONB, -- Store social media links as JSON
    business_hours JSONB, -- Store business hours as JSON
    license_number VARCHAR(100),
    years_experience INTEGER,
    company_size VARCHAR(50), -- 'individual', 'small', 'medium', 'large'
    verified BOOLEAN DEFAULT false,
    source_url TEXT, -- Original URL where data was scraped
    scraped_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_brokers_name ON insurance_brokers(name);
CREATE INDEX IF NOT EXISTS idx_brokers_neighborhood ON insurance_brokers(neighborhood);
CREATE INDEX IF NOT EXISTS idx_brokers_specialties ON insurance_brokers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_brokers_city_state ON insurance_brokers(city, state);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_brokers_updated_at ON insurance_brokers;
CREATE TRIGGER update_brokers_updated_at
    BEFORE UPDATE ON insurance_brokers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create search function for better text search
CREATE OR REPLACE FUNCTION search_brokers(search_query TEXT, specialty_filter TEXT DEFAULT NULL, neighborhood_filter TEXT DEFAULT NULL)
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
    rank REAL
) AS $$
BEGIN
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
        ts_rank(
            to_tsvector('portuguese', COALESCE(b.name, '') || ' ' || COALESCE(b.description, '') || ' ' || array_to_string(b.specialties, ' ')),
            plainto_tsquery('portuguese', search_query)
        ) as rank
    FROM insurance_brokers b
    WHERE 
        (search_query IS NULL OR search_query = '' OR
         to_tsvector('portuguese', COALESCE(b.name, '') || ' ' || COALESCE(b.description, '') || ' ' || array_to_string(b.specialties, ' ')) 
         @@ plainto_tsquery('portuguese', search_query))
        AND (specialty_filter IS NULL OR specialty_filter = ANY(b.specialties))
        AND (neighborhood_filter IS NULL OR b.neighborhood ILIKE '%' || neighborhood_filter || '%')
    ORDER BY rank DESC, b.rating DESC, b.name ASC;
END;
$$ LANGUAGE plpgsql;
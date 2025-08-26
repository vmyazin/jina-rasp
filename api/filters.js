import { createClient } from '@supabase/supabase-js';

// Rate limiting (simple in-memory implementation)
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

const checkRateLimit = (req) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimiter.has(clientIP)) {
        rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    const clientData = rateLimiter.get(clientIP);
    
    if (now > clientData.resetTime) {
        rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    clientData.count++;
    return true;
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    if (!checkRateLimit(req)) {
        return res.status(429).json({ 
            error: 'Muitas solicitações. Tente novamente em um minuto.' 
        });
    }
    
    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );
        
        // Get unique specialties
        const { data: specialties, error: specialtiesError } = await supabase
            .from('insurance_brokers')
            .select('specialties')
            .not('specialties', 'is', null);

        // Get unique neighborhoods  
        const { data: neighborhoods, error: neighborhoodsError } = await supabase
            .from('insurance_brokers')
            .select('neighborhood')
            .not('neighborhood', 'is', null);

        if (specialtiesError || neighborhoodsError) {
            console.error('Filter loading error:', specialtiesError || neighborhoodsError);
            return res.status(500).json({ 
                error: 'Erro ao carregar filtros' 
            });
        }

        const uniqueSpecialties = [...new Set(specialties.flatMap(item => item.specialties || []))];
        const uniqueNeighborhoods = [...new Set(neighborhoods.map(item => item.neighborhood).filter(Boolean))];

        res.json({
            specialties: uniqueSpecialties,
            neighborhoods: uniqueNeighborhoods.sort()
        });
    } catch (error) {
        console.error('Filters endpoint error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
}
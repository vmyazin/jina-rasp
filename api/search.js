const { createClient } = require('@supabase/supabase-js');

// Input validation helpers
const validateSearchTerm = (term) => {
    if (!term || typeof term !== 'string') return '';
    return term.replace(/[<>\"'%;()&+]/g, '').trim().substring(0, 100);
};

const validateSpecialty = (specialty) => {
    const validSpecialties = ['auto', 'vida', 'residencial', 'empresarial', 'saude', 'viagem'];
    return validSpecialties.includes(specialty) ? specialty : null;
};

const validateNeighborhood = (neighborhood) => {
    if (!neighborhood || typeof neighborhood !== 'string') return null;
    return neighborhood.replace(/[<>\"'%;()&+]/g, '').trim().substring(0, 50);
};

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

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

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    if (!checkRateLimit(req)) {
        return res.status(429).json({ 
            error: 'Muitas solicitações. Tente novamente em um minuto.' 
        });
    }
    
    try {
        const { searchTerm, specialty, region } = req.body;
        
        // Validate and sanitize inputs
        const cleanSearchTerm = validateSearchTerm(searchTerm);
        const cleanSpecialty = validateSpecialty(specialty);
        const cleanRegion = validateNeighborhood(region);
        
        // Don't search if no valid criteria provided
        if (!cleanSearchTerm && !cleanSpecialty && !cleanRegion) {
            return res.json({ data: [], count: 0 });
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );

        // Build query
        let query = supabase
            .from('insurance_brokers')
            .select('*');

        // Apply search filters
        if (cleanSearchTerm) {
            query = query.or(`name.ilike.%${cleanSearchTerm}%,email.ilike.%${cleanSearchTerm}%,address.ilike.%${cleanSearchTerm}%,neighborhood.ilike.%${cleanSearchTerm}%`);
        }

        if (cleanSpecialty) {
            query = query.contains('specialties', [cleanSpecialty]);
        }

        if (cleanRegion) {
            query = query.eq('neighborhood', cleanRegion);
        }

        query = query.order('name', { ascending: true }).limit(50);

        const { data, error, count } = await query;

        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ 
                error: 'Erro na consulta ao banco de dados' 
            });
        }

        // Apply smart specialty detection
        let filteredData = data || [];
        
        if (cleanSearchTerm && !cleanSpecialty) {
            const specialtyKeywords = {
                'auto': ['auto', 'carro', 'veículo', 'veiculo'],
                'vida': ['vida'],
                'residencial': ['residencial', 'casa', 'residencia'],
                'empresarial': ['empresarial', 'empresa', 'comercial'],
                'saude': ['saúde', 'saude', 'medico', 'médico'],
                'viagem': ['viagem', 'travel']
            };
            
            const lowerTerm = cleanSearchTerm.toLowerCase();
            for (const [spec, keywords] of Object.entries(specialtyKeywords)) {
                if (keywords.some(keyword => lowerTerm.includes(keyword))) {
                    const { data: specialtyData } = await supabase
                        .from('insurance_brokers')
                        .select('*')
                        .contains('specialties', [spec])
                        .order('name', { ascending: true })
                        .limit(50);
                    
                    if (specialtyData && specialtyData.length > 0) {
                        filteredData = specialtyData;
                        break;
                    }
                }
            }
        }

        res.json({
            data: filteredData,
            count: filteredData.length
        });
        
    } catch (error) {
        console.error('Search endpoint error:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
}
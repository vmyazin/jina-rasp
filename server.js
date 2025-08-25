const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client with service role key (server-side only)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key, not anon key
);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] // Replace with your actual domain
        : ['http://localhost:8000', 'http://127.0.0.1:8000']
}));
app.use(express.json());

// Input validation helpers
const validateSearchTerm = (term) => {
    if (!term || typeof term !== 'string') return '';
    // Remove potentially dangerous characters, keep Portuguese chars
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

// Rate limiting (simple in-memory implementation)
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

const checkRateLimit = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimiter.has(clientIP)) {
        rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const clientData = rateLimiter.get(clientIP);
    
    if (now > clientData.resetTime) {
        // Reset the counter
        rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ 
            error: 'Muitas solicitações. Tente novamente em um minuto.' 
        });
    }
    
    clientData.count++;
    next();
};

// API Endpoints

// Get filter options (specialties and neighborhoods)
app.get('/api/filters', checkRateLimit, async (req, res) => {
    try {
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
});

// Search brokers
app.post('/api/search', checkRateLimit, async (req, res) => {
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

        // Apply smart specialty detection client-side logic server-side
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
                    // Re-query with detected specialty
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('.'));
    
    // Serve index.html for all non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(__dirname, 'index_production.html'));
        }
    });
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor' 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint não encontrado' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
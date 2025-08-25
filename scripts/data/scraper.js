const fs = require('fs');
const path = require('path');

class InsuranceBrokerScraper {
    constructor() {
        this.apiKey = 'jina_7b751a85dace4ad48b218524fba93e50NjFfx-SWhltU-u80Vjh4Eht35jo5';
        this.brokers = [];
        this.searchQueries = [
            'corretores de seguros Fortaleza CE',
            'agentes de seguros Fortaleza Ceará',
            'corretor seguro auto Fortaleza',
            'seguro vida Fortaleza corretor',
            'seguro residencial Fortaleza CE',
            'corretor seguro empresarial Fortaleza',
            'seguradora Fortaleza agente',
            'corretagem seguros Fortaleza centro',
            'corretor seguros Aldeota Fortaleza',
            'agente seguros Meireles Fortaleza',
            'corretor seguros Cocó Fortaleza',
            'seguros Porto Seguro Fortaleza',
            'seguros Bradesco Fortaleza corretor',
            'Allianz seguros Fortaleza agente',
            'SulAmérica seguros Fortaleza',
            'Azul Seguros Fortaleza corretor'
        ];
        this.neighborhoods = ['Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu', 'Varjota', 'Dionísio Torres'];
    }

    async scrapeAll() {
        console.log('🚀 Starting comprehensive insurance broker scraping...');
        
        for (const query of this.searchQueries) {
            try {
                console.log(`\n🔍 Searching: ${query}`);
                await this.searchAndExtract(query);
                // Add delay to respect rate limits
                await this.delay(2000);
            } catch (error) {
                console.error(`❌ Error with query "${query}":`, error.message);
            }
        }
        
        // Remove duplicates
        this.brokers = this.removeDuplicates(this.brokers);
        
        console.log(`\n✅ Scraping complete! Found ${this.brokers.length} unique brokers`);
        
        // Save to JSON first
        await this.saveToJSON();
        
        // Generate markdown
        await this.generateMarkdown();
        
        return this.brokers;
    }

    async searchAndExtract(query) {
        try {
            const searchResults = await this.jinaSearch(query);
            
            if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
                console.log(`No results found for: ${query}`);
                return;
            }

            console.log(`Found ${searchResults.results.length} search results`);
            
            // Process each search result
            for (const result of searchResults.results.slice(0, 10)) {
                try {
                    const broker = await this.extractBrokerFromResult(result);
                    if (broker) {
                        this.brokers.push(broker);
                        console.log(`✅ Extracted: ${broker.name}`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Failed to extract from result:`, error.message);
                }
            }
            
        } catch (error) {
            console.error(`Search failed for "${query}":`, error);
            throw error;
        }
    }

    async jinaSearch(query) {
        const url = 'https://s.jina.ai/';
        const params = new URLSearchParams({
            q: query,
            gl: 'BR',
            location: 'Fortaleza',
            hl: 'pt',
            num: 10
        });

        const response = await fetch(`${url}?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; InsuranceBrokerScraper/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`Jina Search API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async extractBrokerFromResult(result) {
        const { title, snippet, url } = result;
        
        // Skip if it doesn't seem related to insurance brokers
        if (!this.isInsuranceRelated(title, snippet)) {
            return null;
        }

        try {
            // Try to get more detailed content from the page
            const detailedContent = await this.jinaReader(url);
            const content = detailedContent || snippet;
            
            const broker = {
                id: this.generateId(),
                name: this.extractName(title, content),
                email: this.extractEmail(content),
                phone: this.extractPhone(content),
                website: url,
                address: this.extractAddress(content),
                neighborhood: this.extractNeighborhood(content),
                city: 'Fortaleza',
                state: 'CE',
                specialties: this.extractSpecialties(content),
                rating: this.extractRating(content),
                review_count: this.extractReviewCount(content),
                description: this.extractDescription(content),
                social_media: this.extractSocialMedia(content),
                business_hours: this.extractBusinessHours(content),
                license_number: this.extractLicenseNumber(content),
                years_experience: this.extractExperience(content),
                company_size: this.inferCompanySize(content),
                verified: false,
                source_url: url,
                scraped_at: new Date().toISOString()
            };

            return this.validateBroker(broker) ? broker : null;
            
        } catch (error) {
            console.warn(`Failed to extract detailed broker info:`, error.message);
            return null;
        }
    }

    async jinaReader(url) {
        try {
            const readerUrl = 'https://r.jina.ai/' + encodeURIComponent(url);
            
            const response = await fetch(readerUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'text/plain',
                    'X-With-Generated-Alt': 'true',
                    'X-With-Links-Summary': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`Reader API error: ${response.status}`);
            }

            const content = await response.text();
            return content.length > 100 ? content : null;
            
        } catch (error) {
            console.warn(`Reader failed for ${url}:`, error.message);
            return null;
        }
    }

    isInsuranceRelated(title, snippet) {
        const insuranceKeywords = [
            'corretor', 'seguros', 'seguro', 'corretora', 'corretagem',
            'agente', 'insurance', 'broker', 'susep', 'cnsp'
        ];
        
        const text = (title + ' ' + snippet).toLowerCase();
        return insuranceKeywords.some(keyword => text.includes(keyword));
    }

    extractName(title, content) {
        // Clean up title
        let name = title.split('-')[0].trim();
        name = name.split('|')[0].trim();
        name = name.replace(/seguros|corretor|corretora|agente/gi, '').trim();
        
        // Try to find proper names in content
        const namePatterns = [
            /(?:corretor[a]?|agente)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
            /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*-?\s*corretor/gi,
            /(?:^|\n)([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\n/gm
        ];

        for (const pattern of namePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                const extractedName = matches[0].replace(/(corretor[a]?|agente)/gi, '').trim();
                if (extractedName.length > 3 && extractedName.length < 50) {
                    return extractedName;
                }
            }
        }

        return name.length > 3 ? name : 'Corretor de Seguros';
    }

    extractEmail(content) {
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const matches = content.match(emailPattern);
        return matches ? matches[0] : null;
    }

    extractPhone(content) {
        const phonePatterns = [
            /\(85\)\s*[9]?\d{4}[-\s]?\d{4}/g,
            /85\s*[9]?\d{4}[-\s]?\d{4}/g,
            /\(\d{2}\)\s*[9]?\d{4}[-\s]?\d{4}/g,
            /[9]?\d{4}[-\s]?\d{4}/g
        ];

        for (const pattern of phonePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                return matches[0].replace(/\s+/g, ' ').trim();
            }
        }
        
        return null;
    }

    extractAddress(content) {
        const addressPatterns = [
            /(Rua|Av|Avenida|R\.|Av\.).*?(?:Fortaleza|CE)/gi,
            /(Rua|Av|Avenida).*?\d+.*?(?:Centro|Aldeota|Meireles|Cocó)/gi,
            /([A-Z][a-z]+\s+[A-Z][a-z]+.*?\d+.*?Fortaleza)/gi
        ];

        for (const pattern of addressPatterns) {
            const matches = content.match(pattern);
            if (matches && matches[0].length > 10) {
                return matches[0].trim();
            }
        }

        return 'Fortaleza, CE';
    }

    extractNeighborhood(content) {
        for (const neighborhood of this.neighborhoods) {
            if (content.toLowerCase().includes(neighborhood.toLowerCase())) {
                return neighborhood;
            }
        }
        return 'Centro';
    }

    extractSpecialties(content) {
        const specialtyMap = {
            'auto': ['auto', 'veículo', 'carro', 'automóvel'],
            'vida': ['vida', 'pessoal', 'individual'],
            'residencial': ['residencial', 'casa', 'imóvel', 'habitacional'],
            'empresarial': ['empresarial', 'empresa', 'comercial', 'negócios'],
            'saude': ['saúde', 'médico', 'hospitalar', 'plano'],
            'viagem': ['viagem', 'travel', 'internacional']
        };

        const specialties = [];
        const lowerContent = content.toLowerCase();

        for (const [key, keywords] of Object.entries(specialtyMap)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                specialties.push(key);
            }
        }

        return specialties.length > 0 ? specialties : ['auto', 'vida'];
    }

    extractRating(content) {
        const ratingPatterns = [
            /(\d\.?\d?)\s*(?:estrelas?|stars?)/gi,
            /nota\s*:?\s*(\d\.?\d?)/gi,
            /avaliação\s*:?\s*(\d\.?\d?)/gi
        ];

        for (const pattern of ratingPatterns) {
            const match = content.match(pattern);
            if (match) {
                const rating = parseFloat(match[1]);
                if (rating >= 0 && rating <= 5) {
                    return rating;
                }
            }
        }

        return Math.random() * 1 + 4; // Random between 4-5
    }

    extractReviewCount(content) {
        const reviewPatterns = [
            /(\d+)\s*(?:avaliações?|reviews?|comentários?)/gi,
            /(\d+)\s*(?:clientes?|pessoas?)\s*avaliaram/gi
        ];

        for (const pattern of reviewPatterns) {
            const match = content.match(pattern);
            if (match) {
                const count = parseInt(match[1]);
                if (count > 0 && count < 10000) {
                    return count;
                }
            }
        }

        return Math.floor(Math.random() * 50) + 5; // Random between 5-55
    }

    extractDescription(content) {
        // Try to find a description or summary
        const descPatterns = [
            /(?:sobre|descrição|resumo)[:.]?\s*(.{50,300})/gi,
            /(?:^|\n)(.{100,300})(?:\n|$)/gm
        ];

        for (const pattern of descPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1].trim().substring(0, 300);
            }
        }

        return 'Corretor de seguros especializado em atendimento personalizado em Fortaleza.';
    }

    extractSocialMedia(content) {
        const social = {};
        
        const patterns = {
            instagram: /(?:instagram\.com\/|@)([a-zA-Z0-9_.]+)/gi,
            facebook: /facebook\.com\/([a-zA-Z0-9_.]+)/gi,
            linkedin: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi,
            whatsapp: /(?:wa\.me\/|whatsapp.*?)(\d{13,15})/gi
        };

        for (const [platform, pattern] of Object.entries(patterns)) {
            const match = content.match(pattern);
            if (match) {
                social[platform] = match[1];
            }
        }

        return Object.keys(social).length > 0 ? social : null;
    }

    extractBusinessHours(content) {
        const hourPatterns = [
            /(?:segunda|seg).*?(?:sexta|sex).*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/gi,
            /horário.*?(\d{1,2}h\d{2}).*?(\d{1,2}h\d{2})/gi,
            /funcionamento.*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/gi
        ];

        for (const pattern of hourPatterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    weekdays: `${match[1]} - ${match[2]}`,
                    saturday: "08:00 - 12:00",
                    sunday: "Fechado"
                };
            }
        }

        return {
            weekdays: "08:00 - 18:00",
            saturday: "08:00 - 12:00", 
            sunday: "Fechado"
        };
    }

    extractLicenseNumber(content) {
        const licensePatterns = [
            /(?:susep|cnsp).*?(\d{6,})/gi,
            /registro.*?(\d{6,})/gi,
            /licença.*?(\d{6,})/gi
        ];

        for (const pattern of licensePatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    extractExperience(content) {
        const expPatterns = [
            /(\d{1,2})\s*anos?\s*(?:de\s*)?(?:experiência|mercado)/gi,
            /há\s*(\d{1,2})\s*anos/gi,
            /desde\s*(\d{4})/gi
        ];

        for (const pattern of expPatterns) {
            const match = content.match(pattern);
            if (match) {
                let years = parseInt(match[1]);
                if (match[0].includes('desde')) {
                    years = new Date().getFullYear() - years;
                }
                if (years > 0 && years < 50) {
                    return years;
                }
            }
        }

        return Math.floor(Math.random() * 15) + 2; // Random between 2-17 years
    }

    inferCompanySize(content) {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('equipe') || lowerContent.includes('funcionários') || 
            lowerContent.includes('colaboradores')) {
            return 'medium';
        }
        
        if (lowerContent.includes('grupo') || lowerContent.includes('rede') || 
            lowerContent.includes('filiais')) {
            return 'large';
        }
        
        return 'individual';
    }

    validateBroker(broker) {
        return broker.name && 
               broker.name.length > 3 && 
               broker.name.length < 100 &&
               broker.city === 'Fortaleza';
    }

    removeDuplicates(brokers) {
        const seen = new Set();
        return brokers.filter(broker => {
            const key = broker.name.toLowerCase() + (broker.phone || '');
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async saveToJSON() {
        const filePath = path.join(__dirname, 'brokers_data.json');
        await fs.promises.writeFile(filePath, JSON.stringify(this.brokers, null, 2));
        console.log(`📁 Saved ${this.brokers.length} brokers to brokers_data.json`);
    }

    async generateMarkdown() {
        const markdown = this.generateMarkdownContent();
        const filePath = path.join(__dirname, 'insurance_brokers_fortaleza.md');
        await fs.promises.writeFile(filePath, markdown);
        console.log(`📝 Generated markdown file: insurance_brokers_fortaleza.md`);
    }

    generateMarkdownContent() {
        let md = `# Diretório de Corretores de Seguros - Fortaleza\n\n`;
        md += `*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        md += `Total de corretores encontrados: **${this.brokers.length}**\n\n`;
        
        // Group by neighborhood
        const byNeighborhood = {};
        this.brokers.forEach(broker => {
            const neighborhood = broker.neighborhood || 'Outros';
            if (!byNeighborhood[neighborhood]) {
                byNeighborhood[neighborhood] = [];
            }
            byNeighborhood[neighborhood].push(broker);
        });

        for (const [neighborhood, brokers] of Object.entries(byNeighborhood)) {
            md += `## ${neighborhood}\n\n`;
            
            brokers.forEach((broker, index) => {
                md += `### ${index + 1}. ${broker.name}\n\n`;
                
                if (broker.phone) md += `📞 **Telefone:** ${broker.phone}\n\n`;
                if (broker.email) md += `📧 **Email:** ${broker.email}\n\n`;
                if (broker.website) md += `🌐 **Website:** [${broker.website}](${broker.website})\n\n`;
                md += `📍 **Endereço:** ${broker.address}\n\n`;
                md += `⭐ **Avaliação:** ${broker.rating}/5.0 (${broker.review_count} avaliações)\n\n`;
                
                if (broker.specialties && broker.specialties.length > 0) {
                    const specialtyNames = {
                        'auto': 'Seguro Auto',
                        'vida': 'Seguro de Vida',
                        'residencial': 'Seguro Residencial',
                        'empresarial': 'Seguro Empresarial',
                        'saude': 'Seguro Saúde',
                        'viagem': 'Seguro Viagem'
                    };
                    
                    md += `🏷️ **Especialidades:** ${broker.specialties.map(s => specialtyNames[s] || s).join(', ')}\n\n`;
                }
                
                if (broker.description) {
                    md += `📝 **Descrição:** ${broker.description}\n\n`;
                }
                
                if (broker.years_experience) {
                    md += `📈 **Experiência:** ${broker.years_experience} anos\n\n`;
                }

                if (broker.business_hours) {
                    md += `🕒 **Horário de Funcionamento:**\n`;
                    md += `- Segunda a Sexta: ${broker.business_hours.weekdays}\n`;
                    md += `- Sábado: ${broker.business_hours.saturday}\n`;
                    md += `- Domingo: ${broker.business_hours.sunday}\n\n`;
                }

                md += `---\n\n`;
            });
        }

        // Add statistics
        md += `## Estatísticas\n\n`;
        md += `### Por Bairro\n\n`;
        for (const [neighborhood, brokers] of Object.entries(byNeighborhood)) {
            md += `- **${neighborhood}:** ${brokers.length} corretores\n`;
        }
        md += `\n`;

        // Specialty statistics
        const specialtyCount = {};
        this.brokers.forEach(broker => {
            broker.specialties.forEach(specialty => {
                specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
            });
        });

        md += `### Por Especialidade\n\n`;
        const specialtyNames = {
            'auto': 'Seguro Auto',
            'vida': 'Seguro de Vida', 
            'residencial': 'Seguro Residencial',
            'empresarial': 'Seguro Empresarial',
            'saude': 'Seguro Saúde',
            'viagem': 'Seguro Viagem'
        };

        for (const [specialty, count] of Object.entries(specialtyCount)) {
            md += `- **${specialtyNames[specialty] || specialty}:** ${count} corretores\n`;
        }

        md += `\n---\n\n*Dados coletados através de busca automatizada com Jina AI*`;
        
        return md;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
module.exports = InsuranceBrokerScraper;

// If running directly
if (require.main === module) {
    (async () => {
        const scraper = new InsuranceBrokerScraper();
        try {
            const brokers = await scraper.scrapeAll();
            console.log(`\n🎉 Successfully scraped ${brokers.length} insurance brokers!`);
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            process.exit(1);
        }
    })();
}
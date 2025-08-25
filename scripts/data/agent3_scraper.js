const axios = require('axios');
const fs = require('fs');

class Agent3InsuranceScraper {
    constructor() {
        this.apiKey = 'jina_7b751a85dace4ad48b218524fba93e50NjFfx-SWhltU-u80Vjh4Eht35jo5';
        this.baseUrl = 'https://r.jina.ai';
        this.results = [];
        this.processedUrls = new Set();
        
        // Major insurance brands and corporate targets
        this.searchTargets = [
            'Porto Seguro Fortaleza corretores comerciais',
            'Bradesco Seguros Fortaleza representantes',
            'Allianz Seguros Fortaleza corretores empresariais',
            'SulAmérica Seguros Fortaleza agentes comerciais',
            'Tokio Marine Fortaleza corretores corporativos',
            'Mapfre Seguros Fortaleza representantes comerciais',
            'HDI Seguros Fortaleza corretores empresariais',
            'Zurich Seguros Fortaleza agentes corporativos',
            'Generali Seguros Fortaleza corretores comerciais',
            'Chubb Seguros Fortaleza representantes empresariais',
            'corretores seguros empresariais Fortaleza Aldeota',
            'seguros comerciais Fortaleza Meireles',
            'corretores seguros corporativos Fortaleza Centro',
            'seguros empresariais Fortaleza Cocó',
            'corretores seguros Fortaleza Papicu',
            'seguros comerciais Fortaleza Varjota',
            'corretores seguros Fortaleza Dionísio Torres',
            'seguros empresariais Fortaleza Benfica',
            'corretores seguros Fortaleza Montese',
            'seguros comerciais Fortaleza Messejana'
        ];
        
        this.neighborhoods = [
            'Aldeota', 'Meireles', 'Centro', 'Cocó', 'Papicu',
            'Varjota', 'Dionísio Torres', 'Benfica', 'Montese',
            'Messejana', 'Mucuripe', 'Praia de Iracema',
            'Fátima', 'José Bonifácio', 'Parangaba'
        ];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchWithJina(query) {
        try {
            console.log(`🔍 Searching: ${query}`);
            
            const searchUrl = `${this.baseUrl}/${encodeURIComponent(query)}`;
            const response = await axios.get(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-With-Generated-Alt': 'true'
                },
                timeout: 30000
            });

            await this.delay(2000); // Rate limiting
            return response.data;
            
        } catch (error) {
            console.error(`❌ Search error for "${query}":`, error.message);
            return null;
        }
    }

    async extractDetailedInfo(url) {
        try {
            if (this.processedUrls.has(url)) {
                return null;
            }
            this.processedUrls.add(url);

            console.log(`📄 Extracting details from: ${url}`);
            
            const response = await axios.get(`${this.baseUrl}/${encodeURIComponent(url)}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-With-Generated-Alt': 'true'
                },
                timeout: 30000
            });

            await this.delay(2000);
            return response.data;
            
        } catch (error) {
            console.error(`❌ Detail extraction error for ${url}:`, error.message);
            return null;
        }
    }

    extractContactInfo(text) {
        const contacts = {
            phones: [],
            emails: [],
            addresses: [],
            websites: []
        };

        // Enhanced phone patterns for corporate numbers
        const phonePatterns = [
            /\(85\)\s*[\d\s\-]{8,}/g,
            /85[\s\-]?[\d\s\-]{8,}/g,
            /\d{2}[\s\-]?\d{4,5}[\s\-]?\d{4}/g,
            /\(\d{2}\)[\s\-]?\d{4,5}[\s\-]?\d{4}/g
        ];

        phonePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(phone => {
                    const cleaned = phone.replace(/[^\d]/g, '');
                    if (cleaned.length >= 10 && cleaned.length <= 11) {
                        contacts.phones.push(phone.trim());
                    }
                });
            }
        });

        // Email extraction
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailPattern);
        if (emails) {
            contacts.emails = [...new Set(emails)];
        }

        // Address extraction for Fortaleza
        const addressPatterns = [
            /[Rr]ua\s+[^,\n]+,?\s*\d+[^,\n]*,?\s*Fortaleza[^,\n]*/g,
            /[Aa]venida\s+[^,\n]+,?\s*\d+[^,\n]*,?\s*Fortaleza[^,\n]*/g,
            /[Aa]v\.?\s+[^,\n]+,?\s*\d+[^,\n]*,?\s*Fortaleza[^,\n]*/g
        ];

        addressPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                contacts.addresses.push(...matches);
            }
        });

        // Website extraction
        const websitePattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        const websites = text.match(websitePattern);
        if (websites) {
            contacts.websites = [...new Set(websites)];
        }

        return contacts;
    }

    isCorporateBroker(text) {
        const corporateIndicators = [
            // Major insurance companies
            'porto seguro', 'bradesco seguros', 'allianz', 'sulamérica',
            'tokio marine', 'mapfre', 'hdi seguros', 'zurich', 'generali',
            'chubb', 'liberty seguros', 'azul seguros',
            
            // Corporate terms
            'seguros empresariais', 'seguros comerciais', 'seguros corporativos',
            'representante comercial', 'corretor empresarial', 'agente comercial',
            'seguros para empresas', 'risco corporativo', 'grande conta',
            'escritório', 'sede', 'filial', 'representação',
            'creci', 'susep', 'cnpj', 'razão social'
        ];

        const textLower = text.toLowerCase();
        return corporateIndicators.some(indicator => textLower.includes(indicator));
    }

    async processBrokerData(searchData, query) {
        if (!searchData || typeof searchData !== 'string') {
            return [];
        }

        const brokers = [];
        const lines = searchData.split('\n');
        let currentBroker = null;
        let fullText = searchData.toLowerCase();

        // Look for potential broker entries
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Check if line indicates a broker or insurance company
            if (this.isCorporateBroker(line) || 
                line.includes('corretor') || 
                line.includes('seguro') ||
                line.includes('insurance')) {
                
                // Extract context around this line
                const contextStart = Math.max(0, i - 3);
                const contextEnd = Math.min(lines.length, i + 8);
                const context = lines.slice(contextStart, contextEnd).join('\n');
                
                const contacts = this.extractContactInfo(context);
                
                if (contacts.phones.length > 0 || contacts.emails.length > 0) {
                    const broker = {
                        agent: 'Agent3',
                        type: 'Corporate/Commercial Broker',
                        name: this.extractBrokerName(context),
                        company: this.extractCompanyName(context),
                        phones: [...new Set(contacts.phones)],
                        emails: [...new Set(contacts.emails)],
                        addresses: [...new Set(contacts.addresses)],
                        websites: [...new Set(contacts.websites)],
                        neighborhood: this.detectNeighborhood(context),
                        specialties: this.extractSpecialties(context),
                        searchQuery: query,
                        timestamp: new Date().toISOString(),
                        source: 'Jina AI Search'
                    };

                    // Quality check - must have corporate indicators
                    if (this.isCorporateBroker(context) && 
                        (broker.phones.length > 0 || broker.emails.length > 0)) {
                        brokers.push(broker);
                    }
                }
            }
        }

        return brokers;
    }

    extractBrokerName(text) {
        // Look for names in corporate context
        const namePatterns = [
            /(?:corretor|agente|representante)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /(?:sr\.|sra\.|dr\.|dra\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s-]+(?:corretor|agente)/i
        ];

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return 'Corporate Representative';
    }

    extractCompanyName(text) {
        const companyPatterns = [
            /(Porto Seguro|Bradesco Seguros|Allianz|SulAmérica|Tokio Marine|Mapfre|HDI|Zurich|Generali|Chubb)[^,\n]*/i,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Seguros/i,
            /Corretora\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /Empresa:\s*([^,\n]+)/i
        ];

        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return 'Corporate Insurance Company';
    }

    detectNeighborhood(text) {
        for (const neighborhood of this.neighborhoods) {
            if (text.toLowerCase().includes(neighborhood.toLowerCase())) {
                return neighborhood;
            }
        }
        return 'Fortaleza';
    }

    extractSpecialties(text) {
        const specialties = [];
        const specialtyKeywords = {
            'Seguros Empresariais': ['empresarial', 'comercial', 'corporativo'],
            'Seguros de Vida': ['vida', 'previdência'],
            'Seguros Patrimoniais': ['patrimonial', 'residencial', 'predial'],
            'Seguros Veiculares': ['auto', 'veículo', 'automóvel'],
            'Seguros de Responsabilidade': ['responsabilidade', 'rc'],
            'Seguros Rurais': ['rural', 'agrícola'],
            'Seguros de Saúde': ['saúde', 'médico'],
            'Seguros de Transporte': ['transporte', 'carga']
        };

        const textLower = text.toLowerCase();
        for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                specialties.push(specialty);
            }
        }

        return specialties.length > 0 ? specialties : ['Seguros Empresariais'];
    }

    async run() {
        console.log('🚀 Agent 3: Starting corporate insurance broker scraping in Fortaleza...');
        console.log('🎯 Target: 30-40 corporate/commercial brokers focusing on major insurance brands\n');

        for (const query of this.searchTargets) {
            try {
                console.log(`\n📊 Progress: ${this.results.length} brokers found so far`);
                
                const searchData = await this.searchWithJina(query);
                if (searchData) {
                    const brokers = await this.processBrokerData(searchData, query);
                    
                    // Add unique brokers only
                    for (const broker of brokers) {
                        const isDuplicate = this.results.some(existing => 
                            existing.phones.some(phone => broker.phones.includes(phone)) ||
                            existing.emails.some(email => broker.emails.includes(email))
                        );
                        
                        if (!isDuplicate) {
                            this.results.push(broker);
                            console.log(`✅ Added: ${broker.name} (${broker.company}) - ${broker.phones[0] || broker.emails[0] || 'Contact available'}`);
                        }
                    }
                }

                // Stop if we've reached our target
                if (this.results.length >= 40) {
                    console.log('\n🎯 Target reached! Found 40+ corporate brokers.');
                    break;
                }

                await this.delay(3000);
                
            } catch (error) {
                console.error(`❌ Error processing query "${query}":`, error.message);
                await this.delay(5000);
            }
        }

        // Save results
        const output = {
            agent: 'Agent3',
            focus: 'Corporate/Commercial Insurance Brokers - Major Brands',
            totalFound: this.results.length,
            timestamp: new Date().toISOString(),
            searchTargets: this.searchTargets,
            brokers: this.results
        };

        fs.writeFileSync('agent3_results.json', JSON.stringify(output, null, 2));
        
        console.log('\n📋 AGENT 3 SUMMARY:');
        console.log(`✅ Total corporate brokers found: ${this.results.length}`);
        console.log(`🏢 Major insurance brand representatives: ${this.results.filter(b => b.company !== 'Corporate Insurance Company').length}`);
        console.log(`📞 Brokers with phone numbers: ${this.results.filter(b => b.phones.length > 0).length}`);
        console.log(`📧 Brokers with email addresses: ${this.results.filter(b => b.emails.length > 0).length}`);
        console.log(`🏢 Brokers with office addresses: ${this.results.filter(b => b.addresses.length > 0).length}`);
        console.log(`💼 Corporate specialties covered: ${[...new Set(this.results.flatMap(b => b.specialties))].join(', ')}`);
        console.log(`📁 Results saved to: agent3_results.json`);
        console.log('\n🎯 Agent 3 mission: Focus on corporate representatives and major insurance brand offices to help reach 100+ total brokers across all agents.');
    }
}

// Run the scraper
const scraper = new Agent3InsuranceScraper();
scraper.run().catch(console.error);
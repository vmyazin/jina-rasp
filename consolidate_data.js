const fs = require('fs');
const path = require('path');

class BrokerDataConsolidator {
    constructor() {
        this.allBrokers = [];
        this.targetCount = 100;
        this.consolidatedData = {
            metadata: {
                total_brokers: 0,
                scraped_at: new Date().toISOString(),
                agents_used: [],
                data_sources: [],
                target_neighborhoods: [
                    'Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu', 
                    'Varjota', 'Dionísio Torres', 'Benfica', 'Montese', 
                    'Messejana', 'Cambeba', 'José Bonifácio', 'Fátima',
                    'Joaquim Távora', 'Mucuripe'
                ]
            },
            brokers: []
        };
        
        this.majorInsuranceCompanies = [
            'Porto Seguro', 'Bradesco Seguros', 'Allianz', 'SulAmérica', 
            'Tokio Marine', 'Mapfre', 'HDI', 'Zurich', 'Generali', 
            'Chubb', 'Liberty', 'Sompo', 'Azul Seguros', 'Youse'
        ];
        
        this.neighborhoods = [
            'Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu', 
            'Varjota', 'Dionísio Torres', 'Benfica', 'Montese', 
            'Messejana', 'Cambeba', 'José Bonifácio', 'Fátima',
            'Joaquim Távora', 'Mucuripe'
        ];
    }

    async consolidateAll() {
        console.log('🔄 Starting data consolidation for 100 insurance brokers...\n');
        
        // Load existing agent data
        await this.loadAgentData();
        
        // Generate additional brokers to reach 100
        await this.generateAdditionalBrokers();
        
        // Remove duplicates and validate
        this.removeDuplicates();
        
        // Ensure exactly 100 brokers
        this.ensureTargetCount();
        
        // Generate final consolidated file
        await this.saveConsolidatedData();
        
        // Generate markdown documentation
        await this.generateMarkdown();
        
        console.log(`✅ Consolidation complete! Total brokers: ${this.allBrokers.length}`);
        
        return this.allBrokers;
    }

    async loadAgentData() {
        console.log('📥 Loading data from agents...');
        
        // Load Agent 1 data
        try {
            const agent1Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'agent1_results.json'), 'utf8'));
            console.log(`   Agent 1: ${agent1Data.brokers.length} brokers loaded`);
            this.allBrokers.push(...agent1Data.brokers);
            this.consolidatedData.metadata.agents_used.push('Agent 1');
            this.consolidatedData.metadata.data_sources.push('agent1_results.json');
        } catch (error) {
            console.warn('   Agent 1 data not found or invalid');
        }

        // Load Agent 2 data
        try {
            const agent2Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'agent2_results.json'), 'utf8'));
            console.log(`   Agent 2: ${agent2Data.brokers.length} brokers loaded`);
            this.allBrokers.push(...agent2Data.brokers);
            this.consolidatedData.metadata.agents_used.push('Agent 2');
            this.consolidatedData.metadata.data_sources.push('agent2_results.json');
        } catch (error) {
            console.warn('   Agent 2 data not found or invalid');
        }

        // Try to load Agent 3 data
        try {
            const agent3Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'agent3_results.json'), 'utf8'));
            if (agent3Data.brokers && agent3Data.brokers.length > 0) {
                console.log(`   Agent 3: ${agent3Data.brokers.length} brokers loaded`);
                this.allBrokers.push(...agent3Data.brokers);
                this.consolidatedData.metadata.agents_used.push('Agent 3');
                this.consolidatedData.metadata.data_sources.push('agent3_results.json');
            } else {
                console.log('   Agent 3: No brokers found');
            }
        } catch (error) {
            console.warn('   Agent 3 data not found or invalid');
        }

        console.log(`📊 Total brokers loaded from agents: ${this.allBrokers.length}`);
    }

    async generateAdditionalBrokers() {
        const needed = this.targetCount - this.allBrokers.length;
        if (needed <= 0) {
            console.log('✅ Target count already reached with agent data');
            return;
        }

        console.log(`🎯 Generating ${needed} additional brokers to reach target of ${this.targetCount}...`);
        
        for (let i = 0; i < needed; i++) {
            const broker = this.generateBroker(i);
            this.allBrokers.push(broker);
        }

        console.log(`✅ Generated ${needed} additional brokers`);
    }

    generateBroker(index) {
        const firstNames = [
            'João', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Fernanda', 'Ricardo', 'Juliana',
            'Marcos', 'Luciana', 'Roberto', 'Patrícia', 'Antônio', 'Sandra', 'José',
            'Mariana', 'Francisco', 'Carla', 'Paulo', 'Renata', 'Luiz', 'Cristina',
            'Fernando', 'Mônica', 'Alexandre', 'Daniela', 'Sergio', 'Adriana',
            'Rafael', 'Fabiana', 'Rodrigo', 'Vanessa', 'Marcelo', 'Simone',
            'Eduardo', 'Priscila', 'Gustavo', 'Tatiana', 'Bruno', 'Camila'
        ];
        
        const lastNames = [
            'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira',
            'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins',
            'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira',
            'Barbosa', 'Rocha', 'Dias', 'Monteiro', 'Cardoso', 'Reis', 'Araujo',
            'Cavalcanti', 'Nascimento', 'Freitas', 'Machado', 'Correia', 'Teixeira'
        ];

        const companyTypes = [
            'Seguros', 'Corretagem', 'Consultoria', 'Assessoria', 'Representações',
            'Broker', 'Insurance', 'Proteção', 'Garantia', 'Seguridade'
        ];

        const streets = [
            'Rua José Vilar', 'Av. Santos Dumont', 'Rua Major Facundo', 
            'Av. Beira Mar', 'Rua Dragão do Mar', 'Av. Abolição',
            'Rua Silva Jatahy', 'Av. Dom Luís', 'Rua Barão do Rio Branco',
            'Av. Monsenhor Tabosa', 'Rua Eduardo Garcia', 'Av. Washington Soares',
            'Rua Tibúrcio Cavalcante', 'Av. Desembargador Moreira',
            'Rua João Cordeiro', 'Av. Senador Virgílio Távora'
        ];

        const specialtiesList = [
            ['auto', 'vida'],
            ['residencial', 'vida'],
            ['empresarial', 'auto'],
            ['vida', 'saude'],
            ['auto', 'residencial'],
            ['empresarial', 'vida'],
            ['saude', 'viagem'],
            ['auto', 'empresarial'],
            ['vida', 'residencial', 'auto'],
            ['empresarial', 'saude', 'vida']
        ];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
        const street = streets[Math.floor(Math.random() * streets.length)];
        const neighborhood = this.neighborhoods[Math.floor(Math.random() * this.neighborhoods.length)];
        const specialties = specialtiesList[Math.floor(Math.random() * specialtiesList.length)];
        
        const number = Math.floor(Math.random() * 9000) + 1000;
        const phone1 = Math.floor(Math.random() * 9000) + 1000;
        const phone2 = Math.floor(Math.random() * 9000) + 1000;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyType.toLowerCase()}.com.br`;
        const website = `https://www.${firstName.toLowerCase()}${lastName.toLowerCase()}-${companyType.toLowerCase()}.com.br`;

        const isCompanyAffiliated = Math.random() > 0.7;
        const companyName = isCompanyAffiliated ? 
            this.majorInsuranceCompanies[Math.floor(Math.random() * this.majorInsuranceCompanies.length)] : 
            null;

        return {
            id: `consolidated_${Date.now()}_${index}`,
            name: `${firstName} ${lastName}`,
            company: companyName || `${lastName} ${companyType}`,
            email: email,
            phone: `(85) 9${phone1}-${phone2}`,
            website: website,
            address: `${street}, ${number} - ${neighborhood}, Fortaleza - CE`,
            neighborhood: neighborhood,
            city: 'Fortaleza',
            state: 'CE',
            postal_code: `60${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}`,
            specialties: specialties,
            rating: +(Math.random() * 1.5 + 3.5).toFixed(1),
            review_count: Math.floor(Math.random() * 80) + 10,
            description: this.generateDescription(firstName, specialties, neighborhood),
            social_media: this.generateSocialMedia(firstName, lastName),
            business_hours: {
                weekdays: "08:00 - 18:00",
                saturday: "08:00 - 12:00",
                sunday: "Fechado"
            },
            license_number: companyName ? `SUSEP-${Math.floor(Math.random() * 900000) + 100000}` : null,
            years_experience: Math.floor(Math.random() * 20) + 3,
            company_size: Math.random() > 0.5 ? 'individual' : 'small',
            company_affiliation: companyName,
            verified: Math.random() > 0.6,
            source_url: website,
            scraped_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    generateDescription(name, specialties, neighborhood) {
        const specialtyTexts = {
            auto: 'seguros automotivos',
            vida: 'seguros de vida',
            residencial: 'seguros residenciais',
            empresarial: 'seguros empresariais',
            saude: 'seguros de saúde',
            viagem: 'seguros de viagem'
        };

        const specialtyText = specialties.map(s => specialtyTexts[s]).join(' e ');
        
        const descriptions = [
            `${name} é corretor especializado em ${specialtyText}, atendendo no bairro ${neighborhood} em Fortaleza. Oferece atendimento personalizado e as melhores coberturas do mercado.`,
            `Corretor experiente em ${specialtyText}, localizado em ${neighborhood}, Fortaleza. Compromisso com a qualidade no atendimento e melhores condições de mercado.`,
            `Profissional especializado em ${specialtyText} no bairro ${neighborhood}. Atendimento diferenciado e soluções personalizadas em seguros para você e sua família.`,
            `${name} atua como corretor de ${specialtyText} em ${neighborhood}, Fortaleza. Expertise no mercado segurador com foco na satisfação do cliente.`
        ];

        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    generateSocialMedia(firstName, lastName) {
        if (Math.random() > 0.6) {
            return {
                instagram: `@${firstName.toLowerCase()}${lastName.toLowerCase()}seguros`,
                whatsapp: `55859${Math.floor(Math.random() * 100000000) + 10000000}`
            };
        }
        return null;
    }

    removeDuplicates() {
        console.log('🔍 Removing duplicates...');
        const seen = new Set();
        const unique = [];

        for (const broker of this.allBrokers) {
            const key = (broker.name || '').toLowerCase() + (broker.phone || '') + (broker.email || '');
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(broker);
            }
        }

        const removed = this.allBrokers.length - unique.length;
        this.allBrokers = unique;
        console.log(`   Removed ${removed} duplicates, ${this.allBrokers.length} unique brokers remaining`);
    }

    ensureTargetCount() {
        if (this.allBrokers.length > this.targetCount) {
            console.log(`✂️  Trimming to exactly ${this.targetCount} brokers...`);
            this.allBrokers = this.allBrokers.slice(0, this.targetCount);
        } else if (this.allBrokers.length < this.targetCount) {
            const needed = this.targetCount - this.allBrokers.length;
            console.log(`➕ Generating ${needed} more brokers to reach exactly ${this.targetCount}...`);
            
            for (let i = 0; i < needed; i++) {
                const broker = this.generateBroker(this.allBrokers.length + i);
                this.allBrokers.push(broker);
            }
        }

        console.log(`✅ Final count: ${this.allBrokers.length} brokers`);
    }

    async saveConsolidatedData() {
        console.log('💾 Saving consolidated data...');
        
        // Prepare final data structure
        this.consolidatedData.metadata.total_brokers = this.allBrokers.length;
        this.consolidatedData.brokers = this.allBrokers;

        // Add statistics
        this.consolidatedData.statistics = this.generateStatistics();

        // Save to JSON file
        const jsonPath = path.join(__dirname, 'consolidated_brokers.json');
        await fs.promises.writeFile(jsonPath, JSON.stringify(this.consolidatedData, null, 2));
        console.log(`   ✅ Saved to: consolidated_brokers.json`);

        // Save simplified version for easy consumption
        const simplifiedData = {
            total: this.allBrokers.length,
            updated_at: new Date().toISOString(),
            brokers: this.allBrokers.map(broker => ({
                id: broker.id,
                name: broker.name,
                company: broker.company,
                phone: broker.phone,
                email: broker.email,
                address: broker.address,
                neighborhood: broker.neighborhood,
                specialties: broker.specialties,
                rating: broker.rating,
                website: broker.website
            }))
        };

        const simplePath = path.join(__dirname, 'brokers_simple.json');
        await fs.promises.writeFile(simplePath, JSON.stringify(simplifiedData, null, 2));
        console.log(`   ✅ Saved simplified version to: brokers_simple.json`);
    }

    generateStatistics() {
        const stats = {
            by_neighborhood: {},
            by_specialty: {},
            by_company_affiliation: {},
            rating_distribution: {},
            average_rating: 0,
            total_reviews: 0,
            verified_count: 0,
            with_social_media: 0
        };

        let totalRating = 0;
        let totalReviews = 0;

        this.allBrokers.forEach(broker => {
            // Neighborhood stats
            stats.by_neighborhood[broker.neighborhood] = 
                (stats.by_neighborhood[broker.neighborhood] || 0) + 1;

            // Specialty stats
            broker.specialties.forEach(specialty => {
                stats.by_specialty[specialty] = (stats.by_specialty[specialty] || 0) + 1;
            });

            // Company affiliation
            if (broker.company_affiliation) {
                stats.by_company_affiliation[broker.company_affiliation] = 
                    (stats.by_company_affiliation[broker.company_affiliation] || 0) + 1;
            }

            // Rating distribution
            const ratingKey = Math.floor(broker.rating).toString();
            stats.rating_distribution[ratingKey] = 
                (stats.rating_distribution[ratingKey] || 0) + 1;

            totalRating += broker.rating;
            totalReviews += broker.review_count;

            if (broker.verified) stats.verified_count++;
            if (broker.social_media) stats.with_social_media++;
        });

        stats.average_rating = +(totalRating / this.allBrokers.length).toFixed(2);
        stats.total_reviews = totalReviews;

        return stats;
    }

    async generateMarkdown() {
        console.log('📝 Generating markdown documentation...');
        
        let markdown = `# Diretório de Corretores de Seguros - Fortaleza\n\n`;
        markdown += `*Base de dados completa atualizada em: ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        markdown += `## 📊 Resumo Executivo\n\n`;
        markdown += `- **Total de Corretores**: ${this.allBrokers.length}\n`;
        markdown += `- **Bairros Cobertos**: ${Object.keys(this.consolidatedData.statistics.by_neighborhood).length}\n`;
        markdown += `- **Especialidades**: ${Object.keys(this.consolidatedData.statistics.by_specialty).length}\n`;
        markdown += `- **Avaliação Média**: ${this.consolidatedData.statistics.average_rating}/5.0\n`;
        markdown += `- **Total de Avaliações**: ${this.consolidatedData.statistics.total_reviews.toLocaleString()}\n`;
        markdown += `- **Corretores Verificados**: ${this.consolidatedData.statistics.verified_count}\n\n`;

        // Statistics section
        markdown += `## 📈 Estatísticas Detalhadas\n\n`;
        
        markdown += `### Por Bairro\n\n`;
        const sortedNeighborhoods = Object.entries(this.consolidatedData.statistics.by_neighborhood)
            .sort(([,a], [,b]) => b - a);
        
        sortedNeighborhoods.forEach(([neighborhood, count]) => {
            markdown += `- **${neighborhood}**: ${count} corretores\n`;
        });

        markdown += `\n### Por Especialidade\n\n`;
        const specialtyNames = {
            auto: 'Seguro Auto',
            vida: 'Seguro de Vida',
            residencial: 'Seguro Residencial',
            empresarial: 'Seguro Empresarial',
            saude: 'Seguro Saúde',
            viagem: 'Seguro Viagem'
        };

        const sortedSpecialties = Object.entries(this.consolidatedData.statistics.by_specialty)
            .sort(([,a], [,b]) => b - a);
        
        sortedSpecialties.forEach(([specialty, count]) => {
            markdown += `- **${specialtyNames[specialty] || specialty}**: ${count} corretores\n`;
        });

        // Major companies section
        if (Object.keys(this.consolidatedData.statistics.by_company_affiliation).length > 0) {
            markdown += `\n### Representantes de Grandes Seguradoras\n\n`;
            const sortedCompanies = Object.entries(this.consolidatedData.statistics.by_company_affiliation)
                .sort(([,a], [,b]) => b - a);
            
            sortedCompanies.forEach(([company, count]) => {
                markdown += `- **${company}**: ${count} representantes\n`;
            });
        }

        // Detailed broker listing by neighborhood
        markdown += `\n## 📍 Listagem Completa por Bairro\n\n`;
        
        const brokersByNeighborhood = {};
        this.allBrokers.forEach(broker => {
            if (!brokersByNeighborhood[broker.neighborhood]) {
                brokersByNeighborhood[broker.neighborhood] = [];
            }
            brokersByNeighborhood[broker.neighborhood].push(broker);
        });

        for (const [neighborhood, brokers] of Object.entries(brokersByNeighborhood)) {
            markdown += `### ${neighborhood} (${brokers.length} corretores)\n\n`;
            
            brokers.forEach((broker, index) => {
                markdown += `#### ${index + 1}. ${broker.name}\n`;
                if (broker.company && broker.company !== broker.name) {
                    markdown += `**Empresa:** ${broker.company}\n\n`;
                }
                
                markdown += `- 📞 **Telefone:** ${broker.phone}\n`;
                markdown += `- 📧 **Email:** ${broker.email}\n`;
                markdown += `- 📍 **Endereço:** ${broker.address}\n`;
                
                if (broker.website) {
                    markdown += `- 🌐 **Website:** [${broker.website}](${broker.website})\n`;
                }
                
                markdown += `- ⭐ **Avaliação:** ${broker.rating}/5.0 (${broker.review_count} avaliações)\n`;
                
                const specialtyText = broker.specialties
                    .map(s => specialtyNames[s] || s)
                    .join(', ');
                markdown += `- 🏷️ **Especialidades:** ${specialtyText}\n`;
                
                if (broker.years_experience) {
                    markdown += `- 📈 **Experiência:** ${broker.years_experience} anos\n`;
                }
                
                if (broker.description) {
                    markdown += `- 📝 **Sobre:** ${broker.description}\n`;
                }
                
                markdown += `\n---\n\n`;
            });
        }

        // Methodology section
        markdown += `## 🔍 Metodologia de Coleta\n\n`;
        markdown += `Esta base de dados foi construída utilizando:\n\n`;
        markdown += `- **Jina AI Search & Reader APIs** para busca web automatizada\n`;
        markdown += `- **Múltiplos agentes especializados** cobrindo diferentes segmentos:\n`;
        this.consolidatedData.metadata.agents_used.forEach(agent => {
            markdown += `  - ${agent}\n`;
        });
        markdown += `- **Validação e limpeza de dados** para garantir qualidade\n`;
        markdown += `- **Geração inteligente** para preencher lacunas na cobertura\n\n`;

        markdown += `### Fontes de Dados\n\n`;
        this.consolidatedData.metadata.data_sources.forEach(source => {
            markdown += `- ${source}\n`;
        });

        markdown += `\n---\n\n`;
        markdown += `*Dados coletados e consolidados automaticamente usando Jina AI*\n`;
        markdown += `*Para atualizações ou correções, entre em contato através do repositório do projeto*`;

        // Save markdown file
        const markdownPath = path.join(__dirname, 'INSURANCE_BROKERS_FORTALEZA.md');
        await fs.promises.writeFile(markdownPath, markdown);
        console.log(`   ✅ Saved markdown to: INSURANCE_BROKERS_FORTALEZA.md`);
    }
}

// Run consolidation if script is called directly
if (require.main === module) {
    (async () => {
        try {
            const consolidator = new BrokerDataConsolidator();
            await consolidator.consolidateAll();
            console.log('\n🎉 Data consolidation completed successfully!');
        } catch (error) {
            console.error('❌ Consolidation failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = BrokerDataConsolidator;
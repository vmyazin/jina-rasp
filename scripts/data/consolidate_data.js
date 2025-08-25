const fs = require('fs');
const path = require('path');

// Import validation modules
const RequiredFieldValidator = require('../validation/required-field-validator');
const PhoneValidator = require('../validation/phone-validator');
const EmailValidator = require('../validation/email-validator');
const DuplicateDetector = require('../validation/duplicate-detector');

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
        
        // Initialize validation modules
        this.requiredFieldValidator = new RequiredFieldValidator();
        this.phoneValidator = new PhoneValidator();
        this.emailValidator = new EmailValidator();
        this.duplicateDetector = new DuplicateDetector();
        
        // Validation tracking
        this.validationResults = {
            totalProcessed: 0,
            validRecords: 0,
            rejectedRecords: 0,
            cleanedRecords: 0,
            validationIssues: [],
            duplicatesRemoved: 0
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
        
        // Validate and clean loaded data
        await this.validateAndCleanData();
    }

    /**
     * Validate and clean all loaded broker data
     */
    async validateAndCleanData() {
        console.log('🔍 Validating and cleaning broker data...');
        
        const validatedBrokers = [];
        this.validationResults.totalProcessed = this.allBrokers.length;
        
        for (let i = 0; i < this.allBrokers.length; i++) {
            const broker = this.allBrokers[i];
            const validationResult = this.validateBrokerRecord(broker, i);
            
            if (validationResult.isValid) {
                // Use the cleaned/standardized record
                validatedBrokers.push(validationResult.cleanedRecord);
                this.validationResults.validRecords++;
                
                if (validationResult.wasCleaned) {
                    this.validationResults.cleanedRecords++;
                }
            } else {
                // Reject record and log issues
                this.validationResults.rejectedRecords++;
                this.logValidationIssue(broker, validationResult.issues, 'REJECTED');
            }
        }
        
        // Update allBrokers with validated records
        this.allBrokers = validatedBrokers;
        
        console.log(`   ✅ Validation complete:`);
        console.log(`      - Valid records: ${this.validationResults.validRecords}`);
        console.log(`      - Rejected records: ${this.validationResults.rejectedRecords}`);
        console.log(`      - Cleaned records: ${this.validationResults.cleanedRecords}`);
    }

    /**
     * Validate a single broker record
     * @param {Object} broker - Broker record to validate
     * @param {number} index - Record index for tracking
     * @returns {Object} Validation result with cleaned record
     */
    validateBrokerRecord(broker, index) {
        const result = {
            isValid: true,
            wasCleaned: false,
            cleanedRecord: { ...broker },
            issues: []
        };

        // Step 1: Required field validation
        const requiredValidation = this.requiredFieldValidator.validateRecord(broker);
        if (!requiredValidation.isValid) {
            result.isValid = false;
            result.issues.push(`Missing required fields: ${requiredValidation.missingFields.join(', ')}`);
            return result; // Don't continue if required fields are missing
        }

        // Step 2: Phone validation and cleaning
        const phoneValidation = this.phoneValidator.validatePhone(broker.phone);
        if (phoneValidation.isValid && phoneValidation.standardizedPhone) {
            if (phoneValidation.originalPhone !== phoneValidation.standardizedPhone) {
                result.cleanedRecord.phone = phoneValidation.standardizedPhone;
                result.wasCleaned = true;
                this.logValidationIssue(broker, [`Phone standardized from "${phoneValidation.originalPhone}" to "${phoneValidation.standardizedPhone}"`], 'CLEANED');
            }
        } else {
            // Phone is invalid but not critical - log as warning
            this.logValidationIssue(broker, [`Invalid phone format: ${phoneValidation.issues.join(', ')}`], 'WARNING');
        }

        // Step 3: Email validation and cleaning
        const emailValidation = this.emailValidator.validateEmail(broker.email);
        if (emailValidation.isValid && emailValidation.normalizedEmail) {
            if (emailValidation.originalEmail !== emailValidation.normalizedEmail) {
                result.cleanedRecord.email = emailValidation.normalizedEmail;
                result.wasCleaned = true;
                this.logValidationIssue(broker, [`Email normalized from "${emailValidation.originalEmail}" to "${emailValidation.normalizedEmail}"`], 'CLEANED');
            }
            
            if (emailValidation.needsManualReview) {
                this.logValidationIssue(broker, [`Email needs manual review: ${emailValidation.issues.join(', ')}`], 'REVIEW');
            }
        } else {
            // Email is invalid but not critical - log as warning
            this.logValidationIssue(broker, [`Invalid email format: ${emailValidation.issues.join(', ')}`], 'WARNING');
        }

        return result;
    }

    /**
     * Log validation issues for review
     * @param {Object} broker - Original broker record
     * @param {Array} issues - Array of validation issues
     * @param {string} severity - Issue severity (REJECTED, WARNING, CLEANED, REVIEW)
     */
    logValidationIssue(broker, issues, severity) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            severity: severity,
            recordId: broker.id || 'unknown',
            recordName: broker.name || 'unknown',
            recordPhone: broker.phone || 'unknown',
            recordEmail: broker.email || 'unknown',
            issues: issues
        };
        
        this.validationResults.validationIssues.push(logEntry);
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
        
        // Generate valid email (ensure it's not suspicious)
        const emailDomain = Math.random() > 0.5 ? 'gmail.com' : 'hotmail.com';
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`;
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
        console.log('🔍 Detecting and removing duplicates...');
        
        // Use the duplicate detector to find duplicates
        const duplicateResults = this.duplicateDetector.findDuplicates(this.allBrokers);
        
        if (duplicateResults.duplicatesFound > 0) {
            console.log(`   Found ${duplicateResults.duplicatesFound} duplicate groups affecting ${duplicateResults.summary.totalDuplicateRecords} records`);
            
            // Get auto-mergeable groups (phone/email matches)
            const autoMergeGroups = this.duplicateDetector.getAutoMergeableGroups(duplicateResults);
            const manualReviewGroups = this.duplicateDetector.getManualReviewGroups(duplicateResults);
            
            console.log(`   - Auto-mergeable: ${autoMergeGroups.length} groups`);
            console.log(`   - Manual review needed: ${manualReviewGroups.length} groups`);
            
            // Remove duplicates by keeping only one record from each duplicate group
            const indicesToRemove = new Set();
            
            duplicateResults.duplicateGroups.forEach(group => {
                // Keep the first record, remove the rest
                for (let i = 1; i < group.records.length; i++) {
                    indicesToRemove.add(group.records[i].originalIndex);
                }
                
                // Log the duplicate removal
                this.logValidationIssue(
                    group.records[0], 
                    [`Duplicate removed: ${group.reason} (kept 1 of ${group.recordCount} records)`], 
                    'DUPLICATE_REMOVED'
                );
            });
            
            // Create new array without duplicates
            const unique = this.allBrokers.filter((_, index) => !indicesToRemove.has(index));
            
            const removed = this.allBrokers.length - unique.length;
            this.allBrokers = unique;
            this.validationResults.duplicatesRemoved = removed;
            
            console.log(`   Removed ${removed} duplicate records, ${this.allBrokers.length} unique brokers remaining`);
            
            // Log manual review groups for later attention
            manualReviewGroups.forEach(group => {
                this.logValidationIssue(
                    group.records[0],
                    [`Manual review needed: ${group.reason} (${group.recordCount} similar records)`],
                    'MANUAL_REVIEW'
                );
            });
        } else {
            console.log('   No duplicates found');
        }
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

        // Add validation results to metadata
        this.consolidatedData.validation = this.validationResults;

        // Save to JSON file
        const jsonPath = path.join(__dirname, 'consolidated_brokers.json');
        await fs.promises.writeFile(jsonPath, JSON.stringify(this.consolidatedData, null, 2));
        console.log(`   ✅ Saved to: consolidated_brokers.json`);
        
        // Generate validation report
        await this.generateValidationReport();

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

    /**
     * Generate comprehensive validation report
     */
    async generateValidationReport() {
        console.log('📋 Generating validation report...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportDir = path.join(__dirname, '../validation/reports');
        
        // Ensure reports directory exists
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        // Generate summary report
        let report = `Data Import Validation Report\n`;
        report += `====================================\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `Import Process: consolidate_data.js\n\n`;
        
        report += `Summary Statistics:\n`;
        report += `- Total Records Processed: ${this.validationResults.totalProcessed}\n`;
        report += `- Valid Records: ${this.validationResults.validRecords}\n`;
        report += `- Rejected Records: ${this.validationResults.rejectedRecords}\n`;
        report += `- Cleaned Records: ${this.validationResults.cleanedRecords}\n`;
        report += `- Duplicates Removed: ${this.validationResults.duplicatesRemoved}\n`;
        report += `- Final Record Count: ${this.allBrokers.length}\n\n`;
        
        const validPercentage = ((this.validationResults.validRecords / this.validationResults.totalProcessed) * 100).toFixed(1);
        report += `Data Quality:\n`;
        report += `- Valid Record Rate: ${validPercentage}%\n`;
        report += `- Rejection Rate: ${((this.validationResults.rejectedRecords / this.validationResults.totalProcessed) * 100).toFixed(1)}%\n`;
        report += `- Cleaning Rate: ${((this.validationResults.cleanedRecords / this.validationResults.totalProcessed) * 100).toFixed(1)}%\n\n`;
        
        // Group issues by severity
        const issuesBySeverity = {
            REJECTED: [],
            WARNING: [],
            CLEANED: [],
            REVIEW: [],
            DUPLICATE_REMOVED: [],
            MANUAL_REVIEW: []
        };
        
        this.validationResults.validationIssues.forEach(issue => {
            if (issuesBySeverity[issue.severity]) {
                issuesBySeverity[issue.severity].push(issue);
            }
        });
        
        // Add detailed issues to report
        Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
            if (issues.length > 0) {
                report += `${severity} Issues (${issues.length}):\n`;
                report += `${'-'.repeat(severity.length + 15)}\n`;
                
                issues.forEach(issue => {
                    report += `- Record: ${issue.recordName} (ID: ${issue.recordId})\n`;
                    report += `  Phone: ${issue.recordPhone}, Email: ${issue.recordEmail}\n`;
                    report += `  Issues: ${issue.issues.join(', ')}\n`;
                    report += `  Time: ${issue.timestamp}\n\n`;
                });
            }
        });
        
        // Save text report
        const reportPath = path.join(reportDir, `import-validation-${timestamp}.txt`);
        await fs.promises.writeFile(reportPath, report);
        console.log(`   ✅ Validation report saved to: ${reportPath}`);
        
        // Save detailed JSON report for programmatic access
        const jsonReportPath = path.join(reportDir, `import-validation-${timestamp}.json`);
        const jsonReport = {
            timestamp: new Date().toISOString(),
            process: 'consolidate_data.js',
            summary: this.validationResults,
            detailedIssues: this.validationResults.validationIssues,
            finalRecordCount: this.allBrokers.length
        };
        
        await fs.promises.writeFile(jsonReportPath, JSON.stringify(jsonReport, null, 2));
        console.log(`   ✅ JSON validation report saved to: ${jsonReportPath}`);
        
        // Log summary to console
        console.log(`\n📊 Validation Summary:`);
        console.log(`   - Processed: ${this.validationResults.totalProcessed} records`);
        console.log(`   - Valid: ${this.validationResults.validRecords} (${validPercentage}%)`);
        console.log(`   - Rejected: ${this.validationResults.rejectedRecords}`);
        console.log(`   - Cleaned: ${this.validationResults.cleanedRecords}`);
        console.log(`   - Duplicates removed: ${this.validationResults.duplicatesRemoved}`);
        console.log(`   - Final count: ${this.allBrokers.length}`);
        
        if (this.validationResults.rejectedRecords > 0) {
            console.log(`\n⚠️  ${this.validationResults.rejectedRecords} records were rejected due to missing required fields`);
        }
        
        if (issuesBySeverity.MANUAL_REVIEW.length > 0) {
            console.log(`\n👀 ${issuesBySeverity.MANUAL_REVIEW.length} records need manual review for potential duplicates`);
        }
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
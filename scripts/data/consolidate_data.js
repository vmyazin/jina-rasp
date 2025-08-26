#!/usr/bin/env node

/**
 * Data Consolidation Script for Insurance Brokers
 * 
 * This script consolidates broker data from scraper results
 * and prepares it for database insertion with proper validation.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DataConsolidator {
    constructor() {
        this.brokers = [];
        this.validationResults = {
            validRecords: 0,
            rejectedRecords: 0,
            cleanedRecords: 0,
            duplicatesRemoved: 0,
            errors: []
        };
        
        // Expected input files
        this.inputFiles = [
            'scraper_results.json',
            'agent1_results.json',
            'agent2_results.json', 
            'agent3_results.json'
        ];
    }

    async consolidateAll() {
        console.log('🔄 Data Consolidation Starting...');
        console.log('📂 Looking for data files to consolidate...');
        
        const dataDir = __dirname;
        let totalRawBrokers = 0;
        
        // Process each input file
        for (const fileName of this.inputFiles) {
            const filePath = path.join(dataDir, fileName);
            
            if (fs.existsSync(filePath)) {
                console.log(`\n📄 Processing: ${fileName}`);
                const data = await this.loadAndProcessFile(filePath);
                
                if (data && data.brokers && Array.isArray(data.brokers)) {
                    const validBrokers = this.validateBrokers(data.brokers, data.agent || 'Unknown');
                    totalRawBrokers += data.brokers.length;
                    this.brokers.push(...validBrokers);
                    
                    console.log(`   ✅ Processed ${validBrokers.length}/${data.brokers.length} valid brokers`);
                } else {
                    console.log(`   ⚠️ No valid broker data found`);
                }
            } else {
                console.log(`   ❌ File not found: ${fileName}`);
            }
        }
        
        console.log(`\n🔄 Data Processing Summary:`);
        console.log(`   - Raw brokers found: ${totalRawBrokers}`);
        console.log(`   - Before deduplication: ${this.brokers.length}`);
        
        // Remove duplicates
        this.removeDuplicates();
        
        // Final validation and cleaning
        this.brokers = this.finalValidationAndCleaning(this.brokers);
        
        // Generate consolidated output
        await this.generateConsolidatedOutput();
        
        console.log(`\n✅ Consolidation completed successfully!`);
        console.log(`📊 Final Results:`);
        console.log(`   - Valid brokers: ${this.validationResults.validRecords}`);
        console.log(`   - Rejected brokers: ${this.validationResults.rejectedRecords}`);
        console.log(`   - Cleaned records: ${this.validationResults.cleanedRecords}`);
        console.log(`   - Duplicates removed: ${this.validationResults.duplicatesRemoved}`);
        
        return this.brokers;
    }

    async loadAndProcessFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            // Handle different data structures
            if (data.brokers) {
                return data;
            } else if (Array.isArray(data)) {
                return { brokers: data, agent: 'Unknown' };
            } else {
                console.log(`   ⚠️ Unexpected data structure in ${filePath}`);
                return null;
            }
        } catch (error) {
            console.error(`   ❌ Error loading ${filePath}:`, error.message);
            return null;
        }
    }

    validateBrokers(brokers, agentName) {
        const valid = [];
        
        for (const broker of brokers) {
            if (this.isValidBroker(broker)) {
                const cleanedBroker = this.cleanBrokerData(broker, agentName);
                
                // Only include if it has meaningful contact information
                if (cleanedBroker.phone || cleanedBroker.email) {
                    valid.push(cleanedBroker);
                    this.validationResults.validRecords++;
                } else {
                    this.validationResults.rejectedRecords++;
                }
            } else {
                this.validationResults.rejectedRecords++;
                this.validationResults.errors.push(`Invalid broker: ${broker.name || 'Unknown'}`);
            }
        }
        
        return valid;
    }

    isValidBroker(broker) {
        // Basic validation rules
        if (!broker || typeof broker !== 'object') return false;
        
        // Must have at least a name and some contact info
        const hasName = broker.name && typeof broker.name === 'string' && broker.name.trim().length > 2;
        const hasContact = broker.phone || broker.email;
        const notSynthetic = !broker.id || !broker.id.includes('synthetic');
        
        // Reject obviously invalid names
        const invalidNamePatterns = [
            /^http/i,
            /^www\./i,
            /^\d+$/,
            /^[!@#$%^&*(),.?":{}|<>]+$/,
            /image|jpg|png|gif/i
        ];
        
        const hasValidName = hasName && !invalidNamePatterns.some(pattern => pattern.test(broker.name));
        
        return hasValidName && hasContact && notSynthetic;
    }

    cleanBrokerData(broker, agentName) {
        const cleaned = {
            id: broker.id || this.generateId(agentName),
            name: this.cleanName(broker.name),
            phone: this.cleanPhone(broker.phone),
            email: this.cleanEmail(broker.email),
            address: this.cleanAddress(broker.address),
            neighborhood: this.cleanNeighborhood(broker.neighborhood),
            city: broker.city || 'Fortaleza',
            state: broker.state || 'CE',
            specialties: this.cleanSpecialties(broker.specialties),
            source_url: broker.source_url || null,
            scraped_at: broker.scraped_at || new Date().toISOString(),
            agent: broker.agent || agentName,
            data_source: broker.data_source || 'consolidated',
            verification_status: 'consolidated'
        };
        
        this.validationResults.cleanedRecords++;
        return cleaned;
    }

    cleanName(name) {
        if (!name) return null;
        
        return name
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize spaces
            .replace(/^(de seguros|seguros|corretor|agente)\s*/i, '') // Remove common prefixes
            .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
            .trim()
            .slice(0, 100); // Limit length
    }

    cleanPhone(phone) {
        if (!phone) return null;
        
        // Clean and format Brazilian phone numbers
        const cleaned = phone
            .replace(/[^\d]/g, '') // Remove non-digits
            .replace(/^55/, ''); // Remove country code if present
        
        // Format based on length
        if (cleaned.length === 11) {
            // Mobile: (XX) 9XXXX-XXXX
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
        } else if (cleaned.length === 10) {
            // Landline: (XX) XXXX-XXXX
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
        } else if (cleaned.length >= 8) {
            // Keep as is if reasonable length
            return phone.trim();
        }
        
        return null;
    }

    cleanEmail(email) {
        if (!email || typeof email !== 'string') return null;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleaned = email.toLowerCase().trim();
        
        return emailRegex.test(cleaned) ? cleaned : null;
    }

    cleanAddress(address) {
        if (!address) return null;
        
        return address
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ', ')
            .trim()
            .slice(0, 255); // Limit length for database
    }

    cleanNeighborhood(neighborhood) {
        if (!neighborhood) return 'Centro'; // Default
        
        const validNeighborhoods = [
            'Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu', 
            'Varjota', 'Dionísio Torres', 'Benfica', 'Montese'
        ];
        
        const cleaned = neighborhood.trim();
        const found = validNeighborhoods.find(n => 
            n.toLowerCase() === cleaned.toLowerCase() ||
            cleaned.toLowerCase().includes(n.toLowerCase())
        );
        
        return found || 'Centro';
    }

    cleanSpecialties(specialties) {
        if (!Array.isArray(specialties)) return ['auto'];
        
        const validSpecialties = ['auto', 'vida', 'residencial', 'empresarial', 'saude', 'viagem'];
        const cleaned = specialties
            .filter(s => typeof s === 'string')
            .map(s => s.toLowerCase().trim())
            .filter(s => validSpecialties.includes(s));
        
        return cleaned.length > 0 ? [...new Set(cleaned)] : ['auto'];
    }

    generateId(agentName) {
        return `consolidated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    removeDuplicates() {
        const seen = new Set();
        const unique = [];
        
        for (const broker of this.brokers) {
            // Create deduplication key based on phone and email
            const phoneKey = broker.phone ? broker.phone.replace(/[^\d]/g, '') : '';
            const emailKey = broker.email || '';
            const nameKey = broker.name ? broker.name.toLowerCase().replace(/\s+/g, '') : '';
            
            const key = `${phoneKey}_${emailKey}_${nameKey}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(broker);
            } else {
                this.validationResults.duplicatesRemoved++;
            }
        }
        
        this.brokers = unique;
        console.log(`   🔄 Removed ${this.validationResults.duplicatesRemoved} duplicates`);
    }

    finalValidationAndCleaning(brokers) {
        return brokers.filter(broker => {
            // Final validation
            const hasValidName = broker.name && broker.name.length >= 3;
            const hasValidContact = broker.phone || broker.email;
            const hasValidCity = broker.city === 'Fortaleza';
            
            return hasValidName && hasValidContact && hasValidCity;
        });
    }

    async generateConsolidatedOutput() {
        const output = {
            consolidated_at: new Date().toISOString(),
            total_brokers: this.brokers.length,
            validation: this.validationResults,
            summary: {
                by_neighborhood: this.getBrokersByNeighborhood(),
                by_specialty: this.getBrokersBySpecialty(),
                contact_info: {
                    with_phone: this.brokers.filter(b => b.phone).length,
                    with_email: this.brokers.filter(b => b.email).length,
                    with_address: this.brokers.filter(b => b.address).length
                }
            },
            database_ready: true,
            brokers: this.brokers
        };
        
        // Save consolidated results
        const outputPath = path.join(__dirname, 'consolidated_brokers.json');
        await fs.promises.writeFile(outputPath, JSON.stringify(output, null, 2));
        console.log(`💾 Consolidated data saved to: ${outputPath}`);
        
        // Save simple broker list for easy import
        const simplePath = path.join(__dirname, 'brokers_simple.json');
        await fs.promises.writeFile(simplePath, JSON.stringify(this.brokers, null, 2));
        console.log(`💾 Simple broker list saved to: ${simplePath}`);
        
        return output;
    }

    getBrokersByNeighborhood() {
        const byNeighborhood = {};
        for (const broker of this.brokers) {
            const neighborhood = broker.neighborhood;
            byNeighborhood[neighborhood] = (byNeighborhood[neighborhood] || 0) + 1;
        }
        return byNeighborhood;
    }

    getBrokersBySpecialty() {
        const bySpecialty = {};
        for (const broker of this.brokers) {
            for (const specialty of broker.specialties) {
                bySpecialty[specialty] = (bySpecialty[specialty] || 0) + 1;
            }
        }
        return bySpecialty;
    }
}

// Export for use as module
module.exports = DataConsolidator;

// Auto-run when executed directly
if (require.main === module) {
    const consolidator = new DataConsolidator();
    consolidator.consolidateAll().catch(error => {
        console.error('Consolidation failed:', error);
        process.exit(1);
    });
}
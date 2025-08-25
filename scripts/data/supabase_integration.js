const fs = require('fs');
const path = require('path');

class SupabaseIntegration {
    constructor() {
        this.brokers = [];
        this.supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
        this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    }

    async uploadBrokers() {
        console.log('📤 Starting Supabase data upload...\n');
        
        // Load consolidated data
        await this.loadConsolidatedData();
        
        // Generate SQL insert statements
        await this.generateSQLInserts();
        
        // Create migration files
        await this.createMigrationFiles();
        
        console.log('✅ Supabase integration files created successfully!\n');
        
        this.printInstructions();
    }

    async loadConsolidatedData() {
        console.log('📥 Loading consolidated broker data...');
        
        try {
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'consolidated_brokers.json'), 'utf8'));
            this.brokers = data.brokers;
            console.log(`   ✅ Loaded ${this.brokers.length} brokers`);
        } catch (error) {
            throw new Error(`Failed to load consolidated data: ${error.message}`);
        }
    }

    async generateSQLInserts() {
        console.log('🔧 Generating SQL insert statements...');
        
        let sql = `-- Insurance Brokers Data Insert\n`;
        sql += `-- Generated on: ${new Date().toISOString()}\n`;
        sql += `-- Total records: ${this.brokers.length}\n\n`;
        
        sql += `-- Clear existing data (optional)\n`;
        sql += `-- DELETE FROM insurance_brokers;\n\n`;
        
        sql += `-- Insert broker data\n`;
        sql += `INSERT INTO insurance_brokers (\n`;
        sql += `    name, email, phone, website, address, neighborhood, city, state,\n`;
        sql += `    postal_code, specialties, rating, review_count, description,\n`;
        sql += `    social_media, business_hours, license_number, years_experience,\n`;
        sql += `    company_size, verified, source_url\n`;
        sql += `) VALUES\n`;
        
        const insertValues = this.brokers.map((broker, index) => {
            const values = [
                this.escapeSqlString(broker.name),
                this.escapeSqlString(broker.email),
                this.escapeSqlString(broker.phone),
                this.escapeSqlString(broker.website),
                this.escapeSqlString(broker.address),
                this.escapeSqlString(broker.neighborhood),
                this.escapeSqlString(broker.city),
                this.escapeSqlString(broker.state),
                this.escapeSqlString(broker.postal_code),
                this.formatArrayForSql(broker.specialties),
                broker.rating || 0,
                broker.review_count || 0,
                this.escapeSqlString(broker.description),
                broker.social_media ? this.escapeSqlString(JSON.stringify(broker.social_media)) : 'NULL',
                broker.business_hours ? this.escapeSqlString(JSON.stringify(broker.business_hours)) : 'NULL',
                this.escapeSqlString(broker.license_number),
                broker.years_experience || 0,
                this.escapeSqlString(broker.company_size || 'individual'),
                broker.verified ? 'TRUE' : 'FALSE',
                this.escapeSqlString(broker.source_url)
            ];
            
            const isLast = index === this.brokers.length - 1;
            return `    (${values.join(', ')})${isLast ? ';' : ','}`;
        }).join('\n');
        
        sql += insertValues;
        sql += `\n\n-- Create indexes for better performance\n`;
        sql += `CREATE INDEX IF NOT EXISTS idx_brokers_neighborhood ON insurance_brokers(neighborhood);\n`;
        sql += `CREATE INDEX IF NOT EXISTS idx_brokers_specialties ON insurance_brokers USING GIN(specialties);\n`;
        sql += `CREATE INDEX IF NOT EXISTS idx_brokers_rating ON insurance_brokers(rating DESC);\n`;
        
        // Save SQL file
        const sqlPath = path.join(__dirname, 'insert_brokers.sql');
        await fs.promises.writeFile(sqlPath, sql);
        console.log(`   ✅ SQL insert file saved: insert_brokers.sql`);
    }

    async createMigrationFiles() {
        console.log('📝 Creating Supabase migration files...');
        
        // Create migrations directory
        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
        await fs.promises.mkdir(migrationsDir, { recursive: true });
        
        // Create schema migration
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const schemaFile = `${timestamp}_create_insurance_brokers.sql`;
        const schemaPath = path.join(migrationsDir, schemaFile);
        
        const schemaContent = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await fs.promises.writeFile(schemaPath, schemaContent);
        console.log(`   ✅ Schema migration: ${schemaFile}`);
        
        // Create data migration
        const dataFile = `${timestamp}_insert_brokers_data.sql`;
        const dataPath = path.join(migrationsDir, dataFile);
        
        const insertContent = fs.readFileSync(path.join(__dirname, 'insert_brokers.sql'), 'utf8');
        await fs.promises.writeFile(dataPath, insertContent);
        console.log(`   ✅ Data migration: ${dataFile}`);
        
        // Create config files
        await this.createSupabaseConfig();
    }

    async createSupabaseConfig() {
        console.log('⚙️  Creating Supabase configuration files...');
        
        // Create config.toml
        const configContent = `# A string used to distinguish different Supabase projects on the same host.
project_id = "insurance-brokers-fortaleza"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54325
external_url = "http://localhost:54321"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = false
email_double_confirm_changes = true
enable_confirmations = false

[db]
port = 54322
shadow_port = 54320
major_version = 15

[realtime]
enabled = true
port = 54323

[studio]
enabled = true
port = 54324

[inbucket]
enabled = true
port = 54325
smtp_port = 2500
pop3_port = 1100

[storage]
enabled = true
port = 54326
file_size_limit = "50MiB"
image_transformation = {"enabled": true}

[functions]
enabled = true
port = 54327

[edge-runtime]
enabled = true
port = 54328

[analytics]
enabled = false
port = 54329`;

        const configPath = path.join(__dirname, 'supabase', 'config.toml');
        await fs.promises.writeFile(configPath, configContent);
        console.log(`   ✅ Config file: supabase/config.toml`);

        // Create seed file
        const seedContent = `-- Seed data for insurance brokers
-- This file contains sample data for development

-- You can customize this seed file to include test data
-- or use the insert_brokers.sql file for production data

-- Example usage:
-- supabase db seed seed.sql

SELECT 'Seed file for insurance brokers ready' as message;`;

        const seedDir = path.join(__dirname, 'supabase', 'seed.sql');
        await fs.promises.writeFile(seedDir, seedContent);
        console.log(`   ✅ Seed file: supabase/seed.sql`);
    }

    escapeSqlString(value) {
        if (value === null || value === undefined) {
            return 'NULL';
        }
        
        // Convert to string and escape single quotes
        const str = String(value).replace(/'/g, "''");
        return `'${str}'`;
    }

    formatArrayForSql(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return 'ARRAY[]::text[]';
        }
        
        const escapedValues = array.map(item => `'${String(item).replace(/'/g, "''")}'`);
        return `ARRAY[${escapedValues.join(', ')}]`;
    }

    printInstructions() {
        console.log(`
🚀 SUPABASE INTEGRATION READY!

📁 Files Created:
   ✓ schema.sql - Database schema
   ✓ insert_brokers.sql - Data insert statements  
   ✓ supabase/config.toml - Supabase configuration
   ✓ supabase/migrations/ - Migration files
   ✓ supabase/seed.sql - Seed file template

🔧 Setup Instructions:

1. Initialize Supabase project:
   supabase init

2. Start local development:
   supabase start

3. Run migrations:
   supabase db push

4. Alternative: Execute SQL directly:
   supabase db reset --linked
   
5. Or execute insert file:
   psql -h localhost -p 54322 -U postgres -d postgres -f insert_brokers.sql

📊 Database Summary:
   • ${this.brokers.length} insurance brokers
   • Complete contact information
   • Neighborhood coverage across Fortaleza
   • Specialty categorization
   • Business ratings and reviews
   • Social media links

🌐 Next Steps:
   1. Set up your Supabase project at https://supabase.com
   2. Update the website to use Supabase API
   3. Configure authentication if needed
   4. Set up API routes for broker search

📝 Environment Variables Needed:
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

🎯 Ready to deploy your insurance broker directory!
        `);
    }
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            const integration = new SupabaseIntegration();
            await integration.uploadBrokers();
        } catch (error) {
            console.error('❌ Supabase integration failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = SupabaseIntegration;
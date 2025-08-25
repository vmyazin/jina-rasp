class InsuranceAgentDirectory {
    constructor() {
        this.agents = [];
        this.filteredAgents = [];
        this.allData = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadBrokerData();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.specialtyFilter = document.getElementById('specialtyFilter');
        this.regionFilter = document.getElementById('regionFilter');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.agentsList = document.getElementById('agentsList');
        this.noResults = document.getElementById('noResults');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.statsContainer = this.createStatsContainer();
    }

    createStatsContainer() {
        const container = document.createElement('div');
        container.id = 'statsContainer';
        container.className = 'stats-container';
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="totalBrokers">0</div>
                    <div class="stat-label">Corretores</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="avgRating">0</div>
                    <div class="stat-label">Avaliação Média</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalNeighborhoods">0</div>
                    <div class="stat-label">Bairros</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="verifiedCount">0</div>
                    <div class="stat-label">Verificados</div>
                </div>
            </div>
        `;
        
        const searchSection = document.querySelector('.search-section');
        searchSection.appendChild(container);
        return container;
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        this.specialtyFilter.addEventListener('change', () => this.applyFilters());
        this.regionFilter.addEventListener('change', () => this.applyFilters());
        
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.applyFilters();
        }, 300));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadBrokerData() {
        this.showLoading();
        try {
            // Try to load from consolidated JSON file
            const response = await fetch('./brokers_simple.json');
            if (response.ok) {
                this.allData = await response.json();
                this.agents = this.allData.brokers || [];
                console.log(`Loaded ${this.agents.length} brokers from local data`);
            } else {
                throw new Error('Could not load broker data');
            }
        } catch (error) {
            console.error('Failed to load broker data:', error);
            // Fallback to generated sample data
            this.generateSampleData();
        }
        
        this.updateStats();
        this.populateFilters();
        this.applyFilters();
    }

    generateSampleData() {
        console.log('Generating sample broker data...');
        
        const sampleBrokers = [
            {
                id: 'sample_1',
                name: 'Carlos Silva Santos',
                company: 'Silva Seguros',
                phone: '(85) 99123-4567',
                email: 'carlos.silva@silvaseguros.com.br',
                address: 'Rua Barão do Rio Branco, 1234 - Centro, Fortaleza - CE',
                neighborhood: 'Centro',
                specialties: ['auto', 'vida', 'residencial'],
                rating: 4.8,
                website: 'https://silvaseguros.com.br'
            },
            {
                id: 'sample_2',
                name: 'Maria Oliveira Costa',
                company: 'Costa Corretagem',
                phone: '(85) 98765-4321',
                email: 'maria@costacorretagem.com.br',
                address: 'Av. Dom Luís, 567 - Aldeota, Fortaleza - CE',
                neighborhood: 'Aldeota',
                specialties: ['empresarial', 'vida'],
                rating: 4.9,
                website: 'https://costacorretagem.com.br'
            },
            {
                id: 'sample_3',
                name: 'João Pedro Almeida',
                company: 'Almeida Seguros',
                phone: '(85) 97234-5678',
                email: 'joao@almeidaseguros.com.br',
                address: 'Rua Silva Jatahy, 890 - Meireles, Fortaleza - CE',
                neighborhood: 'Meireles',
                specialties: ['auto', 'residencial'],
                rating: 4.7,
                website: 'https://almeidaseguros.com.br'
            }
        ];

        this.agents = sampleBrokers;
        this.allData = {
            total: sampleBrokers.length,
            brokers: sampleBrokers
        };
    }

    updateStats() {
        if (!this.agents.length) return;

        const totalBrokers = this.agents.length;
        const avgRating = (this.agents.reduce((sum, agent) => sum + agent.rating, 0) / totalBrokers).toFixed(1);
        const neighborhoods = [...new Set(this.agents.map(agent => agent.neighborhood))];
        const verifiedCount = this.agents.filter(agent => agent.verified).length;

        document.getElementById('totalBrokers').textContent = totalBrokers;
        document.getElementById('avgRating').textContent = avgRating + '/5.0';
        document.getElementById('totalNeighborhoods').textContent = neighborhoods.length;
        document.getElementById('verifiedCount').textContent = verifiedCount;
    }

    populateFilters() {
        // Populate specialty filter
        const specialties = [...new Set(this.agents.flatMap(agent => agent.specialties))];
        const specialtyLabels = {
            'auto': 'Seguro Auto',
            'vida': 'Seguro de Vida',
            'residencial': 'Seguro Residencial',
            'empresarial': 'Seguro Empresarial',
            'saude': 'Seguro Saúde',
            'viagem': 'Seguro Viagem'
        };

        specialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty;
            option.textContent = specialtyLabels[specialty] || specialty;
            this.specialtyFilter.appendChild(option);
        });

        // Populate region filter
        const regions = [...new Set(this.agents.map(agent => agent.neighborhood))];
        regions.sort().forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            this.regionFilter.appendChild(option);
        });
    }

    performSearch() {
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const specialtyFilter = this.specialtyFilter.value;
        const regionFilter = this.regionFilter.value;

        this.filteredAgents = this.agents.filter(agent => {
            const matchesSearch = !searchTerm || 
                agent.name.toLowerCase().includes(searchTerm) ||
                agent.company.toLowerCase().includes(searchTerm) ||
                agent.address.toLowerCase().includes(searchTerm) ||
                agent.specialties.some(s => s.toLowerCase().includes(searchTerm));

            const matchesSpecialty = !specialtyFilter || 
                agent.specialties.includes(specialtyFilter);
                
            const matchesRegion = !regionFilter || 
                agent.neighborhood === regionFilter;
            
            return matchesSearch && matchesSpecialty && matchesRegion;
        });

        this.displayAgents();
    }

    displayAgents() {
        this.hideLoading();
        
        if (this.filteredAgents.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();
        this.agentsList.innerHTML = '';

        this.filteredAgents.forEach(agent => {
            const agentCard = this.createAgentCard(agent);
            this.agentsList.appendChild(agentCard);
        });
    }

    createAgentCard(agent) {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        const specialtyLabels = {
            auto: 'Seguro Auto',
            vida: 'Seguro de Vida',
            residencial: 'Seguro Residencial',
            empresarial: 'Seguro Empresarial',
            saude: 'Seguro Saúde',
            viagem: 'Seguro Viagem'
        };

        const isVerified = agent.verified ? '<span class="verified-badge">✓ Verificado</span>' : '';
        const companyInfo = agent.company && agent.company !== agent.name ? 
            `<div class="company-name">${agent.company}</div>` : '';

        card.innerHTML = `
            <div class="agent-header">
                <div class="agent-name">${agent.name}</div>
                ${isVerified}
            </div>
            ${companyInfo}
            <div class="agent-info">
                <div class="info-item">
                    <span class="info-icon">📞</span>
                    <span>${agent.phone}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">📧</span>
                    <span>${agent.email}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">📍</span>
                    <span>${agent.address}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">⭐</span>
                    <span>${agent.rating}/5.0</span>
                </div>
            </div>
            <div class="agent-specialties">
                ${agent.specialties.map(specialty => 
                    `<span class="specialty-tag">${specialtyLabels[specialty] || specialty}</span>`
                ).join('')}
            </div>
            <div class="contact-buttons">
                <a href="tel:${agent.phone}" class="contact-btn primary">
                    📞 Ligar
                </a>
                <a href="mailto:${agent.email}" class="contact-btn secondary">
                    📧 Email
                </a>
                ${agent.website ? `
                <a href="${agent.website}" target="_blank" class="contact-btn secondary">
                    🌐 Website
                </a>
                ` : ''}
                <a href="https://wa.me/55${agent.phone.replace(/\D/g, '')}" target="_blank" class="contact-btn whatsapp">
                    💬 WhatsApp
                </a>
            </div>
        `;

        return card;
    }

    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
        this.resultsContainer.style.display = 'none';
        this.noResults.classList.add('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
        this.resultsContainer.style.display = 'block';
    }

    showNoResults() {
        this.noResults.classList.remove('hidden');
        this.agentsList.innerHTML = '';
    }

    hideNoResults() {
        this.noResults.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InsuranceAgentDirectory();
});
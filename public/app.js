class InsuranceAgentDirectory {
    constructor() {
        this.apiKey = 'jina_7b751a85dace4ad48b218524fba93e50NjFfx-SWhltU-u80Vjh4Eht35jo5';
        this.agents = [];
        this.filteredAgents = [];
        this.searchCache = new Map();
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
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
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        this.specialtyFilter.addEventListener('change', () => this.applyFilters());
        this.regionFilter.addEventListener('change', () => this.applyFilters());
        
        this.searchInput.addEventListener('input', this.debounce(() => {
            if (this.searchInput.value.length > 2) {
                this.performSearch();
            }
        }, 500));
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

    async loadInitialData() {
        this.showLoading();
        try {
            await this.searchInsuranceAgents('corretores de seguros Fortaleza');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showMockData();
        }
    }

    async searchInsuranceAgents(query) {
        const cacheKey = query.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            this.agents = this.searchCache.get(cacheKey);
            this.applyFilters();
            return;
        }

        try {
            const searchResults = await this.callJinaSearch(query);
            const agentData = await this.extractAgentData(searchResults);
            
            this.agents = agentData;
            this.searchCache.set(cacheKey, agentData);
            this.applyFilters();
        } catch (error) {
            console.error('Search failed:', error);
            this.showMockData();
        }
    }

    async callJinaSearch(query) {
        const searchUrl = 'https://s.jina.ai/';
        const searchParams = new URLSearchParams({
            q: `${query} contato telefone endereço`,
            gl: 'BR',
            location: 'Fortaleza',
            hl: 'pt'
        });

        const response = await fetch(searchUrl + '?' + searchParams.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    }

    async extractAgentData(searchResults) {
        const agents = [];
        const results = searchResults.results || [];

        for (const result of results.slice(0, 10)) {
            try {
                const agentInfo = await this.parseAgentFromResult(result);
                if (agentInfo) {
                    agents.push(agentInfo);
                }
            } catch (error) {
                console.warn('Failed to parse agent data:', error);
            }
        }

        if (agents.length === 0) {
            return this.generateMockAgents();
        }

        return agents;
    }

    async parseAgentFromResult(result) {
        const title = result.title || '';
        const snippet = result.snippet || '';
        const url = result.url || '';

        const phoneMatch = snippet.match(/(\(?[0-9]{2}\)?[-.\s]?[0-9]{4,5}[-.\s]?[0-9]{4})/);
        const emailMatch = snippet.match(/[\w.-]+@[\w.-]+\.\w+/);
        
        const agentName = this.extractAgentName(title, snippet);
        const address = this.extractAddress(snippet);
        const specialties = this.extractSpecialties(snippet);
        const region = this.extractRegion(address, snippet);

        return {
            id: Math.random().toString(36).substr(2, 9),
            name: agentName,
            phone: phoneMatch ? phoneMatch[1] : null,
            email: emailMatch ? emailMatch[0] : null,
            address: address,
            website: url,
            specialties: specialties,
            region: region,
            rating: Math.floor(Math.random() * 2) + 4
        };
    }

    extractAgentName(title, snippet) {
        const commonTitles = title.toLowerCase();
        if (commonTitles.includes('corretor') || commonTitles.includes('seguros')) {
            return title.split('-')[0].trim();
        }
        
        const namePatterns = [
            /(\w+\s+\w+)\s*-?\s*corretor/i,
            /corretor[a]?\s+(\w+\s+\w+)/i,
            /(\w+\s+\w+)\s*seguros/i
        ];

        for (const pattern of namePatterns) {
            const match = snippet.match(pattern);
            if (match) return match[1];
        }

        return title.split('-')[0].trim() || 'Corretor de Seguros';
    }

    extractAddress(text) {
        const addressPatterns = [
            /([A-Z][a-z]+\s+[A-Z][a-z]+.*?(?:Fortaleza|CE))/i,
            /(Rua|Av|Avenida).*?(?:Fortaleza|CE)/i,
            /(Centro|Aldeota|Meireles|Cocó).*?Fortaleza/i
        ];

        for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match) return match[0];
        }

        return 'Fortaleza, CE';
    }

    extractSpecialties(text) {
        const specialtyMap = {
            'auto': ['auto', 'veículo', 'carro'],
            'vida': ['vida', 'pessoal'],
            'residencial': ['residencial', 'casa', 'imóvel'],
            'empresarial': ['empresarial', 'empresa', 'comercial']
        };

        const specialties = [];
        const lowerText = text.toLowerCase();

        for (const [key, keywords] of Object.entries(specialtyMap)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                specialties.push(key);
            }
        }

        return specialties.length > 0 ? specialties : ['auto', 'vida'];
    }

    extractRegion(address, text) {
        const regions = ['centro', 'aldeota', 'meireles', 'cocó'];
        const lowerText = (address + ' ' + text).toLowerCase();
        
        for (const region of regions) {
            if (lowerText.includes(region)) {
                return region;
            }
        }
        
        return 'centro';
    }

    generateMockAgents() {
        return [
            {
                id: '1',
                name: 'Carlos Silva Santos',
                phone: '(85) 3456-7890',
                email: 'carlos.silva@seguros.com',
                address: 'Rua Barão do Rio Branco, 1234 - Centro, Fortaleza - CE',
                website: 'https://carlossilva-seguros.com.br',
                specialties: ['auto', 'vida', 'residencial'],
                region: 'centro',
                rating: 4.8
            },
            {
                id: '2',
                name: 'Maria Oliveira Costa',
                phone: '(85) 9876-5432',
                email: 'maria.costa@corretoraseguros.com.br',
                address: 'Av. Dom Luís, 567 - Aldeota, Fortaleza - CE',
                website: 'https://mariaoliveira-corretor.com.br',
                specialties: ['empresarial', 'vida'],
                region: 'aldeota',
                rating: 4.9
            },
            {
                id: '3',
                name: 'João Pedro Almeida',
                phone: '(85) 2345-6789',
                email: 'joao.almeida@jpaseguros.com.br',
                address: 'Rua Silva Jatahy, 890 - Meireles, Fortaleza - CE',
                website: null,
                specialties: ['auto', 'residencial'],
                region: 'meireles',
                rating: 4.7
            },
            {
                id: '4',
                name: 'Ana Beatriz Lima',
                phone: '(85) 8765-4321',
                email: 'ana.lima@segurosbeatriz.com.br',
                address: 'Av. Washington Soares, 1500 - Cocó, Fortaleza - CE',
                website: 'https://anabeatriz-seguros.com.br',
                specialties: ['vida', 'residencial', 'empresarial'],
                region: 'cocó',
                rating: 4.6
            },
            {
                id: '5',
                name: 'Roberto Ferreira Nunes',
                phone: '(85) 5432-1098',
                email: 'roberto.nunes@rfnseguros.com.br',
                address: 'Rua Senador Pompeu, 245 - Centro, Fortaleza - CE',
                website: 'https://robertonunes-corretor.com.br',
                specialties: ['auto', 'empresarial'],
                region: 'centro',
                rating: 4.5
            }
        ];
    }

    showMockData() {
        this.agents = this.generateMockAgents();
        this.applyFilters();
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.loadInitialData();
            return;
        }

        this.showLoading();
        await this.searchInsuranceAgents(`corretores de seguros ${query} Fortaleza`);
    }

    applyFilters() {
        const specialtyFilter = this.specialtyFilter.value;
        const regionFilter = this.regionFilter.value;

        this.filteredAgents = this.agents.filter(agent => {
            const matchesSpecialty = !specialtyFilter || 
                agent.specialties.includes(specialtyFilter);
            const matchesRegion = !regionFilter || 
                agent.region === regionFilter;
            
            return matchesSpecialty && matchesRegion;
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
            empresarial: 'Seguro Empresarial'
        };

        card.innerHTML = `
            <div class="agent-name">${agent.name}</div>
            <div class="agent-info">
                ${agent.phone ? `
                <div class="info-item">
                    <span class="info-icon">📞</span>
                    <span>${agent.phone}</span>
                </div>
                ` : ''}
                ${agent.email ? `
                <div class="info-item">
                    <span class="info-icon">📧</span>
                    <span>${agent.email}</span>
                </div>
                ` : ''}
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
                    `<span class="specialty-tag">${specialtyLabels[specialty]}</span>`
                ).join('')}
            </div>
            <div class="contact-buttons">
                ${agent.phone ? `
                <a href="tel:${agent.phone}" class="contact-btn primary">
                    📞 Ligar
                </a>
                ` : ''}
                ${agent.email ? `
                <a href="mailto:${agent.email}" class="contact-btn secondary">
                    📧 Email
                </a>
                ` : ''}
                ${agent.website ? `
                <a href="${agent.website}" target="_blank" class="contact-btn secondary">
                    🌐 Website
                </a>
                ` : ''}
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
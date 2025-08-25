class InsuranceAgentDirectory {
    constructor() {
        // Use secure API endpoints instead of direct Supabase connection
        this.apiBase = window.location.origin + '/api';
        
        this.searchCache = new Map();
        this.filterOptions = null;
        this.currentSearchController = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeFilters();
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
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsHeader = document.getElementById('resultsHeader');
        this.resultsCount = document.getElementById('resultsCount');
        this.clearSearch = document.getElementById('clearSearch');
        this.advancedToggle = document.getElementById('advancedToggle');
        this.advancedFilters = document.querySelector('.advanced-filters');
        
        // Quick filter buttons
        this.quickButtons = document.querySelectorAll('.quick-btn');
        
        // Footer links
        this.footerLinks = document.querySelectorAll('.neighborhood-link, .insurance-link');
    }


    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Debounced search on input
        this.searchInput.addEventListener('input', this.debounce(() => {
            if (this.searchInput.value.trim().length >= 2) {
                this.performSearch();
            }
        }, 300));
        
        // Advanced filters
        this.specialtyFilter.addEventListener('change', () => this.performSearch());
        this.regionFilter.addEventListener('change', () => this.performSearch());
        
        // Quick filter buttons
        this.quickButtons.forEach(button => {
            button.addEventListener('click', () => {
                const searchTerm = button.dataset.search;
                this.searchInput.value = searchTerm;
                this.performSearch();
            });
        });
        
        // Advanced filters toggle
        this.advancedToggle.addEventListener('click', () => {
            this.advancedFilters.classList.toggle('hidden');
            this.advancedToggle.textContent = this.advancedFilters.classList.contains('hidden') 
                ? 'Filtros avançados' : 'Ocultar filtros';
        });
        
        // Clear search
        this.clearSearch.addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // Footer search links
        this.footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const searchTerm = link.dataset.search;
                this.searchInput.value = searchTerm;
                this.performSearch();
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        });
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

    async initializeFilters() {
        try {
            // Load filter options from secure API endpoint
            const response = await fetch(`${this.apiBase}/filters`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.filterOptions = await response.json();
            this.populateFilters();
        } catch (error) {
            console.error('Failed to initialize filters:', error);
            // Show user-friendly error message
            this.showError('Erro ao carregar filtros. Tente recarregar a página.');
        }
    }

    async searchBrokers(searchTerm, specialty, region) {
        const cacheKey = `${searchTerm}|${specialty}|${region}`;
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        // Cancel previous request
        if (this.currentSearchController) {
            this.currentSearchController.abort();
        }
        this.currentSearchController = new AbortController();

        try {
            // Use secure API endpoint for search
            const response = await fetch(`${this.apiBase}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    searchTerm: searchTerm || '',
                    specialty: specialty || '',
                    region: region || ''
                }),
                signal: this.currentSearchController.signal
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Muitas solicitações. Tente novamente em um minuto.');
                }
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            const results = result.data || [];
            
            // Cache results for 5 minutes
            this.searchCache.set(cacheKey, results);
            setTimeout(() => this.searchCache.delete(cacheKey), 5 * 60 * 1000);

            return results;
        } catch (error) {
            if (error.name === 'AbortError') {
                return null; // Request was cancelled
            }
            console.error('Search error details:', error);
            throw error;
        }
    }

    showError(message) {
        this.hideLoading();
        this.noResults.innerHTML = `<p>${message}</p>`;
        this.showNoResults();
    }

    clearAllFilters() {
        // Cancel any ongoing search
        if (this.currentSearchController) {
            this.currentSearchController.abort();
        }
        
        this.searchInput.value = '';
        this.specialtyFilter.value = '';
        this.regionFilter.value = '';
        this.resultsSection.classList.add('hidden');
        this.advancedFilters.classList.add('hidden');
        this.advancedToggle.textContent = 'Filtros avançados';
        
        // Clear search cache
        this.searchCache.clear();
    }

    populateFilters() {
        if (!this.filterOptions) return;

        // Clear existing options (except first one)
        this.specialtyFilter.innerHTML = '<option value="">Todas as especialidades</option>';
        this.regionFilter.innerHTML = '<option value="">Todos os bairros</option>';
        
        const specialtyLabels = {
            'auto': 'Seguro Auto',
            'vida': 'Seguro de Vida',
            'residencial': 'Seguro Residencial',
            'empresarial': 'Seguro Empresarial',
            'saude': 'Seguro Saúde',
            'viagem': 'Seguro Viagem'
        };

        // Populate specialty filter
        this.filterOptions.specialties.forEach(specialty => {
            if (specialty) {
                const option = document.createElement('option');
                option.value = specialty;
                option.textContent = specialtyLabels[specialty] || specialty;
                this.specialtyFilter.appendChild(option);
            }
        });

        // Populate region filter
        this.filterOptions.neighborhoods.sort().forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            this.regionFilter.appendChild(option);
        });
    }

    async performSearch() {
        const searchTerm = this.searchInput.value.trim();
        const specialty = this.specialtyFilter.value;
        const region = this.regionFilter.value;

        // Don't search if no criteria provided
        if (!searchTerm && !specialty && !region) {
            this.resultsSection.classList.add('hidden');
            return;
        }

        // Don't search if search term is too short and no filters
        if (searchTerm && searchTerm.length < 2 && !specialty && !region) {
            return;
        }

        // Show loading state
        this.showLoading();
        this.resultsSection.classList.remove('hidden');

        try {
            const results = await this.searchBrokers(searchTerm, specialty, region);
            
            // Check if request was cancelled
            if (results === null) {
                return;
            }

            this.displayResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Erro ao buscar corretores. Tente novamente.');
        }
    }

    async retrySearch(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.performSearch();
                return;
            } catch (error) {
                console.error(`Search attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    this.showError('Erro de conexão. Verifique sua internet e tente novamente.');
                } else {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
    }

    displayResults(results) {
        this.hideLoading();
        
        if (results.length === 0) {
            this.showNoResults();
            this.resultsHeader.classList.add('hidden');
            return;
        }

        this.hideNoResults();
        this.resultsHeader.classList.remove('hidden');
        this.resultsCount.textContent = `${results.length} corretor${results.length !== 1 ? 'es' : ''} encontrado${results.length !== 1 ? 's' : ''}`;
        
        this.agentsList.innerHTML = '';

        results.forEach(agent => {
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
        const rating = agent.rating ? `${agent.rating}/5.0` : 'N/A';
        const reviewCount = agent.review_count ? ` (${agent.review_count} avaliações)` : '';

        card.innerHTML = `
            <div class="agent-header">
                <div class="agent-name">${agent.name || 'Nome não disponível'}</div>
                ${isVerified}
            </div>
            <div class="agent-info">
                ${agent.phone ? `
                <div class="info-item">
                    <span class="info-label">Telefone:</span>
                    <span>${agent.phone}</span>
                </div>
                ` : ''}
                ${agent.email ? `
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span>${agent.email}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Endereço:</span>
                    <span>${agent.address || 'Endereço não informado'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Avaliação:</span>
                    <span>${rating}${reviewCount}</span>
                </div>
            </div>
            ${agent.specialties && agent.specialties.length > 0 ? `
            <div class="agent-specialties">
                ${agent.specialties.map(specialty => 
                    `<span class="specialty-tag">${specialtyLabels[specialty] || specialty}</span>`
                ).join('')}
            </div>
            ` : ''}
            <div class="contact-buttons">
                ${agent.phone ? `
                <a href="tel:${agent.phone}" class="contact-btn primary">
                    Ligar
                </a>
                ` : ''}
                ${agent.email ? `
                <a href="mailto:${agent.email}" class="contact-btn secondary">
                    Email
                </a>
                ` : ''}
                ${agent.website ? `
                <a href="${agent.website}" target="_blank" class="contact-btn secondary">
                    Website
                </a>
                ` : ''}
                ${agent.phone ? `
                <a href="https://wa.me/55${agent.phone.replace(/\D/g, '')}" target="_blank" class="contact-btn whatsapp">
                    WhatsApp
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InsuranceAgentDirectory();
});
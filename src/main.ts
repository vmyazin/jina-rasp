// Types for the insurance broker data
interface InsuranceBroker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address: string;
  neighborhood: string;
  specialties: string[];
  rating?: number;
  review_count?: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  specialties: string[];
  neighborhoods: string[];
}

interface SearchResponse {
  data: InsuranceBroker[];
  count: number;
  error?: string;
}

class InsuranceAgentDirectory {
  private apiBase: string;
  private searchCache: Map<string, InsuranceBroker[]>;
  private filterOptions: FilterOptions | null;
  private currentSearchController: AbortController | null;
  
  // DOM elements
  private searchInput!: HTMLInputElement;
  private searchBtn!: HTMLButtonElement;
  private specialtyFilter!: HTMLSelectElement;
  private regionFilter!: HTMLSelectElement;
  private loadingSpinner!: HTMLElement;
  private agentsList!: HTMLElement;
  private noResults!: HTMLElement;
  private resultsContainer!: HTMLElement;
  private resultsSection!: HTMLElement;
  private resultsHeader!: HTMLElement;
  private resultsCount!: HTMLElement;
  private clearSearch!: HTMLButtonElement;
  private advancedToggle!: HTMLButtonElement;
  private advancedFilters!: HTMLElement;
  private quickButtons!: NodeListOf<HTMLButtonElement>;
  private footerLinks!: NodeListOf<HTMLAnchorElement>;

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

  private initializeElements(): void {
    this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
    this.searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
    this.specialtyFilter = document.getElementById('specialtyFilter') as HTMLSelectElement;
    this.regionFilter = document.getElementById('regionFilter') as HTMLSelectElement;
    this.loadingSpinner = document.getElementById('loadingSpinner') as HTMLElement;
    this.agentsList = document.getElementById('agentsList') as HTMLElement;
    this.noResults = document.getElementById('noResults') as HTMLElement;
    this.resultsContainer = document.getElementById('resultsContainer') as HTMLElement;
    this.resultsSection = document.getElementById('resultsSection') as HTMLElement;
    this.resultsHeader = document.getElementById('resultsHeader') as HTMLElement;
    this.resultsCount = document.getElementById('resultsCount') as HTMLElement;
    this.clearSearch = document.getElementById('clearSearch') as HTMLButtonElement;
    this.advancedToggle = document.getElementById('advancedToggle') as HTMLButtonElement;
    this.advancedFilters = document.querySelector('.advanced-filters') as HTMLElement;
    
    // Quick filter buttons
    this.quickButtons = document.querySelectorAll('.quick-btn') as NodeListOf<HTMLButtonElement>;
    
    // Footer links
    this.footerLinks = document.querySelectorAll('.neighborhood-link, .insurance-link') as NodeListOf<HTMLAnchorElement>;
  }

  private attachEventListeners(): void {
    this.searchBtn.addEventListener('click', () => this.performSearch());
    this.searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
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
        if (searchTerm) {
          this.searchInput.value = searchTerm;
          this.performSearch();
        }
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
      link.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const searchTerm = link.dataset.search;
        if (searchTerm) {
          this.searchInput.value = searchTerm;
          this.performSearch();
          window.scrollTo({top: 0, behavior: 'smooth'});
        }
      });
    });
  }

  private debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private async initializeFilters(): Promise<void> {
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

  private async searchBrokers(searchTerm: string, specialty: string, region: string): Promise<InsuranceBroker[] | null> {
    const cacheKey = `${searchTerm}|${specialty}|${region}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
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

      const result: SearchResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const results = result.data || [];
      
      // Cache results for 5 minutes
      this.searchCache.set(cacheKey, results);
      setTimeout(() => this.searchCache.delete(cacheKey), 5 * 60 * 1000);

      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      console.error('Search error details:', error);
      throw error;
    }
  }

  private showError(message: string): void {
    this.hideLoading();
    this.noResults.innerHTML = `<p>${message}</p>`;
    this.showNoResults();
  }

  private clearAllFilters(): void {
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

  private populateFilters(): void {
    if (!this.filterOptions) return;

    // Clear existing options (except first one)
    this.specialtyFilter.innerHTML = '<option value="">Todas as especialidades</option>';
    this.regionFilter.innerHTML = '<option value="">Todos os bairros</option>';
    
    const specialtyLabels: Record<string, string> = {
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

  private async performSearch(): Promise<void> {
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



  private displayResults(results: InsuranceBroker[]): void {
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

  private createAgentCard(agent: InsuranceBroker): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'agent-card';
    
    const specialtyLabels: Record<string, string> = {
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

  private showLoading(): void {
    this.loadingSpinner.classList.remove('hidden');
    this.resultsContainer.style.display = 'none';
    this.noResults.classList.add('hidden');
  }

  private hideLoading(): void {
    this.loadingSpinner.classList.add('hidden');
    this.resultsContainer.style.display = 'block';
  }

  private showNoResults(): void {
    this.noResults.classList.remove('hidden');
    this.agentsList.innerHTML = '';
  }

  private hideNoResults(): void {
    this.noResults.classList.add('hidden');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new InsuranceAgentDirectory();
});
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './broker-search.js';
import './broker-list.js';

// Types for the insurance broker data
export interface InsuranceBroker {
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

export interface FilterOptions {
  specialties: string[];
  neighborhoods: string[];
}

interface SearchResponse {
  data: InsuranceBroker[];
  count: number;
  error?: string;
}

@customElement('broker-app')
export class BrokerApp extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* Custom Brand Colors */
    :host {
      --brand-primary: #667eea;
      --brand-secondary: #764ba2;
      --brand-gradient: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    }

    .main {
      padding: 0;
      min-height: 40vh;
      margin-top: calc(-1 * var(--size-6, 1.5rem));
      position: relative;
      z-index: 2;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .header {
      background: var(--brand-gradient);
      color: white;
      padding: var(--size-8, 2rem) 0 var(--size-6, 1.5rem);
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    }

    .header .container {
      position: relative;
      z-index: 10;
    }

    .logo {
      font-size: var(--font-size-8);
      font-weight: var(--font-weight-8, 800);
      letter-spacing: var(--font-letterspacing-1, -0.025em);
      margin: 0;
    }

    .tagline {
      font-size: var(--font-size-3, 1.25rem);
      opacity: 0.95;
      font-weight: var(--font-weight-2, 300);
      max-width: 500px;
      margin: 0 auto;
      margin-bottom: var(--size-6);
    }

    .footer {
      background: linear-gradient(135deg, var(--gray-9, #1a202c) 0%, var(--gray-8, #2d3748) 100%);
      color: white;
      margin-top: var(--size-12, 2rem);
      padding: var(--size-8, 3rem) 0 0;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--size-8);
      margin-bottom: var(--size-8);
    }

    .footer-section h4 {
      color: var(--gray-2);
      font-size: var(--font-size-2);
      font-weight: var(--font-weight-6);
      margin-bottom: var(--size-4);
      padding-bottom: var(--size-2);
      border-bottom: 2px solid #667eea;
      display: inline-block;
    }

    .footer-section p {
      color: var(--gray-4);
      line-height: var(--font-lineheight-4);
      margin-bottom: var(--size-4);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: var(--size-3);
    }

    .footer-links a {
      color: #cbd5e0;
      text-decoration: none;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      display: block;
      padding: 0.25rem 0;
      cursor: pointer;
    }

    .footer-links a:hover {
      color: #667eea;
      padding-left: 0.5rem;
      transform: translateX(4px);
    }

    .footer-bottom {
      border-top: 1px solid var(--gray-6, #4a5568);
      padding: var(--size-6, 1.5rem) 0;
      margin-top: var(--size-8, 2rem);
      background: rgba(26, 32, 44, 0.5);
      width: 100%;
    }

    .footer-bottom-content {
      text-align: center;
      color: #a0aec0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .footer-bottom-content p {
      margin: var(--size-1) 0;
      font-size: var(--font-size-1);
    }

    .footer-legal {
      color: var(--gray-5);
      font-size: var(--font-size-0) !important;
    }

    @media (max-width: 768px) {
      .header {
        padding: var(--size-6, 1.5rem) 0 var(--size-8, 2rem);
      }
      
      .header .container {
        padding: 0 var(--size-4, 1rem);
      }
      
      .logo {
        font-size: var(--font-size-6, 2rem);
        line-height: 1.2;
        margin-bottom: var(--size-3, 0.75rem);
      }
      
      .tagline {
        font-size: var(--font-size-1, 1rem);
        line-height: 1.4;
        padding: 0 var(--size-2, 0.5rem);
        margin-bottom: var(--size-4, 1rem);
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: var(--size-10);
        text-align: center;
      }
      
      .footer-links a {
        font-size: var(--font-size-1);
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: var(--size-5, 1.25rem) 0 var(--size-6, 1.5rem);
      }
      
      .header .container {
        padding: 0 var(--size-3, 0.75rem);
      }
      
      .logo {
        font-size: var(--font-size-5, 1.75rem);
        line-height: 1.1;
        margin-bottom: var(--size-2, 0.5rem);
      }
      
      .tagline {
        font-size: var(--font-size-0, 0.875rem);
        line-height: 1.3;
        padding: 0 var(--size-1, 0.25rem);
        margin-bottom: var(--size-3, 0.75rem);
      }
    }
  `;

  @property({ type: Array }) brokers: InsuranceBroker[] = [];
  @property({ type: Object }) filterOptions: FilterOptions | null = null;
  @state() private loading = false;
  @state() private error = '';
  @state() private searchCache = new Map<string, InsuranceBroker[]>();
  @state() private currentSearchController: AbortController | null = null;

  private apiBase = window.location.origin + '/api';

  async firstUpdated() {
    await this.initializeFilters();
  }

  private async initializeFilters(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/filters`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.filterOptions = await response.json();
    } catch (error) {
      console.error('Failed to initialize filters:', error);
      this.error = 'Erro ao carregar filtros. Tente recarregar a página.';
    }
  }

  async handleSearch(event: CustomEvent) {
    const { searchTerm, specialty, region } = event.detail;
    
    // Don't search if no criteria provided
    if (!searchTerm && !specialty && !region) {
      this.brokers = [];
      return;
    }

    // Don't search if search term is too short and no filters
    if (searchTerm && searchTerm.length < 2 && !specialty && !region) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const results = await this.searchBrokers(searchTerm, specialty, region);
      
      if (results !== null) {
        this.brokers = results;
      }
    } catch (error) {
      console.error('Search error:', error);
      this.error = 'Erro ao buscar corretores. Tente novamente.';
      this.brokers = [];
    } finally {
      this.loading = false;
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
      throw error;
    }
  }

  handleClearSearch() {
    // Cancel any ongoing search
    if (this.currentSearchController) {
      this.currentSearchController.abort();
    }
    
    this.brokers = [];
    this.error = '';
    this.searchCache.clear();
  }

  handleFooterSearch(searchTerm: string) {
    const searchEvent = new CustomEvent('search', {
      detail: { searchTerm, specialty: '', region: '' }
    });
    this.handleSearch(searchEvent);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  render() {
    return html`
      <header class="header">
        <div class="container">
          <h1 class="logo">Corretores Fortaleza</h1>
          <p class="tagline">Encontre o corretor de seguros ideal para você</p>
        </div>
      </header>

      <main class="main">
        <div class="container">
          <broker-search 
            .filterOptions=${this.filterOptions}
            @search=${this.handleSearch}
            @clear-search=${this.handleClearSearch}
          ></broker-search>

          <broker-list 
            .brokers=${this.brokers}
            .loading=${this.loading}
            .error=${this.error}
          ></broker-list>
        </div>
      </main>

      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h4>Corretores Fortaleza</h4>
              <p>Encontre o corretor de seguros ideal para você em Fortaleza, Ceará.</p>
            </div>

            <div class="footer-section">
              <h4>Bairros</h4>
              <ul class="footer-links">
                <li><a @click=${() => this.handleFooterSearch('Centro')}>Centro</a></li>
                <li><a @click=${() => this.handleFooterSearch('Aldeota')}>Aldeota</a></li>
                <li><a @click=${() => this.handleFooterSearch('Meireles')}>Meireles</a></li>
                <li><a @click=${() => this.handleFooterSearch('Cocó')}>Cocó</a></li>
                <li><a @click=${() => this.handleFooterSearch('Papicu')}>Papicu</a></li>
                <li><a @click=${() => this.handleFooterSearch('Varjota')}>Varjota</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h4>Tipos de Seguro</h4>
              <ul class="footer-links">
                <li><a @click=${() => this.handleFooterSearch('seguro auto')}>Seguro Auto</a></li>
                <li><a @click=${() => this.handleFooterSearch('seguro vida')}>Seguro de Vida</a></li>
                <li><a @click=${() => this.handleFooterSearch('seguro residencial')}>Seguro Residencial</a></li>
                <li><a @click=${() => this.handleFooterSearch('seguro empresarial')}>Seguro Empresarial</a></li>
                <li><a @click=${() => this.handleFooterSearch('seguro saúde')}>Seguro Saúde</a></li>
                <li><a @click=${() => this.handleFooterSearch('seguro viagem')}>Seguro Viagem</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h4>Contato & Suporte</h4>
              <ul class="footer-links">
                <li><a href="mailto:contato@corretoresfortaleza.com">contato@corretoresfortaleza.com</a></li>
                <li><a href="tel:+5585999999999">(85) 99999-9999</a></li>
                <li><a @click=${() => window.scrollTo({top: 0, behavior: 'smooth'})}>Fazer uma Busca</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p>&copy; 2025 Diretório de Corretores de Seguros - Fortaleza</p>
            <p class="footer-legal">Todos os direitos reservados • Plataforma independente de corretagem</p>
          </div>
        </div>
      </footer>
    `;
  }
}
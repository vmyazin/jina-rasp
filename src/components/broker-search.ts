import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FilterOptions } from './broker-app.js';

@customElement('broker-search')
export class BrokerSearch extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* Custom Brand Colors */
    :host {
      --brand-primary: #667eea;
      --brand-secondary: #764ba2;
      --brand-gradient: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
      --animation-speed-normal: 0.3s;
    }

    .search-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: var(--size-6, 1.5rem);
      border-radius: var(--radius-3, 0.75rem);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      margin: 0 var(--size-4, 1rem) var(--size-8, 2rem);
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 10;
      margin-top: calc(-1 * var(--size-6, 1.5rem));
    }

    .search-intro {
      margin-bottom: 1.5rem;
    }

    .search-intro h2 {
      font-size: 2rem;
      color: #2d3748;
      margin-bottom: 0.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .search-intro p {
      color: #4a5568;
      font-size: 1.125rem;
      max-width: 600px;
      margin: 0 auto;
      font-weight: 400;
    }

    .search-container {
      display: flex;
      background: white;
      border-radius: var(--radius-4, 1rem);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 2px solid rgba(102, 126, 234, 0.1);
      transition: all var(--animation-speed-normal, 0.3s) ease;
      margin-bottom: var(--size-6, 1.5rem);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .search-container:focus-within {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .search-input {
      flex: 1;
      padding: var(--size-5, 1.25rem) var(--size-6, 1.5rem);
      border: none;
      font-size: var(--font-size-2, 1.125rem);
      font-weight: var(--font-weight-4, 400);
      color: var(--gray-7, #343A40);
      background: transparent;
    }

    .search-input:focus {
      outline: none;
    }

    .search-input::placeholder {
      color: var(--gray-5);
      font-weight: var(--font-weight-4);
    }

    .search-btn {
      padding: var(--size-5) var(--size-8);
      background: var(--brand-gradient);
      color: white;
      border: none;
      font-size: var(--font-size-1);
      font-weight: var(--font-weight-7);
      text-transform: uppercase;
      letter-spacing: var(--font-letterspacing-3);
      cursor: pointer;
      transition: all var(--animation-speed-normal) ease;
      position: relative;
      overflow: hidden;
    }

    .search-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .search-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .search-btn:hover::before {
      left: 100%;
    }

    .quick-filters {
      margin-top: 1rem;
    }

    .quick-label {
      font-size: 0.9rem;
      color: #4a5568;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }

    .quick-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .quick-btn {
      background: white;
      border: 2px solid var(--gray-3, #E9ECEF);
      color: var(--gray-6, #495057);
      padding: var(--size-3, 0.75rem) var(--size-5, 1.25rem);
      border-radius: var(--radius-3, 0.75rem);
      font-size: var(--font-size-0, 0.875rem);
      font-weight: var(--font-weight-6, 600);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .quick-btn:hover {
      background: var(--brand-gradient);
      color: white;
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .advanced-filters {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .advanced-filters.hidden {
      display: none;
    }

    .filters {
      display: flex;
      gap: var(--size-4);
      justify-content: center;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: var(--size-3) var(--size-4);
      border: 2px solid var(--gray-2);
      border-radius: var(--radius-2);
      font-size: var(--font-size-0);
      background: white;
      cursor: pointer;
    }

    .advanced-toggle {
      background: none;
      border: none;
      color: #667eea;
      font-size: 0.9rem;
      cursor: pointer;
      margin-top: 1rem;
      text-decoration: underline;
      padding: 0.5rem;
    }

    .advanced-toggle:hover {
      color: #5a67d8;
    }

    @media (max-width: 768px) {
      .search-section {
        margin: 0 15px var(--size-8);
        padding: var(--size-8) var(--size-6);
      }
      
      .search-intro h2 {
        font-size: var(--font-size-6);
      }
      
      .search-intro p {
        font-size: var(--font-size-1);
      }
      
      .search-container {
        max-width: none;
        border-radius: var(--radius-3);
      }
      
      .search-input {
        padding: var(--size-4) var(--size-5);
        font-size: var(--font-size-1);
      }
      
      .search-btn {
        padding: var(--size-4) var(--size-6);
        font-size: var(--font-size-0);
      }
      
      .quick-buttons {
        gap: var(--size-2);
      }
      
      .quick-btn {
        padding: var(--size-3) var(--size-4);
        font-size: var(--font-size-0);
      }
    }
  `;

  @property({ type: Object }) filterOptions: FilterOptions | null = null;
  @state() private searchTerm = '';
  @state() private specialty = '';
  @state() private region = '';
  @state() private showAdvanced = false;
  @state() private searchTimeout: number | null = null;

  private specialtyLabels: Record<string, string> = {
    'auto': 'Seguro Auto',
    'vida': 'Seguro de Vida',
    'residencial': 'Seguro Residencial',
    'empresarial': 'Seguro Empresarial',
    'saude': 'Seguro Saúde',
    'viagem': 'Seguro Viagem'
  };

  private handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.searchTerm = target.value;
    
    // Debounced search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = window.setTimeout(() => {
      if (this.searchTerm.trim().length >= 2) {
        this.performSearch();
      }
    }, 300);
  }

  private handleSearchKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.performSearch();
    }
  }

  private handleSpecialtyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.specialty = target.value;
    this.performSearch();
  }

  private handleRegionChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.region = target.value;
    this.performSearch();
  }

  private handleQuickSearch(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.performSearch();
  }

  private performSearch() {
    const searchEvent = new CustomEvent('search', {
      detail: {
        searchTerm: this.searchTerm.trim(),
        specialty: this.specialty,
        region: this.region
      }
    });
    this.dispatchEvent(searchEvent);
  }

  private toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }



  render() {
    return html`
      <section class="search-section">
        <div class="search-intro">
          <h2>Como posso ajudar?</h2>
          <p>Digite o que você procura: tipo de seguro, nome do corretor ou bairro</p>
        </div>
        
        <div class="search-container">
          <input 
            type="text" 
            class="search-input"
            .value=${this.searchTerm}
            @input=${this.handleSearchInput}
            @keypress=${this.handleSearchKeyPress}
            placeholder="Ex: seguro auto, João Silva, Aldeota..."
          >
          <button class="search-btn" @click=${this.performSearch}>Buscar</button>
        </div>
        
        <div class="quick-filters">
          <p class="quick-label">Busca rápida:</p>
          <div class="quick-buttons">
            <button class="quick-btn" @click=${() => this.handleQuickSearch('seguro auto')}>Seguro Auto</button>
            <button class="quick-btn" @click=${() => this.handleQuickSearch('seguro vida')}>Seguro de Vida</button>
            <button class="quick-btn" @click=${() => this.handleQuickSearch('seguro residencial')}>Residencial</button>
            <button class="quick-btn" @click=${() => this.handleQuickSearch('seguro empresarial')}>Empresarial</button>
          </div>
        </div>
        
        <div class="advanced-filters ${this.showAdvanced ? '' : 'hidden'}">
          <div class="filters">
            <select class="filter-select" .value=${this.specialty} @change=${this.handleSpecialtyChange}>
              <option value="">Todas as especialidades</option>
              ${this.filterOptions?.specialties.map(specialty => 
                html`<option value=${specialty}>${this.specialtyLabels[specialty] || specialty}</option>`
              )}
            </select>
            <select class="filter-select" .value=${this.region} @change=${this.handleRegionChange}>
              <option value="">Todos os bairros</option>
              ${this.filterOptions?.neighborhoods.sort().map(region => 
                html`<option value=${region}>${region}</option>`
              )}
            </select>
          </div>
        </div>
        
        <button class="advanced-toggle" @click=${this.toggleAdvanced}>
          ${this.showAdvanced ? 'Ocultar filtros' : 'Filtros avançados'}
        </button>
      </section>
    `;
  }
}
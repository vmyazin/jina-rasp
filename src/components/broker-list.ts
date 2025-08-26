import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { InsuranceBroker } from './broker-app.js';
import './broker-card.js';

@customElement('broker-list')
export class BrokerList extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .results-section {
      background: white;
      border-radius: var(--radius-3, 0.75rem);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      margin: var(--size-8, 2rem) var(--size-4, 1rem) 0;
      border: 1px solid var(--gray-2, #E9ECEF);
    }

    .loading-spinner {
      text-align: center;
      padding: var(--size-12);
    }

    .loading-spinner.hidden {
      display: none;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--gray-2);
      border-top: 4px solid #667eea;
      border-radius: var(--radius-round);
      animation: spin 1s linear infinite;
      margin: 0 auto var(--size-4);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-spinner p {
      color: var(--gray-6);
      font-size: var(--font-size-2);
      margin: 0;
    }

    .results-container {
      padding: var(--size-6, 1.5rem);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--size-4) 0;
      border-bottom: 1px solid var(--gray-2);
      margin-bottom: var(--size-6);
    }

    .results-header.hidden {
      display: none;
    }

    .results-header h3 {
      color: var(--gray-8);
      font-size: var(--font-size-3);
      font-weight: var(--font-weight-6);
      margin: 0;
    }

    .clear-search {
      background: var(--gray-0);
      border: 1px solid var(--gray-2);
      padding: var(--size-2) var(--size-4);
      border-radius: var(--radius-2);
      font-size: var(--font-size-1);
      cursor: pointer;
      color: var(--gray-6);
      transition: all 0.15s ease;
    }

    .clear-search:hover {
      background: var(--gray-1);
      color: var(--gray-8);
    }

    .agents-list {
      display: grid;
      gap: var(--size-4);
    }

    .no-results {
      text-align: center;
      padding: var(--size-12);
      color: var(--gray-5);
      font-size: var(--font-size-2);
    }

    .no-results.hidden {
      display: none;
    }

    .no-results p {
      margin: var(--size-2) 0;
    }

    .no-results small {
      font-size: var(--font-size-1);
      color: var(--gray-5);
    }

    .error-message {
      background: var(--red-1);
      color: var(--red-8);
      padding: var(--size-4);
      border-radius: var(--radius-2);
      margin-bottom: var(--size-4);
      border: 1px solid var(--red-3);
    }

    @media (max-width: 768px) {
      .results-section {
        margin: 0 15px;
        border-radius: var(--radius-3);
      }

      .results-header {
        flex-direction: column;
        gap: var(--size-2);
        align-items: flex-start;
      }
    }
  `;

  @property({ type: Array }) brokers: InsuranceBroker[] = [];
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) error = '';

  private handleClearSearch() {
    const clearEvent = new CustomEvent('clear-search');
    this.dispatchEvent(clearEvent);
  }

  private get hasResults() {
    return this.brokers.length > 0;
  }

  private get showResults() {
    return this.hasResults || this.loading || this.error;
  }

  private get resultsCount() {
    const count = this.brokers.length;
    return `${count} corretor${count !== 1 ? 'es' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }

  render() {
    if (!this.showResults) {
      return html``;
    }

    return html`
      <section class="results-section">
        ${this.error ? html`
          <div class="error-message">
            ${this.error}
          </div>
        ` : ''}

        ${this.loading ? html`
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Carregando corretores...</p>
          </div>
        ` : ''}

        ${!this.loading && !this.error ? html`
          <div class="results-container">
            ${this.hasResults ? html`
              <div class="results-header">
                <h3>${this.resultsCount}</h3>
                <button class="clear-search" @click=${this.handleClearSearch}>
                  ✕ Limpar busca
                </button>
              </div>
              <div class="agents-list">
                ${this.brokers.map(broker => 
                  html`<broker-card .broker=${broker}></broker-card>`
                )}
              </div>
            ` : html`
              <div class="no-results">
                <p>Nenhum corretor encontrado com esses critérios.</p>
                <p><small>Tente buscar por outro termo ou usar os filtros avançados.</small></p>
              </div>
            `}
          </div>
        ` : ''}
      </section>
    `;
  }
}
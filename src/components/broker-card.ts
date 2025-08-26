import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { InsuranceBroker } from './broker-app.js';

@customElement('broker-card')
export class BrokerCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .agent-card {
      border: 1px solid var(--gray-3);
      border-radius: var(--radius-3);
      padding: var(--size-4);
      background: white;
      transition: all 0.2s ease;
    }

    .agent-card:hover {
      box-shadow: var(--shadow-3);
      border-color: var(--blue-4);
    }

    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--size-3);
      gap: var(--size-2);
    }

    .agent-name-section {
      display: flex;
      flex-direction: column;
      gap: var(--size-1);
      flex: 1;
    }

    .agent-name {
      font-size: var(--font-size-4);
      font-weight: var(--font-weight-6);
      color: var(--gray-8);
      margin: 0;
    }

    .verified-badge {
      background: var(--green-2);
      color: var(--green-8);
      padding: var(--size-1) var(--size-2);
      border-radius: var(--radius-2);
      font-size: var(--font-size-0);
      font-weight: var(--font-weight-6);
      white-space: nowrap;
      align-self: flex-start;
    }

    .header-buttons {
      display: flex;
      gap: var(--size-2);
      align-items: flex-start;
    }

    .agent-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--size-3) var(--size-4);
      margin-bottom: var(--size-3);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: var(--size-1);
    }

    .info-label {
      font-weight: var(--font-weight-6);
      color: var(--gray-7);
      font-size: var(--font-size-0);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      color: var(--gray-8);
      font-size: var(--font-size-1);
    }

    .info-value a {
      color: var(--blue-6);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .info-value a:hover {
      color: var(--blue-7);
      text-decoration: underline;
    }

    .agent-specialties {
      margin-bottom: var(--size-4);
    }

    .specialty-tag {
      display: inline-block;
      background: var(--blue-1);
      color: var(--blue-8);
      padding: var(--size-1) var(--size-2);
      border-radius: var(--radius-2);
      font-size: var(--font-size-0);
      margin-right: var(--size-2);
      margin-bottom: var(--size-1);
    }

    .contact-btn {
      padding: var(--size-2) var(--size-3);
      border-radius: var(--radius-2);
      text-decoration: none;
      font-size: var(--font-size-0);
      font-weight: var(--font-weight-6);
      text-align: center;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
      min-width: 70px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .contact-btn.secondary {
      background: var(--gray-2);
      color: var(--gray-8);
      border: 1px solid var(--gray-3);
    }

    .contact-btn.secondary:hover {
      background: var(--gray-3);
    }

    .contact-btn.whatsapp {
      background: var(--green-6);
      color: white;
    }

    .contact-btn.whatsapp:hover {
      background: var(--green-7);
    }

    @media (max-width: 768px) {
      .agent-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--size-3);
      }

      .header-buttons {
        width: 100%;
        justify-content: flex-start;
      }

      .agent-info {
        grid-template-columns: 1fr;
        gap: var(--size-3);
      }

      .contact-btn {
        width: 100%;
      }
    }
  `;

  @property({ type: Object }) broker!: InsuranceBroker;

  private specialtyLabels: Record<string, string> = {
    auto: 'Seguro Auto',
    vida: 'Seguro de Vida',
    residencial: 'Seguro Residencial',
    empresarial: 'Seguro Empresarial',
    saude: 'Seguro Saúde',
    viagem: 'Seguro Viagem'
  };

  private formatPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private getGoogleMapsUrl(address: string): string {
    // Encode the address for URL and add Fortaleza, CE if not already present
    const fullAddress = address.includes('Fortaleza') || address.includes('CE')
      ? address
      : `${address}, Fortaleza, CE, Brasil`;

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  }

  render() {
    if (!this.broker) return html``;

    const rating = this.broker.rating ? `${this.broker.rating}/5.0` : 'N/A';
    const reviewCount = this.broker.review_count ? ` (${this.broker.review_count} avaliações)` : '';

    return html`
      <div class="agent-card">
        <div class="agent-header">
          <div class="agent-name-section">
            <h3 class="agent-name">${this.broker.name || 'Nome não disponível'}</h3>
            ${this.broker.verified ? html`
              <span class="verified-badge">✓ Verificado</span>
            ` : ''}
          </div>
          
          <div class="header-buttons">
            ${this.broker.website ? html`
              <a href="${this.broker.website}" target="_blank" class="contact-btn secondary">
                Website
              </a>
            ` : ''}
            
            ${this.broker.phone ? html`
              <a href="https://wa.me/55${this.formatPhone(this.broker.phone)}" target="_blank" class="contact-btn whatsapp">
                WhatsApp
              </a>
            ` : ''}
          </div>
        </div>

        <div class="agent-info">
          ${this.broker.phone ? html`
            <div class="info-item">
              <span class="info-label">Telefone</span>
              <span class="info-value">${this.broker.phone}</span>
            </div>
          ` : ''}
          
          <div class="info-item">
            <span class="info-label">Endereço</span>
            <span class="info-value">
              ${this.broker.address ? html`
                <a href="${this.getGoogleMapsUrl(this.broker.address)}" target="_blank" rel="noopener noreferrer">
                  ${this.broker.address}
                </a>
              ` : 'Endereço não informado'}
            </span>
          </div>
          
          ${this.broker.email ? html`
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">
                <a href="mailto:${this.broker.email}">${this.broker.email}</a>
              </span>
            </div>
          ` : ''}
          
          <div class="info-item">
            <span class="info-label">Avaliação</span>
            <span class="info-value">${rating}${reviewCount}</span>
          </div>
        </div>

        ${this.broker.specialties && this.broker.specialties.length > 0 ? html`
          <div class="agent-specialties">
            ${this.broker.specialties.map(specialty =>
      html`<span class="specialty-tag">${this.specialtyLabels[specialty] || specialty}</span>`
    )}
          </div>
        ` : ''}
      </div>
    `;
  }
}
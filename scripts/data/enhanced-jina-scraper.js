#!/usr/bin/env node

/**
 * Enhanced Jina AI Insurance Broker Scraper
 * 
 * This scraper performs exhaustive research using Jina AI APIs:
 * - Uses s.jina.ai for comprehensive search
 * - Uses r.jina.ai for detailed page scraping
 * - Researches each broker exhaustively
 * - Retries failed scrapes
 * - Gathers complete business information
 */

const fs = require('fs');
const path = require('path');

class EnhancedJinaScraper {
  constructor(maxResults = null) {
    this.apiKey = process.env.JINA_API_KEY || 'jina_7b751a85dace4ad48b218524fba93e50NjFfx-SWhltU-u80Vjh4Eht35jo5';
    this.brokers = [];
    this.maxResults = maxResults; // Limit number of results (null = no limit)
    this.searchResults = [];
    this.scrapedPages = [];
    this.failedScrapes = [];
    this.retryAttempts = 3;

    // Comprehensive search queries for Fortaleza insurance brokers
    this.searchQueries = [
      // Portuguese queries
      'corretor de seguros Fortaleza Ceará telefone email',
      'agente seguros Fortaleza contato endereço',
      'corretora seguros Fortaleza CE especialista',
      'seguro auto vida residencial Fortaleza corretor',
      'insurance broker Fortaleza Brazil contact',
      'seguros Bradesco Porto Seguro Allianz Fortaleza',
      'corretor seguros Centro Aldeota Meireles Fortaleza',
      'seguro empresarial Fortaleza corretor especializado',
      'plano saúde seguro vida Fortaleza agente',
      'corretora seguros Cocó Papicu Varjota Fortaleza',

      // Specific company searches
      'Porto Seguro corretor Fortaleza representante',
      'Bradesco Seguros agente Fortaleza',
      'SulAmérica seguros corretor Fortaleza',
      'Allianz seguros representante Fortaleza',
      'Mapfre seguros corretor Fortaleza CE',

      // Neighborhood-specific searches
      'corretor seguros Aldeota Fortaleza telefone',
      'agente seguros Meireles Fortaleza contato',
      'corretora seguros Centro Fortaleza endereço',
      'seguros Cocó Fortaleza corretor especialista',
      'insurance Papicu Fortaleza broker contact'
    ];

    // URLs to scrape for additional broker information
    this.targetUrls = [
      'https://www.guiafortaleza.com.br/seguros',
      'https://www.acifortaleza.com.br/associados/seguros',
      'https://www.sindicorce.com.br/associados',
      'https://www.fenacor.org.br/associados/ceara',
      'https://www.susep.gov.br/corretores/ceara'
    ];
  }

  async scrapeAll() {
    console.log('🚀 Enhanced Jina AI Insurance Broker Scraper Starting...');
    console.log(`🎯 Target: Exhaustive research of Fortaleza insurance brokers`);
    console.log(`🔍 Search queries: ${this.searchQueries.length}`);
    console.log(`📄 Target URLs: ${this.targetUrls.length}`);
    console.log(`🔄 Retry attempts: ${this.retryAttempts} per failed scrape\n`);

    try {
      // Phase 1: Comprehensive search using s.jina.ai
      await this.performComprehensiveSearch();

      // Phase 2: Scrape specific URLs using r.jina.ai
      await this.scrapeTargetUrls();

      // Phase 3: Deep research on found brokers
      await this.performDeepResearch();

      // Phase 4: Retry failed scrapes
      await this.retryFailedScrapes();

      // Phase 5: Process and consolidate results
      await this.processResults();

      console.log(`\n✅ Enhanced scraping complete!`);
      console.log(`📊 Results:`);
      console.log(`   - Search queries executed: ${this.searchQueries.length}`);
      console.log(`   - URLs scraped: ${this.scrapedPages.length}`);
      console.log(`   - Brokers found: ${this.brokers.length}`);
      console.log(`   - Failed scrapes: ${this.failedScrapes.length}`);

      await this.saveResults();
      return this.brokers;

    } catch (error) {
      console.error('❌ Enhanced scraping failed:', error);
      throw error;
    }
  }

  async performComprehensiveSearch() {
    console.log('🔍 Phase 1: Comprehensive Search using s.jina.ai');
    console.log('-'.repeat(50));

    for (let i = 0; i < this.searchQueries.length; i++) {
      const query = this.searchQueries[i];
      console.log(`[${i + 1}/${this.searchQueries.length}] Searching: "${query}"`);

      try {
        const results = await this.searchWithJina(query);
        if (results && results.length > 0) {
          console.log(`   ✅ Found ${results.length} results`);
          this.searchResults.push(...results);

          // Process each result immediately
          for (const result of results) {
            await this.processSearchResult(result, query);
          }
        } else {
          console.log(`   ⚠️ No results found`);
        }

        // Rate limiting delay
        await this.delay(1000);

      } catch (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
        this.failedScrapes.push({ type: 'search', query, error: error.message });
      }
    }

    console.log(`📊 Search phase complete: ${this.searchResults.length} total results`);
  }

  async searchWithJina(query) {
    const url = 'https://s.jina.ai/';
    const params = new URLSearchParams({
      q: query,
      num: 10,  // Get more results per query
      safe: 'off'
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'Insurance-Broker-Directory/1.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async processSearchResult(result, originalQuery) {
    const { title, snippet, url } = result;

    // Check if this looks like an insurance broker
    if (!this.isInsuranceRelated(title, snippet)) {
      return;
    }

    console.log(`     🔍 Processing: ${title.substring(0, 50)}...`);

    // Extract basic information
    const brokerInfo = this.extractBrokerInfo(result, originalQuery);

    // If we found a potential broker, scrape their page for more details
    if (brokerInfo && url) {
      try {
        const scrapedData = await this.scrapePageWithJina(url);
        if (scrapedData) {
          // Merge scraped data with basic info
          const enhancedBroker = this.enhanceBrokerWithScrapedData(brokerInfo, scrapedData);
          this.brokers.push(enhancedBroker);
          console.log(`     ✅ Added: ${enhancedBroker.name}`);
        }
      } catch (error) {
        console.log(`     ⚠️ Page scrape failed: ${error.message}`);
        // Still add basic info even if page scraping fails
        this.brokers.push(brokerInfo);
      }
    }
  }

  async scrapeTargetUrls() {
    console.log('\n📄 Phase 2: Scraping Target URLs using r.jina.ai');
    console.log('-'.repeat(50));

    for (let i = 0; i < this.targetUrls.length; i++) {
      const url = this.targetUrls[i];
      console.log(`[${i + 1}/${this.targetUrls.length}] Scraping: ${url}`);

      try {
        const scrapedData = await this.scrapePageWithJina(url);
        if (scrapedData) {
          console.log(`   ✅ Scraped successfully (${scrapedData.length} chars)`);
          this.scrapedPages.push({ url, data: scrapedData, timestamp: new Date().toISOString() });

          // Extract broker information from scraped content
          const extractedBrokers = this.extractBrokersFromContent(scrapedData, url);
          if (extractedBrokers.length > 0) {
            console.log(`   📋 Extracted ${extractedBrokers.length} brokers`);
            this.brokers.push(...extractedBrokers);
          }
        } else {
          console.log(`   ⚠️ No content scraped`);
        }

        // Rate limiting delay
        await this.delay(2000);

      } catch (error) {
        console.log(`   ❌ Scraping failed: ${error.message}`);
        this.failedScrapes.push({ type: 'url_scrape', url, error: error.message });
      }
    }

    console.log(`📊 URL scraping complete: ${this.scrapedPages.length} pages scraped`);
  }

  async scrapePageWithJina(url) {
    const jinaUrl = `https://r.jina.ai/${url}`;

    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'text/plain',
        'User-Agent': 'Insurance-Broker-Directory/1.0'
      },
      timeout: 20000
    });

    if (!response.ok) {
      throw new Error(`Reader API returned ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    return content;
  }

  async performDeepResearch() {
    console.log('\n🔬 Phase 3: Deep Research on Found Brokers');
    console.log('-'.repeat(50));

    const uniqueBrokers = this.removeDuplicateBrokers(this.brokers);
    console.log(`🎯 Performing deep research on ${uniqueBrokers.length} unique brokers`);

    for (let i = 0; i < uniqueBrokers.length; i++) {
      const broker = uniqueBrokers[i];
      console.log(`[${i + 1}/${uniqueBrokers.length}] Researching: ${broker.name}`);

      try {
        // Research the broker's website if available
        if (broker.website) {
          const websiteData = await this.scrapePageWithJina(broker.website);
          if (websiteData) {
            broker.website_content = websiteData.substring(0, 1000); // Store excerpt
            broker.services = this.extractServices(websiteData);
            broker.contact_info = this.extractContactInfo(websiteData);
            console.log(`   ✅ Website researched`);
          }
        }

        // Search for additional information about this broker
        const brokerQuery = `"${broker.name}" Fortaleza seguros contato telefone`;
        const additionalResults = await this.searchWithJina(brokerQuery);

        if (additionalResults && additionalResults.length > 0) {
          broker.additional_mentions = additionalResults.length;
          broker.online_presence = this.analyzeOnlinePresence(additionalResults);
          console.log(`   📊 Found ${additionalResults.length} additional mentions`);
        }

        // Rate limiting
        await this.delay(1500);

      } catch (error) {
        console.log(`   ⚠️ Deep research failed: ${error.message}`);
        broker.research_error = error.message;
      }
    }

    this.brokers = uniqueBrokers;
    console.log(`📊 Deep research complete on ${this.brokers.length} brokers`);
  }

  async retryFailedScrapes() {
    if (this.failedScrapes.length === 0) {
      console.log('\n✅ No failed scrapes to retry');
      return;
    }

    console.log(`\n🔄 Phase 4: Retrying ${this.failedScrapes.length} Failed Scrapes`);
    console.log('-'.repeat(50));

    const retryList = [...this.failedScrapes];
    this.failedScrapes = []; // Clear for new failures

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      console.log(`Retry attempt ${attempt}/${this.retryAttempts}`);

      for (let i = 0; i < retryList.length; i++) {
        const failed = retryList[i];
        console.log(`   [${i + 1}/${retryList.length}] Retrying: ${failed.type}`);

        try {
          if (failed.type === 'search') {
            const results = await this.searchWithJina(failed.query);
            if (results && results.length > 0) {
              console.log(`   ✅ Retry successful: ${results.length} results`);
              // Process results
              for (const result of results) {
                await this.processSearchResult(result, failed.query);
              }
            }
          } else if (failed.type === 'url_scrape') {
            const scrapedData = await this.scrapePageWithJina(failed.url);
            if (scrapedData) {
              console.log(`   ✅ Retry successful: scraped ${scrapedData.length} chars`);
              const extractedBrokers = this.extractBrokersFromContent(scrapedData, failed.url);
              this.brokers.push(...extractedBrokers);
            }
          }

          await this.delay(2000);

        } catch (error) {
          console.log(`   ❌ Retry failed: ${error.message}`);
          if (attempt === this.retryAttempts) {
            this.failedScrapes.push(failed); // Keep for final report
          }
        }
      }

      if (attempt < this.retryAttempts) {
        console.log(`   ⏳ Waiting before next retry attempt...`);
        await this.delay(5000);
      }
    }

    console.log(`📊 Retry phase complete: ${this.failedScrapes.length} still failed`);
  }

  // Data extraction and processing methods
  extractBrokerInfo(result, originalQuery) {
    const { title, snippet, url } = result;

    return {
      id: this.generateId(),
      name: this.extractName(title, snippet),
      email: this.extractEmail(snippet),
      phone: this.extractPhone(snippet),
      website: url,
      address: this.extractAddress(snippet),
      neighborhood: this.extractNeighborhood(snippet),
      city: 'Fortaleza',
      state: 'CE',
      specialties: this.extractSpecialties(snippet),
      description: snippet.substring(0, 200),
      source_query: originalQuery,
      source_url: url,
      scraped_at: new Date().toISOString(),
      agent: 'EnhancedJina',
      confidence_score: this.calculateConfidenceScore(title, snippet)
    };
  }

  enhanceBrokerWithScrapedData(brokerInfo, scrapedData) {
    const enhanced = { ...brokerInfo };

    // Extract additional information from scraped content
    enhanced.full_content = scrapedData.substring(0, 2000);
    enhanced.services = this.extractServices(scrapedData);
    enhanced.contact_info = this.extractContactInfo(scrapedData);
    enhanced.business_hours = this.extractBusinessHours(scrapedData);
    enhanced.social_media = this.extractSocialMedia(scrapedData);
    enhanced.certifications = this.extractCertifications(scrapedData);
    enhanced.company_info = this.extractCompanyInfo(scrapedData);

    // Update confidence score based on additional data
    enhanced.confidence_score = this.calculateEnhancedConfidenceScore(enhanced);

    return enhanced;
  }

  extractBrokersFromContent(content, sourceUrl) {
    const brokers = [];
    const lines = content.split('\n');

    // Look for patterns that indicate broker listings
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line contains broker-like information
      if (this.isInsuranceRelated(line, '')) {
        const name = this.extractName(line, '');
        const phone = this.extractPhone(line);
        const email = this.extractEmail(line);

        if (name && (phone || email)) {
          brokers.push({
            id: this.generateId(),
            name: name,
            phone: phone,
            email: email,
            source_url: sourceUrl,
            source_content: line,
            scraped_at: new Date().toISOString(),
            agent: 'EnhancedJina',
            extraction_method: 'content_parsing'
          });
        }
      }
    }

    return brokers;
  }

  // Utility methods for data extraction
  isInsuranceRelated(title, snippet) {
    const text = (title + ' ' + snippet).toLowerCase();
    const keywords = [
      'corretor', 'seguros', 'seguro', 'agente', 'broker', 'insurance',
      'corretora', 'corretagem', 'susep', 'fenacor', 'bradesco seguros',
      'porto seguro', 'sulamerica', 'allianz', 'mapfre', 'tokio marine'
    ];
    return keywords.some(keyword => text.includes(keyword));
  }

  extractName(title, snippet) {
    // Try to extract a proper name from title first
    let name = title.replace(/[-|].*/g, '').replace(/seguros?|corretor[a]?|agente|insurance|broker/gi, '').trim();

    if (name.length < 3) {
      // Try to extract from snippet
      const nameMatch = snippet.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
      name = nameMatch ? nameMatch[1] : 'Corretor de Seguros';
    }

    return name.length > 50 ? name.substring(0, 50) : name;
  }

  extractEmail(content) {
    const match = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : null;
  }

  extractPhone(content) {
    const patterns = [
      /\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/,  // Brazilian format
      /\+55\s*\d{2}\s*9?\d{4}[-\s]?\d{4}/,  // International format
      /\d{2}\s*9\d{8}/  // Mobile format
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return this.formatBrazilianPhone(match[0]);
      }
    }

    return null;
  }

  formatBrazilianPhone(phone) {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
      }
      if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
      }
    }
    return phone; // Return original if can't format
  }

  extractAddress(content) {
    const patterns = [
      /(Rua|Av|Avenida).*?Fortaleza.*?CE/gi,
      /(Rua|Av|Avenida).*?Fortaleza/gi,
      /Endereço:.*?Fortaleza/gi
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[0].length > 15) {
        return match[0].trim();
      }
    }

    return null;
  }

  extractNeighborhood(content) {
    const neighborhoods = [
      'Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu', 'Varjota',
      'Dionísio Torres', 'Benfica', 'Montese', 'Messejana', 'Cambeba',
      'José Bonifácio', 'Fátima', 'Joaquim Távora', 'Mucuripe'
    ];

    const text = content.toLowerCase();
    for (const neighborhood of neighborhoods) {
      if (text.includes(neighborhood.toLowerCase())) {
        return neighborhood;
      }
    }

    return null;
  }

  extractSpecialties(content) {
    const text = content.toLowerCase();
    const specialties = [];

    const specialtyMap = {
      'auto': ['auto', 'veículo', 'carro', 'automóvel'],
      'vida': ['vida', 'pessoal', 'individual'],
      'residencial': ['residencial', 'casa', 'lar', 'habitação'],
      'empresarial': ['empresarial', 'empresa', 'comercial', 'negócio'],
      'saude': ['saúde', 'médico', 'hospitalar', 'plano de saúde'],
      'viagem': ['viagem', 'travel', 'internacional']
    };

    for (const [specialty, keywords] of Object.entries(specialtyMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        specialties.push(specialty);
      }
    }

    return specialties.length > 0 ? specialties : ['auto']; // Default to auto
  }

  extractServices(content) {
    const services = [];
    const text = content.toLowerCase();

    const serviceKeywords = [
      'cotação', 'orçamento', 'consultoria', 'assessoria', 'atendimento',
      'renovação', 'sinistro', 'vistoria', 'análise de risco'
    ];

    serviceKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        services.push(keyword);
      }
    });

    return services;
  }

  extractContactInfo(content) {
    return {
      phones: this.extractAllPhones(content),
      emails: this.extractAllEmails(content),
      addresses: this.extractAllAddresses(content)
    };
  }

  extractAllPhones(content) {
    const phones = [];
    const phoneRegex = /\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/g;
    let match;

    while ((match = phoneRegex.exec(content)) !== null) {
      const formatted = this.formatBrazilianPhone(match[0]);
      if (formatted && !phones.includes(formatted)) {
        phones.push(formatted);
      }
    }

    return phones;
  }

  extractAllEmails(content) {
    const emails = [];
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;

    while ((match = emailRegex.exec(content)) !== null) {
      const email = match[1].toLowerCase();
      if (!emails.includes(email)) {
        emails.push(email);
      }
    }

    return emails;
  }

  extractAllAddresses(content) {
    const addresses = [];
    const addressRegex = /(Rua|Av|Avenida).*?Fortaleza.*?CE/gi;
    let match;

    while ((match = addressRegex.exec(content)) !== null) {
      const address = match[0].trim();
      if (address.length > 15 && !addresses.includes(address)) {
        addresses.push(address);
      }
    }

    return addresses;
  }

  extractBusinessHours(content) {
    const hourPatterns = [
      /(\d{1,2}):(\d{2})\s*[-às]\s*(\d{1,2}):(\d{2})/g,
      /segunda.*?sexta.*?(\d{1,2}):(\d{2})/gi,
      /horário.*?(\d{1,2}):(\d{2})/gi
    ];

    for (const pattern of hourPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  extractSocialMedia(content) {
    const social = {};

    // Instagram
    const instaMatch = content.match(/@([a-zA-Z0-9._]+)/);
    if (instaMatch) social.instagram = instaMatch[1];

    // WhatsApp
    const whatsMatch = content.match(/whatsapp.*?(\d{13})/i);
    if (whatsMatch) social.whatsapp = whatsMatch[1];

    // Facebook
    const fbMatch = content.match(/facebook\.com\/([a-zA-Z0-9.]+)/);
    if (fbMatch) social.facebook = fbMatch[1];

    return Object.keys(social).length > 0 ? social : null;
  }

  extractCertifications(content) {
    const certifications = [];
    const certKeywords = ['susep', 'fenacor', 'certificado', 'habilitado', 'registro'];

    certKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        certifications.push(keyword);
      }
    });

    return certifications;
  }

  extractCompanyInfo(content) {
    return {
      founded: this.extractFoundedYear(content),
      employees: this.extractEmployeeCount(content),
      branches: this.extractBranchInfo(content)
    };
  }

  extractFoundedYear(content) {
    const yearMatch = content.match(/fundad[ao].*?(\d{4})/i);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  extractEmployeeCount(content) {
    const empMatch = content.match(/(\d+)\s*funcionários/i);
    return empMatch ? parseInt(empMatch[1]) : null;
  }

  extractBranchInfo(content) {
    const branchMatch = content.match(/(\d+)\s*filiais?/i);
    return branchMatch ? parseInt(branchMatch[1]) : null;
  }

  calculateConfidenceScore(title, snippet) {
    let score = 0;

    // Title relevance
    if (title.toLowerCase().includes('corretor') || title.toLowerCase().includes('seguros')) score += 30;

    // Contact information presence
    if (this.extractPhone(snippet)) score += 25;
    if (this.extractEmail(snippet)) score += 25;
    if (this.extractAddress(snippet)) score += 20;

    return Math.min(score, 100);
  }

  calculateEnhancedConfidenceScore(broker) {
    let score = broker.confidence_score || 0;

    // Additional data bonuses
    if (broker.services && broker.services.length > 0) score += 10;
    if (broker.business_hours) score += 5;
    if (broker.social_media) score += 5;
    if (broker.certifications && broker.certifications.length > 0) score += 10;
    if (broker.additional_mentions > 0) score += broker.additional_mentions * 2;

    return Math.min(score, 100);
  }

  analyzeOnlinePresence(results) {
    return {
      total_mentions: results.length,
      unique_domains: [...new Set(results.map(r => new URL(r.url).hostname))].length,
      social_mentions: results.filter(r =>
        r.url.includes('facebook') ||
        r.url.includes('instagram') ||
        r.url.includes('linkedin')
      ).length
    };
  }

  removeDuplicateBrokers(brokers) {
    const seen = new Map();
    const unique = [];

    for (const broker of brokers) {
      const key = `${broker.name.toLowerCase()}_${broker.phone || ''}_${broker.email || ''}`;

      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(broker);
      }
    }

    return unique;
  }

  async processResults() {
    console.log('\n📊 Phase 5: Processing and Consolidating Results');
    console.log('-'.repeat(50));

    // Remove duplicates
    const beforeCount = this.brokers.length;
    this.brokers = this.removeDuplicateBrokers(this.brokers);
    const afterCount = this.brokers.length;

    console.log(`🔍 Removed ${beforeCount - afterCount} duplicate brokers`);

    // Sort by confidence score
    this.brokers.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));

    // Add final processing timestamp
    this.brokers.forEach(broker => {
      broker.processed_at = new Date().toISOString();
      broker.data_quality = this.assessDataQuality(broker);
    });

    console.log(`✅ Processing complete: ${this.brokers.length} final brokers`);
  }

  assessDataQuality(broker) {
    let quality = 'low';
    let score = 0;

    if (broker.name) score += 20;
    if (broker.phone) score += 25;
    if (broker.email) score += 25;
    if (broker.address) score += 15;
    if (broker.website) score += 10;
    if (broker.specialties && broker.specialties.length > 0) score += 5;

    if (score >= 80) quality = 'high';
    else if (score >= 60) quality = 'medium';

    return { score, level: quality };
  }

  generateId() {
    return 'enhanced_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const results = {
      agent: 'EnhancedJinaScraper',
      version: '2.0',
      scraped_at: new Date().toISOString(),
      execution_summary: {
        search_queries_executed: this.searchQueries.length,
        urls_scraped: this.scrapedPages.length,
        total_search_results: this.searchResults.length,
        brokers_found: this.brokers.length,
        failed_scrapes: this.failedScrapes.length,
        retry_attempts: this.retryAttempts
      },
      data_quality: {
        high_quality: this.brokers.filter(b => b.data_quality?.level === 'high').length,
        medium_quality: this.brokers.filter(b => b.data_quality?.level === 'medium').length,
        low_quality: this.brokers.filter(b => b.data_quality?.level === 'low').length,
        average_confidence: this.brokers.reduce((sum, b) => sum + (b.confidence_score || 0), 0) / this.brokers.length
      },
      search_queries: this.searchQueries,
      scraped_pages: this.scrapedPages.map(p => ({ url: p.url, timestamp: p.timestamp, size: p.data.length })),
      failed_scrapes: this.failedScrapes,
      brokers: this.brokers
    };

    const filePath = path.join(__dirname, 'enhanced_jina_results.json');
    await fs.promises.writeFile(filePath, JSON.stringify(results, null, 2));

    console.log(`\n📁 Results saved to: enhanced_jina_results.json`);
    console.log(`📊 Execution Summary:`);
    console.log(`   - Search queries: ${results.execution_summary.search_queries_executed}`);
    console.log(`   - URLs scraped: ${results.execution_summary.urls_scraped}`);
    console.log(`   - Brokers found: ${results.execution_summary.brokers_found}`);
    console.log(`   - Failed scrapes: ${results.execution_summary.failed_scrapes}`);
    console.log(`   - Average confidence: ${results.data_quality.average_confidence.toFixed(1)}%`);
    console.log(`   - High quality: ${results.data_quality.high_quality} brokers`);
  }
}

// Export for use as module
module.exports = EnhancedJinaScraper;

// Auto-run when executed directly
if (require.main === module) {
  console.log('🚀 Enhanced Jina AI Insurance Broker Scraper');
  console.log('🎯 Exhaustive research with comprehensive data collection');
  console.log('🔄 Automatic retry for failed scrapes');
  console.log('📊 Quality assessment and confidence scoring\n');

  (async () => {
    const scraper = new EnhancedJinaScraper();

    try {
      const startTime = Date.now();
      const brokers = await scraper.scrapeAll();
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎉 Enhanced scraping completed successfully!');
      console.log(`⏱️ Completed in ${duration} seconds`);
      console.log(`✅ Total brokers: ${brokers.length}`);
      console.log(`📄 Results available in: enhanced_jina_results.json`);

    } catch (error) {
      console.error('\n❌ Enhanced scraping failed:', error.message);
      process.exit(1);
    }
  })();
}
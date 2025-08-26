**Jina AI — Usage Guide with Code Examples**

**1. Scrape a Webpage with r.jina.ai**

You can use the API or the web interface:
```python
import requests

url = "https://r.jina.ai/https://2men.it"
params = {
    "exclude_selectors": "header,footer"  # Optional: Exclude big elements for concise output
}
response = requests.get(url, params=params)
text_data = response.text
print(text_data)
```
This fetches all content from the target page, excluding headers and footers to reduce tokens and focus on what matters.

**2. Extract Specific Data as JSON (Prompt Example)**
After scraping, use an LLM with a prompt like:
```text
Please extract all sneaker-related information and links from this text and format it as detailed JSON objects.

[Paste content from r.jina.ai here]
```
Resulting JSON could look like:
```json
{
  "site": "2men.it",
  "section": "sneakers",
  "products": [
    {
      "brand": "Zilly",
      "name": "Gray Leather Deer Sneakers",
      "price": 249.99,
      "currency": "EUR",
      "images": [
        "https://2men.it/path-to-sneaker-image1.jpg"
      ]
    }
  ]
}
```

**3. Bulk Search and Scrape with s.jina.ai + r.jina.ai**
Automate finding and extracting info from many target URLs:

```python
import requests

# Step 1: Search for relevant URLs (SERP Scrape with custom filters)
search_term = "write for us Italian suits"
search_url = f"https://s.jina.ai/?q={search_term}&country=UK&page=1"
serp_results = requests.get(search_url).json()  # Get URLs list

# Step 2: For each result, scrape details
for result_url in serp_results["results"]:
    page_url = "https://r.jina.ai/" + result_url
    resp = requests.get(page_url)
    # Process each page (see above for extraction)
```

**4. Use AI to Filter and Post-process**

Combine search and scraping in a system:

- Get search results with s.jina.ai.
- Use AI (like Claude or GPT) to select URLs worth scraping.
- Scrape those URLs with r.jina.ai.
- Prompt LLM as above to turn page data into structured JSON.
- Use JSON for quick dashboards, article writing, or automated outreach.

**Key Tip:**  
Always use the **exclude selectors** in r.jina.ai to get compact, relevant results and reduce your LLM cost.

This enables powerful, programmable large-scale scraping and content extraction, all with minimal effort—straight from your Python scripts or manual workflow![1]

**How to Use Jina with Google Search Results (e.g., "corretores fortaleza")**

1. **Get Google Search Results with s.jina.ai**
   - s.jina.ai can perform a Google-like search and deliver top URLs:
   ```python
   import requests

   term = "corretores fortaleza"
   search_url = f"https://s.jina.ai/?q={term}&country=BR&page=1"
   result = requests.get(search_url).json()
   urls = [item['url'] for item in result.get("results", [])]
   print(urls)
   ```
   - This returns a list of result URLs for your query.

2. **Scrape Each Result with r.jina.ai**
   - For each URL, use r.jina.ai to extract content:
   ```python
   for u in urls:
       scrape_url = "https://r.jina.ai/" + u
       scraped = requests.get(scrape_url).text
       # Process scraped content (e.g., send to LLM, extract data)
   ```

3. **(Optional) Extract Targeted Data with an LLM Prompt**
   - Paste the scraped output into your favorite LLM or use code to pick out relevant details (e.g., names, contacts, company info about brokers in Fortaleza).

**Workflow Summary:**
- *Search term → s.jina.ai (get URLs) → r.jina.ai (extract page text) → process for leads/data.*

```typescript
// 1. Search Google with s.jina.ai
import fetch from 'node-fetch';

const search = async (query: string) => {
  const url = `https://s.jina.ai/?q=${encodeURIComponent(query)}&country=BR&page=1`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  return data.results.map((item: any) => item.url);
};

// 2. Scrape each result with r.jina.ai
const scrape = async (url: string) => {
  const scrapeUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(scrapeUrl);
  const text = await response.text();
  return text;
};

(async () => {
  const urls = await search("corretores fortaleza");
  for (const u of urls) {
    const content = await scrape(u);
    // Optionally: Process `content` with an LLM or extract info as needed
    console.log(content);
  }
})();
```

**Tips:**
- Use parameters (e.g., `country=BR` for Brazil) in s.jina.ai for location targeting.
- Use exclude selectors in r.jina.ai to make content more relevant and token-efficient.

This pattern lets you automate research for local brokers (or any niche) by quickly collecting and structuring leads from Google SERPs with Jina’s free AI scraping tools.


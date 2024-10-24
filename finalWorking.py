import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import spacy
from typing import Dict, Any, List
import requests
from bs4 import BeautifulSoup
import concurrent.futures
import hashlib
import time
import logging
#class containing logic for fact checking
class FactChecker:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu") #sets the device to either gpu if available to execute better or CPU otherwise
        
        # Load the NLI model whih will classify the relation between two sentences as supported , contradicted or neutral
        self.nli_model_name = "typeform/distilbert-base-uncased-mnli"
        self.nli_tokenizer = AutoTokenizer.from_pretrained(self.nli_model_name)
        self.nli_model = AutoModelForSequenceClassification.from_pretrained(self.nli_model_name).to(self.device)
        
        # Load spaCy model for linguistic analysis which
        self.nlp = spacy.load("en_core_web_sm")
        
        # Setup cache
        self.cache = {}

        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def search_google(self, query: str, num_results: int = 5) -> List[str]:
        """Search Google and return a list of URLs."""
        query_hash = hashlib.md5(query.encode()).hexdigest()
        cache_key = f"search_{query_hash}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            search_url = f"https://www.google.com/search?q={query}&num={num_results * 2}"
            response = requests.get(search_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            search_results = soup.find_all('div', class_='yuRUbf')
            
            urls = []
            for result in search_results:
                link = result.find('a')
                if link and 'href' in link.attrs:
                    urls.append(link['href'])
                if len(urls) == num_results:
                    break
            
            self.cache[cache_key] = urls
            return urls
        except Exception as e:
            self.logger.error(f"Error during Google search for query '{query}': {str(e)}")
            return []
    
    def extract_article_text(self, url: str) -> str:
        """Extract text content from a given URL."""
        cache_key = f"article_{hashlib.md5(url.encode()).hexdigest()}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
                
            paragraphs = soup.find_all('p')
            text = ' '.join([p.get_text() for p in paragraphs])
            
            # Clean up the text
            text = ' '.join(text.split())
            self.cache[cache_key] = text
            return text
        except Exception as e:
            self.logger.error(f"Error extracting text from {url}: {str(e)}")
            return ""
    
    def check_nli(self, premise: str, hypothesis: str) -> Dict[str, float]:
        """Check natural language inference between premise and hypothesis."""
        try:
            inputs = self.nli_tokenizer(premise, hypothesis, return_tensors="pt", 
                                      truncation=True, max_length=512).to(self.device)
            
            with torch.no_grad():
                outputs = self.nli_model(**inputs)
            
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            labels = ["entailment", "neutral", "contradiction"]
            return {label: probs[0][i].item() for i, label in enumerate(labels)}
        except Exception as e:
            self.logger.error(f"Error in NLI check: {str(e)}")
            return {"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0}

    def verify_fact(self, fact: str, article_text: str) -> Dict[str, Any]:
        """Verify a single fact against article text."""
        nli_results = self.check_nli(article_text, fact)
        
        # Determine verification result based on NLI scores
        if nli_results["entailment"] > 0.5:
            result = "Supported"
            confidence = nli_results["entailment"]
        elif nli_results["contradiction"] > 0.5:
            result = "Contradicted"
            confidence = nli_results["contradiction"]
        else:
            result = "Inconclusive"
            confidence = max(nli_results.values())
        
        return {
            "result": result,
            "confidence": confidence,
            "nli_result": nli_results
        }

    def process_single_fact(self, fact: str, max_articles: int = 5) -> List[Dict[str, Any]]:
        """Process a single fact and ensure we get valid results with URLs."""
        search_query = f"{fact} news fact check"
        urls = self.search_google(search_query, max_articles * 2)  # Get more URLs initially
        results = []
        attempted_urls = set()
        
        # Keep trying until we get 5 valid results or run out of URLs
        while len(results) < max_articles and urls:
            url = urls.pop(0)
            
            # Skip if we've already tried this URL
            if url in attempted_urls:
                continue
                
            attempted_urls.add(url)
            
            try:
                article_text = self.extract_article_text(url)
                if article_text:  # Only process if we got valid text
                    verification_result = self.verify_fact(fact, article_text)
                    
                    if verification_result["confidence"] > 0.1:  # Only include results with meaningful confidence
                        results.append({
                            "fact": fact,
                            "url": url,
                            "verification_result": verification_result
                        })
            except Exception as e:
                self.logger.error(f"Error processing URL {url}: {str(e)}")
                continue
        
        # If we still don't have enough results, try another search with different terms
        if len(results) < max_articles:
            alternative_query = f"{fact} verify source"
            additional_urls = self.search_google(alternative_query, max_articles - len(results))
            
            for url in additional_urls:
                if url not in attempted_urls and len(results) < max_articles:
                    try:
                        article_text = self.extract_article_text(url)
                        if article_text:
                            verification_result = self.verify_fact(fact, article_text)
                            
                            if verification_result["confidence"] > 0.1:
                                results.append({
                                    "fact": fact,
                                    "url": url,
                                    "verification_result": verification_result
                                })
                    except Exception as e:
                        self.logger.error(f"Error processing additional URL {url}: {str(e)}")
                        continue
        
        # Pad results with placeholders if we still don't have enough
        while len(results) < max_articles:
            backup_search_query = f"{fact} reference"
            try:
                backup_urls = self.search_google(backup_search_query, 1)
                url = backup_urls[0] if backup_urls else ""
                
                results.append({
                    "fact": fact,
                    "url": url,
                    "verification_result": {
                        "result": "Inconclusive",
                        "confidence": 0.1,
                        "nli_result": {"entailment": 0.1, "neutral": 0.8, "contradiction": 0.1}
                    }
                })
            except:
                # If all else fails, add an empty result
                results.append({
                    "fact": fact,
                    "url": "",
                    "verification_result": {
                        "result": "Inconclusive",
                        "confidence": 0.0,
                        "nli_result": {"entailment": 0, "neutral": 1, "contradiction": 0}
                    }
                })
        
        return results[:max_articles]
    
    def process_resolved_facts(self, resolved_facts: List[str], max_articles: int = 5) -> List[Dict[str, Any]]:
        """Process multiple facts concurrently."""
        all_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_fact = {executor.submit(self.process_single_fact, fact, max_articles): fact 
                            for fact in resolved_facts}
            for future in concurrent.futures.as_completed(future_to_fact):
                fact = future_to_fact[future]
                try:
                    results = future.result()
                    all_results.extend(results)
                except Exception as exc:
                    self.logger.error(f"{fact} generated an exception: {exc}")
        
        self.logger.info(f"Total results processed: {len(all_results)}")
        return all_results

def main():
    fact_checker = FactChecker()
    
    # Example facts to verify
    resolved_facts = [
        "Mentally ill inmates in Miami are housed on the \"forgotten floor\" Judge Steven Leifman says most are there as a result of \"avoidable felonies\"",
        "Leifman says the system is unjust and he's fighting for change .",
        "While CNN tours facility, patient shouts: \"I am the son of the president.\""
    ]
    
    # Process facts and measure execution time
    start_time = time.time()
    results = fact_checker.process_resolved_facts(resolved_facts)
    end_time = time.time()
    
    # Print results
    for i, result in enumerate(results, 1):
        print(f"Result {i}:")
        print(f"Fact: {result['fact']}")
        print(f"Source URL: {result['url']}")
        print(f"Verification Result: {result['verification_result']['result']}")
        print("---")
    
    print(f"Total Execution Time: {end_time - start_time:.2f} seconds")
    print(f"Total Results: {len(results)}")

if __name__ == "__main__":
    main()
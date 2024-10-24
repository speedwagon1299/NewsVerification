import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
import spacy
from typing import Dict, Any, List
import requests
from bs4 import BeautifulSoup
from googlesearch import search
from readability import Document
import concurrent.futures
import hashlib
import os
import pickle
import time

class FactChecker:
    def __init__(self):
        # Check if GPU is available
        self.device = 0 if torch.cuda.is_available() else -1
        
        # Load the NLI model
        self.nli_model_name = "typeform/distilbert-base-uncased-mnli"
        self.nli_tokenizer = AutoTokenizer.from_pretrained(self.nli_model_name)
        self.nli_model = AutoModelForSequenceClassification.from_pretrained(self.nli_model_name)
        if self.device >= 0:
            self.nli_model.to(f'cuda:{self.device}')
        
        # Load spaCy model for linguistic analysis
        self.nlp = spacy.load("en_core_web_md")
        
        # Initialize QA pipeline
        self.qa_pipeline = pipeline(
            "question-answering",
            model="distilbert-base-cased-distilled-squad",
            tokenizer="distilbert-base-cased-distilled-squad",
            device=self.device
        )
        
        # Setup cache directories
        self.cache_dir = "cache"
        os.makedirs(self.cache_dir, exist_ok=True)
        self.search_cache = os.path.join(self.cache_dir, "search_cache.pkl")
        self.article_cache = os.path.join(self.cache_dir, "article_cache.pkl")
        
        # Load caches if they exist
        if os.path.exists(self.search_cache):
            with open(self.search_cache, 'rb') as f:
                self.search_cache_data = pickle.load(f)
        else:
            self.search_cache_data = {}
        
        if os.path.exists(self.article_cache):
            with open(self.article_cache, 'rb') as f:
                self.article_cache_data = pickle.load(f)
        else:
            self.article_cache_data = {}
    
    def search_google(self, query: str, num_results: int = 3) -> List[str]:
        query_hash = hashlib.md5(query.encode()).hexdigest()
        if query_hash in self.search_cache_data:
            return self.search_cache_data[query_hash]
        
        try:
            urls = list(search(query, num=num_results, stop=num_results))
            self.search_cache_data[query_hash] = urls
            return urls
        except Exception as e:
            print(f"Error during Google search for query '{query}': {str(e)}")
            return []
    
    def extract_article_text(self, url: str) -> str:
        if url in self.article_cache_data:
            return self.article_cache_data[url]
        
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            doc = Document(response.text)
            article_html = doc.summary()
            soup = BeautifulSoup(article_html, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)
            self.article_cache_data[url] = text
            return text
        except Exception as e:
            print(f"Error extracting text from {url}: {str(e)}")
            return ""
    
    def check_nli(self, premise: str, hypothesis: str) -> Dict[str, float]:
        formatted_premise = f"Context: {premise}"
        formatted_hypothesis = f"Statement to verify: {hypothesis}"
        
        inputs = self.nli_tokenizer(
            formatted_premise,
            formatted_hypothesis,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )
        
        if self.device >= 0:
            inputs = {k: v.to(f'cuda:{self.device}') for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.nli_model(**inputs)
        
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        labels = ["entailment", "neutral", "contradiction"]
        return {label: probs[0][i].item() for i, label in enumerate(labels)}
    
    def extract_evidence(self, fact: str, article_text: str) -> str:
        question = f"What part of the text supports or contradicts this statement: {fact}"
        
        try:
            result = self.qa_pipeline(
                question=question,
                context=article_text,
                max_answer_length=200
            )
            return result.get('answer', '')
        except Exception as e:
            print(f"QA pipeline error: {str(e)}")
            return ""
    
    def analyze_linguistic_features(self, text: str) -> Dict[str, Any]:
        doc = self.nlp(text)
        return {
            'negations': [token.text for token in doc if token.dep_ == "neg"],
            'entities': [(ent.text, ent.label_) for ent in doc.ents],
            'key_phrases': [chunk.text for chunk in doc.noun_chunks]
        }
    
    def verify_fact(self, fact: str, article_text: str) -> Dict[str, Any]:
        nli_result = self.check_nli(article_text, fact)
        evidence = self.extract_evidence(fact, article_text)
        fact_features = self.analyze_linguistic_features(fact)
        evidence_features = self.analyze_linguistic_features(evidence)
        
        weights = {
            'nli': 0.7,
            'linguistic': 0.3
        }
        
        nli_score = nli_result.get('entailment', 0) - nli_result.get('contradiction', 0)
        linguistic_match = (
            len(set(fact_features['key_phrases']).intersection(evidence_features['key_phrases'])) /
            max(len(fact_features['key_phrases']), 1)
        )
        
        combined_score = (
            weights['nli'] * nli_score +
            weights['linguistic'] * linguistic_match
        )
        
        if combined_score > 0.5:
            result = "Supported"
        elif combined_score < -0.5:
            result = "Contradicted"
        else:
            result = "Inconclusive"
        
        return {
            "result": result,
            "confidence": abs(combined_score),
            "nli_result": nli_result,
            "evidence": evidence,
            "linguistic_analysis": {
                "fact_features": fact_features,
                "evidence_features": evidence_features
            }
        }
    
    def process_single_fact_url(self, fact: str, url: str, results: List[Dict[str, Any]]):
        article_text = self.extract_article_text(url)
        if article_text:
            verification_result = self.verify_fact(fact, article_text)
            
            results.append({
                "fact": fact,
                "url": url,
                "verification_result": verification_result
            })
            
            if verification_result["result"] in ["Supported", "Contradicted"] and verification_result["confidence"] > 0.7:
                return True
        
        return False
    
    def process_resolved_facts(self, resolved_facts: List[str], max_articles: int = 3) -> List[Dict[str, Any]]:
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            for fact in resolved_facts:
                urls = self.search_google(fact, max_articles)
                for url in urls:
                    future = executor.submit(self.process_single_fact_url, fact, url, results)
                    if future.result():
                        break
        
        return results
    
    def __del__(self):
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
        with open(self.search_cache, 'wb') as f:
            pickle.dump(self.search_cache_data, f)
        with open(self.article_cache, 'wb') as f:
            pickle.dump(self.article_cache_data, f)

def main():
    fact_checker = FactChecker()
    
    resolved_facts = [
        "The company reported a 10% increase in revenue.",
        "New product launches contributed significantly to growth.",
        "The CEO announced plans for international expansion."
    ]
    
    start_time = time.time()
    results = fact_checker.process_resolved_facts(resolved_facts)
    end_time = time.time()
    
    for result in results:
        print(f"Fact: {result['fact']}")
        print(f"Source URL: {result['url']}")
        print(f"Verification Result: {result['verification_result']['result']}")
        print(f"Confidence Score: {result['verification_result']['confidence']:.2f}")
        print(f"Supporting Evidence: {result['verification_result']['evidence']}")
        print("---")
    
    print(f"Total Execution Time: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()
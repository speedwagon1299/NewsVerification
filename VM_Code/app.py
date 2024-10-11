from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import PegasusForConditionalGeneration, PegasusTokenizer
from peft import PeftModel
import spacy
import os
import requests
from readability import Document
from bs4 import BeautifulSoup

app = FastAPI()

# Initialize spaCy model and coreferee
nlp = spacy.load('en_core_web_md')
nlp.add_pipe('coreferee')

# Define the device (use GPU if available)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Define the local model path
local_model_path = os.path.join("/home/azureuser/cloudfiles/data","lora-pegasus-model")

# Load the pre-trained tokenizer and the fine-tuned LoRA model
tokenizer = PegasusTokenizer.from_pretrained('google/pegasus-large')
base_model = PegasusForConditionalGeneration.from_pretrained("google/pegasus-large").to(device)
lora_model = PeftModel.from_pretrained(base_model, local_model_path).to(device)


class TextRequest(BaseModel):
    text: str
    max_length: int = 128
    num_beams: int = 5

def replace_coreferences_to_list(text):
    # Process the input text with spaCy and coreferee
    doc = nlp(text)
    resolved_sentences = []
    current_sentence = ""

    for token in doc:
        # Resolve the coreference of the token if available
        repres = doc._.coref_chains.resolve(token)
        if repres:
            # Join the resolved tokens with 'and' if multiple tokens are resolved, then add to current_sentence
            current_sentence += " " + " and ".join([t.text for t in repres])
        else:
            current_sentence += " " + token.text

        # If the token is the end of a sentence, add the current sentence to the list
        if token.is_sent_end:
            resolved_sentences.append(current_sentence.strip())
            current_sentence = ""  # Reset for the next sentence
    
    return resolved_sentences

@app.post("/summarize")
def summarize(request: TextRequest):
    try:
        # Tokenize the input text for the model
        response = requests.get(request.text)
        doc = Document(response.text)
        article_html = doc.summary()  # Extract HTML of the main article content

        # Use BeautifulSoup to clean up the HTML and extract plain text
        soup = BeautifulSoup(article_html, 'html.parser')
        article_text = soup.get_text()
        inputs = tokenizer(
            article_text,
            max_length=512,
            truncation=True,
            return_tensors="pt"
        ).to(device)

        # Generate the summary using the model
        with torch.no_grad():
            output = lora_model.generate(
                **inputs,
                max_length=request.max_length,
                num_beams=request.num_beams,
                early_stopping=True
            )

        # Decode the generated summary
        summary = tokenizer.decode(output[0], skip_special_tokens=True)

        # Process the summary with coreference resolution
        resolved_sentences = replace_coreferences_to_list(summary)

        # The resolved sentences can be sent back as a list of facts or joined into a single response.
        return {
            "summary": summary,
            "resolved_facts": resolved_sentences  # List of individual factual statements
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {"status": "Model is running"}

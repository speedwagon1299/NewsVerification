from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import PegasusForConditionalGeneration, PegasusTokenizer
import torch

# Initialize FastAPI app
app = FastAPI()

# Load your fine-tuned model and tokenizer
model_name = "path"  # Use your fine-tuned model path here
tokenizer = PegasusTokenizer.from_pretrained(model_name)
model = PegasusForConditionalGeneration.from_pretrained(model_name)

# Define input schema
class Article(BaseModel):
    text: str

# API endpoint to summarize the text
@app.post("/summarize/")
async def summarize(article: Article):
    try:
        # Tokenize the input text
        inputs = tokenizer(article.text, return_tensors="pt", truncation=True, padding="longest", max_length=512)

        # Generate the summary using the model
        summary_ids = model.generate(inputs["input_ids"], max_length=128, num_beams=4, early_stopping=True)

        # Decode the summary
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with `uvicorn app:app --reload` from command line

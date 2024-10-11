from transformers import PegasusForConditionalGeneration, PegasusTokenizer, DataCollatorForSeq2Seq, AutoTokenizer, AutoModelForSeq2SeqLM, Trainer, TrainingArguments
import transformers
import pandas as pd
from datasets import Dataset
import json
from peft import get_peft_model, LoraConfig, TaskType, PeftModel

# Load model directly

tokenizer = AutoTokenizer.from_pretrained("google/pegasus-large")
model = AutoModelForSeq2SeqLM.from_pretrained("google/pegasus-large")

data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)

from datasets import load_from_disk

# Load the dataset from disk
tokenized_dataset = load_from_disk("tokenized_subset_cnn_dailymail")

split_dataset = tokenized_dataset.train_test_split(test_size=0.1)

train_dataset = split_dataset['train']
val_dataset = split_dataset['test']
tokenized_train_dataset = train_dataset.remove_columns(['article', 'highlights', 'id'])
tokenized_val_dataset = val_dataset.remove_columns(['article', 'highlights', 'id'])

print(f"Train size: {len(tokenized_train_dataset)}")
print(tokenized_train_dataset.column_names)
print(f"Validation size: {len(tokenized_val_dataset)}")

lora_config = LoraConfig(
    task_type=TaskType.SEQ_2_SEQ_LM,  # Sequence-to-sequence task
    r=4,  # Rank of the low-rank adaptation matrices
    lora_alpha=32,  # Scaling factor for LoRA layers
    lora_dropout=0.1,  # Dropout rate for LoRA layers
    target_modules=["q_proj", "v_proj"],  # Target modules to apply LoRA (query and value projections)
)

lora_model = get_peft_model(model, lora_config)

training_args = TrainingArguments(
    output_dir='./results',
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    learning_rate=1e-4,
    num_train_epochs=1,
    evaluation_strategy='epoch',
    save_strategy="epoch",
    logging_steps=100,
    fp16=True,  # Enable mixed precision if using a compatible GPU
    report_to="none",  # Disable unnecessary logging to external systems like WandB
)


trainer = Trainer(
    model=lora_model,
    args=training_args,
    train_dataset=tokenized_train_dataset,
    eval_dataset=tokenized_val_dataset,
    data_collator = data_collator
)

training_output = trainer.train()

lora_model.save_pretrained("./lora-pegasus")

train_metrics = training_output.metrics
log_history = trainer.state.log_history
print(f"Training Loss: {train_metrics['train_loss']}")
print(f"Training Runtime: {train_metrics['train_runtime']} seconds")
print(f"Training Samples Per Second: {train_metrics['train_samples_per_second']}")

for log in log_history:
    print(log)

with open('training_logs.json', 'w') as f:
    json.dump(log_history, f, indent=4)

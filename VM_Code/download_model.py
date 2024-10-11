from azureml.core import Workspace, Dataset
import os

# Connect to your Azure ML workspace
ws = Workspace.from_config()  # Assumes config.json is in your working directory

# Define the target local path where the model files will be downloaded
local_model_path = "/home/azureuser/cloudfiles/data/lora-pegasus-model"
os.makedirs(local_model_path, exist_ok=True)

# Load the dataset using the registered path in the datastore
dataset = Dataset.File.from_files(
    path=[
        (
            ws.datastores['workspaceblobstore'], 
            'UI/2024-10-09_192254_UTC/lora-pegasus/'
        )
    ]
)

# Download the files to the specified local directory
dataset.download(target_path=local_model_path, overwrite=True)

print(f"Model files downloaded to: {local_model_path}")
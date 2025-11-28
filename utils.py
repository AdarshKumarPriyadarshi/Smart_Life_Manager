import json
import yaml
import logging

def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)

def setup_logging(debug=False):
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level, format='%(asctime)s - %(levelname)s - %(message)s')

def export_to_json(data, filepath):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
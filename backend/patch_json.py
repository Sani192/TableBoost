import os
import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find json={...} and add "amount": 10.00 if missing
    def replace_json(match):
        inner = match.group(1)
        if '"amount"' not in inner and "'amount'" not in inner:
            return f"json={{{inner}, 'amount': 10.00}}"
        return match.group(0)

    new_content = re.sub(r'json=\{([^}]*)\}', replace_json, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('tests'):
    for file in files:
        if file.endswith('.py'):
            patch_file(os.path.join(root, file))

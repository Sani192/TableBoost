import os
import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If VisitCreate is called without amount, add it
    # We will use regex to find VisitCreate(...) and check if amount= is in it.
    
    # Simple replacement:
    # Find all VisitCreate(...) calls
    def replace_visit_create(match):
        inner = match.group(1)
        if 'amount=' not in inner:
            # check if there's any positional arg
            if inner.strip() == '':
                return "VisitCreate(amount=Decimal('10.00'))"
            return f"VisitCreate(amount=Decimal('10.00'), {inner})"
        return match.group(0)

    new_content = re.sub(r'VisitCreate\((.*?)\)', replace_visit_create, content)
    
    if new_content != content:
        # ensure from decimal import Decimal is present
        if 'from decimal import Decimal' not in new_content:
            new_content = 'from decimal import Decimal\n' + new_content
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('tests'):
    for file in files:
        if file.endswith('.py'):
            patch_file(os.path.join(root, file))

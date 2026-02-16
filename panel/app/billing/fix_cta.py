with open('page.tsx', 'r') as f:
    lines = f.readlines()

# Find line with "import {t, normLang}" and add BillingCTA import after it
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'import {t, normLang} from "../_lib/i18n";' in line:
        new_lines.append('import BillingCTA from "./_components/BillingCTA";\n')
    # Remove startCheckout import
    if 'import { startCheckout } from "./actions";' in line:
        new_lines.pop()  # Remove the line we just added

# Find and replace the CTA block (lines 194-257)
final_lines = []
skip_until_closing = False
indent_count = 0

for i, line in enumerate(new_lines):
    line_num = i + 1
    
    # Start skipping at line 194
    if '{currentPlan === "platinum" ?' in line:
        skip_until_closing = True
        indent_count = 0
        # Add the BillingCTA component instead
        final_lines.append('      <BillingCTA currentPlan={currentPlan} lang={lang} />\n')
        continue
    
    if skip_until_closing:
        # Count braces to find matching closing
        indent_count += line.count('(') - line.count(')')
        # When we find the closing ")}" at the same indent level, stop skipping
        if ')}' in line and indent_count <= 0:
            skip_until_closing = False
        continue
    
    # Skip startCheckout import
    if 'import { startCheckout } from "./actions";' in line:
        continue
        
    final_lines.append(line)

with open('page.tsx', 'w') as f:
    f.writelines(final_lines)

print("✓ Replaced CTA section with BillingCTA component")

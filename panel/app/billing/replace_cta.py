with open('page.tsx', 'r') as f:
    content = f.read()

# 1. Add import
content = content.replace(
    'import {t, normLang} from "../_lib/i18n";',
    'import {t, normLang} from "../_lib/i18n";\nimport BillingCTA from "./_components/BillingCTA";'
)

# 2. Remove startCheckout import
content = content.replace('import { startCheckout } from "./actions";\n', '')

# 3. Find exact start of CTA block: "      {currentPlan === "platinum" ? ("
# and end with "      )}"
# Replace everything between with just BillingCTA

start_marker = '      {currentPlan === "platinum" ? ('
end_marker = '      )}'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find start marker")
    exit(1)

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("ERROR: Could not find end marker")
    exit(1)

# Include the end_marker length
end_idx += len(end_marker)

# Replace with BillingCTA
new_content = (
    content[:start_idx] +
    '      <BillingCTA currentPlan={currentPlan} lang={lang} />' +
    content[end_idx:]
)

with open('page.tsx', 'w') as f:
    f.write(new_content)

print("✓ Successfully replaced CTA section")

#!/usr/bin/env python3
"""
Fix multi-tenancy: Replace `db.` with `udb.` in all authenticated routes.
The approach:
1. Add get_user_db helper function
2. For each function that takes current_user (authenticated), 
   add `udb = get_user_db(current_user)` and replace `db.` with `udb.` 
   within that function body.
3. Leave non-authenticated functions unchanged.
4. Leave tenant management routes that explicitly use master_db unchanged.
"""

import re

with open('/app/backend/server.py', 'r') as f:
    lines = f.readlines()

# Find all function boundaries
functions = []
current_func = None
indent_level = 0

for i, line in enumerate(lines):
    # Detect function start
    match = re.match(r'^(async\s+)?def\s+(\w+)\s*\(', line)
    if match:
        if current_func:
            current_func['end'] = i - 1
            functions.append(current_func)
        current_func = {
            'name': match.group(2),
            'start': i,
            'end': None,
            'has_current_user': 'current_user' in line or 'Depends(get_current_user)' in line,
            'line': line
        }
    # Also check if current_user is on a continuation line
    elif current_func and current_func['start'] == i - 1 and 'current_user' in line:
        current_func['has_current_user'] = True

if current_func:
    current_func['end'] = len(lines) - 1
    functions.append(current_func)

# Functions that should NOT be modified (they handle their own db logic)
skip_functions = {
    'create_tenant', 'get_tenants', 'update_tenant', 'toggle_tenant',
    'tenant_login', 'get_tenant_stats',
    'startup_db_client', 'shutdown_db_client', 'root',
    'register', 'login', 'get_cashiers',  # These are master-only
    'get_current_user', 'hash_password', 'verify_password', 
    'create_token', 'generate_id', 'generate_order_no',
    'log_audit',  # uses db but we'll handle separately
}

# Find functions that need transformation
functions_to_fix = []
for func in functions:
    if func['has_current_user'] and func['name'] not in skip_functions:
        functions_to_fix.append(func)

print(f"Total functions: {len(functions)}")
print(f"Authenticated functions to fix: {len(functions_to_fix)}")
for f in functions_to_fix:
    print(f"  - {f['name']} (lines {f['start']+1}-{f['end']+1})")

# Now do the actual replacement
# Step 1: We'll work from bottom to top to preserve line numbers

# First, let's identify lines to modify
modifications = []
for func in functions_to_fix:
    # Find the first line of function body (after the def line, accounting for decorators)
    body_start = func['start'] + 1
    # Skip any continuation lines of the function signature
    while body_start < func['end'] and (lines[body_start].strip().startswith(')') or 
                                          lines[body_start].strip() == '' or
                                          not lines[body_start].strip()):
        body_start += 1
    
    # Find the indentation of the body
    if body_start <= func['end']:
        body_line = lines[body_start]
        indent = len(body_line) - len(body_line.lstrip())
        indent_str = ' ' * indent
    else:
        indent_str = '    '  # default
    
    # Collect lines within this function that have `db.` (but not `master_db.` or `tenant_db.` or `_db`)
    db_lines = []
    for i in range(func['start'], min(func['end'] + 1, len(lines))):
        line = lines[i]
        # Replace `await db.` or just `db.` references (but not master_db, tenant_db, _db, tdb)
        # We need to be careful: only replace standalone `db.` references
        if re.search(r'(?<![a-zA-Z_])db\.', line) and 'master_db.' not in line and 'tenant_db.' not in line and 'tdb.' not in line and '_db.' not in line:
            db_lines.append(i)
    
    if db_lines:
        modifications.append({
            'func_name': func['name'],
            'body_start': body_start,
            'indent': indent_str,
            'db_lines': db_lines
        })

print(f"\nFunctions with db. references to replace: {len(modifications)}")
for m in modifications:
    print(f"  - {m['func_name']}: {len(m['db_lines'])} db references")

# Now apply modifications (bottom to top)
# First, replace db. with udb. in identified lines
for mod in reversed(modifications):
    for line_idx in mod['db_lines']:
        lines[line_idx] = re.sub(r'(?<![a-zA-Z_])db\.', 'udb.', lines[line_idx])
    
    # Insert `udb = get_user_db(current_user)` at the start of function body
    insert_line = mod['body_start']
    lines.insert(insert_line, f"{mod['indent']}udb = get_user_db(current_user)\n")

# Add the get_user_db helper function after the get_tenant_db function
# Find where to insert it
for i, line in enumerate(lines):
    if 'def get_tenant_db' in line:
        # Find the end of this function (next line that's not indented under it)
        j = i + 1
        while j < len(lines) and (lines[j].startswith(' ') or lines[j].strip() == ''):
            j += 1
        # Insert after
        helper = '''
def get_user_db(current_user: dict):
    """Return tenant DB if user is a tenant user, otherwise master DB"""
    return current_user.get("_db", db)

'''
        lines.insert(j, helper)
        break

# Also fix log_audit - it uses db but is called from within authenticated routes
# We need to make log_audit accept a db parameter
# Find log_audit function
for i, line in enumerate(lines):
    if 'async def log_audit(' in line:
        print(f"\nFound log_audit at line {i+1}: {line.strip()}")
        break

# Write the result
with open('/app/backend/server.py', 'w') as f:
    f.writelines(lines)

print("\n✅ Transformation complete!")
print(f"Modified {len(modifications)} functions")

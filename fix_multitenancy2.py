#!/usr/bin/env python3
"""
Second pass: Fix remaining routes that have current_user but use `db.` instead of `udb.`
These were missed because current_user was on a different line from `async def`.
"""
import re

with open('/app/backend/server.py', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Find all function blocks and their ranges
functions = []
func_starts = []
for i, line in enumerate(lines):
    if re.match(r'^(async\s+)?def\s+\w+', line):
        func_starts.append(i)

for idx, start in enumerate(func_starts):
    end = func_starts[idx + 1] - 1 if idx + 1 < len(func_starts) else len(lines) - 1
    # Check if this function has current_user anywhere in its signature (first few lines)
    sig_end = min(start + 10, end)
    sig_text = '\n'.join(lines[start:sig_end])
    has_current_user = 'current_user' in sig_text and 'Depends(get_current_user)' in sig_text
    
    # Check if function body still has `db.` (not udb., master_db., tenant_db., tdb.)
    body_has_db = False
    db_lines = []
    for j in range(start, end + 1):
        if re.search(r'(?<![a-zA-Z_])db\.', lines[j]) and \
           'master_db.' not in lines[j] and 'tenant_db.' not in lines[j] and \
           'tdb.' not in lines[j] and '_db.' not in lines[j] and \
           'udb.' not in lines[j]:
            body_has_db = True
            db_lines.append(j)
    
    # Check if already has `udb = get_user_db`
    has_udb = any('udb = get_user_db' in lines[j] for j in range(start, min(start + 15, end + 1)))
    
    func_name_match = re.match(r'(async\s+)?def\s+(\w+)', lines[start])
    func_name = func_name_match.group(2) if func_name_match else 'unknown'
    
    if has_current_user and body_has_db and not has_udb:
        functions.append({
            'name': func_name,
            'start': start,
            'end': end,
            'db_lines': db_lines
        })

print(f"Functions needing second-pass fix: {len(functions)}")
for f in functions:
    print(f"  - {f['name']} (lines {f['start']+1}-{f['end']+1}): {len(f['db_lines'])} db. refs")

# Apply fixes from bottom to top
for func in reversed(functions):
    # Replace db. with udb. in identified lines
    for line_idx in func['db_lines']:
        lines[line_idx] = re.sub(r'(?<![a-zA-Z_])db\.', 'udb.', lines[line_idx])
    
    # Find where to insert `udb = get_user_db(current_user)`
    # Look for the first line of function body (after ): and any docstring)
    body_start = func['start'] + 1
    # Skip continuation of function signature
    while body_start <= func['end']:
        stripped = lines[body_start].strip()
        if stripped == '' or stripped.startswith(')') or stripped.startswith('#'):
            body_start += 1
            continue
        # Check if it's a function parameter line
        if 'current_user' in stripped or stripped.endswith(',') or stripped.startswith('current_user'):
            body_start += 1
            continue
        break
    
    # Get indentation
    if body_start <= func['end']:
        indent = len(lines[body_start]) - len(lines[body_start].lstrip())
    else:
        indent = 4
    
    indent_str = ' ' * indent
    lines.insert(body_start, f"{indent_str}udb = get_user_db(current_user)")

# Also fix log_audit to accept an optional db param
# Find and replace log_audit definition
for i, line in enumerate(lines):
    if 'async def log_audit(' in line and 'user_id: str' in line:
        # Replace with version that accepts db
        lines[i] = line.replace(
            'async def log_audit(user_id: str, username: str, action: str, target_type: str, target_id: str = "", detail: str = ""):',
            'async def log_audit(user_id: str, username: str, action: str, target_type: str, target_id: str = "", detail: str = "", audit_db=None):'
        )
        # Fix the next line that uses db.audit_logs
        if i + 1 < len(lines) and 'await db.audit_logs' in lines[i + 1]:
            lines[i + 1] = lines[i + 1].replace('await db.audit_logs', 'await (audit_db or db).audit_logs')
        print(f"Fixed log_audit at line {i+1}")
        break

# Now update all log_audit calls to pass the db
for i, line in enumerate(lines):
    if 'await log_audit(' in line and 'audit_db' not in line:
        # Check if udb is available in context (look upward for udb definition)
        has_udb = False
        for j in range(max(0, i - 30), i):
            if 'udb = get_user_db' in lines[j]:
                has_udb = True
                break
        if has_udb:
            # Add audit_db=udb to the call
            lines[i] = line.rstrip().rstrip(')') + ', audit_db=udb)'
            if lines[i].count('(') != lines[i].count(')'):
                # Fix imbalanced parens
                lines[i] = line.rstrip()
                if lines[i].endswith(')'):
                    lines[i] = lines[i][:-1] + ', audit_db=udb)'

# Also fix get_audit_logs which uses db directly
for i, line in enumerate(lines):
    if 'async def get_audit_logs(' in line:
        # Check next ~20 lines for db. references
        for j in range(i, min(i + 25, len(lines))):
            if re.search(r'(?<![a-zA-Z_])db\.', lines[j]) and 'udb.' not in lines[j]:
                lines[j] = re.sub(r'(?<![a-zA-Z_])db\.', 'udb.', lines[j])
        # Check if it has current_user
        sig = '\n'.join(lines[i:i+10])
        if 'current_user' in sig and 'udb = get_user_db' not in '\n'.join(lines[i:i+15]):
            # Find body start
            for j in range(i + 1, min(i + 10, len(lines))):
                stripped = lines[j].strip()
                if stripped and not stripped.startswith(')') and 'current_user' not in stripped and not stripped.endswith(','):
                    indent = len(lines[j]) - len(lines[j].lstrip())
                    lines.insert(j, ' ' * indent + 'udb = get_user_db(current_user)')
                    break
        break

# Fix get_profit_analysis similarly
for i, line in enumerate(lines):
    if 'async def get_profit_analysis(' in line:
        sig = '\n'.join(lines[i:i+10])
        if 'current_user' in sig:
            for j in range(i, min(i + 30, len(lines))):
                if re.search(r'(?<![a-zA-Z_])db\.', lines[j]) and 'udb.' not in lines[j]:
                    lines[j] = re.sub(r'(?<![a-zA-Z_])db\.', 'udb.', lines[j])
            if 'udb = get_user_db' not in '\n'.join(lines[i:i+15]):
                for j in range(i + 1, min(i + 10, len(lines))):
                    stripped = lines[j].strip()
                    if stripped and not stripped.startswith(')') and 'current_user' not in stripped and not stripped.endswith(','):
                        indent = len(lines[j]) - len(lines[j].lstrip())
                        lines.insert(j, ' ' * indent + 'udb = get_user_db(current_user)')
                        break
        break

with open('/app/backend/server.py', 'w') as f:
    f.write('\n'.join(lines))

print("\n✅ Second pass complete!")

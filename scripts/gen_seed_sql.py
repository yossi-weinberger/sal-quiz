import json, sys

def escape_sql(s):
    return s.replace("'", "''")

with open('data/products.json', encoding='utf-8') as f:
    products = json.load(f)

rows = []
for p in products:
    name = escape_sql(p['name_he'])
    rows.append(f"({p['id']}, '{escape_sql(p['barcode'])}', '{name}', {p['official_price']}, '{p['image_path']}', {p['display_order']}, true)")

sql = 'INSERT INTO products (id, barcode, name_he, official_price, image_path, display_order, is_active) VALUES\n'
sql += ',\n'.join(rows)
sql += '\nON CONFLICT (id) DO NOTHING;'

with open('data/seed_products.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f'Products: {len(products)} rows')

with open('data/branches.json', encoding='utf-8') as f:
    branches = json.load(f)

brows = []
for b in branches:
    fmt = escape_sql(b.get('format_type', ''))
    name = escape_sql(b['branch_name'])
    city = escape_sql(b['city_name'])
    addr = escape_sql(b.get('address', ''))
    norm = escape_sql(b['normalized_city_name'])
    brows.append(f"({b['id']}, '{fmt}', '{name}', '{city}', '{addr}', '{norm}')")

bsql = 'INSERT INTO branches (id, format_type, branch_name, city_name, address, normalized_city_name) VALUES\n'
bsql += ',\n'.join(brows)
bsql += '\nON CONFLICT (id) DO NOTHING;'

with open('data/seed_branches.sql', 'w', encoding='utf-8') as f:
    f.write(bsql)

print(f'Branches: {len(branches)} rows')

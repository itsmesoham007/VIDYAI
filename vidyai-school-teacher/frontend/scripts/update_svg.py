import base64

with open(r'vidyai-school-teacher\frontend\public\logo.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>'''

with open(r'vidyai-school-teacher\frontend\public\icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

with open(r'vidyai-school-teacher\frontend\src\app\icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Updated public/icon.svg and src/app/icon.svg successfully!')

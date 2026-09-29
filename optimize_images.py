import urllib.request
from PIL import Image
import os

images = [
    ('hero.webp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mumbai%20Pune%20Expressway%20overview.jpg?width=2000'),
    ('sedan.webp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Maruti%20Suzuki%20Dzire%20VXi%20VVT%20-%20Subcompact%20Car%20-%20Kolkata%202018-01-17%207574.JPG?width=1000'),
    ('suv.webp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota%20Innova%20Crysta%202.4%20Z%20front%20right.jpg?width=1000'),
    ('cta.webp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mumbai%20Pune%20Expressway%20overview.jpg?width=1800')
]

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')]
urllib.request.install_opener(opener)

for name, url in images:
    print(f'Downloading {name}...')
    urllib.request.urlretrieve(url, 'temp.jpg')
    im = Image.open('temp.jpg')
    im.save(name, 'WEBP', quality=80)
    os.remove('temp.jpg')
    print(f'Saved {name}')

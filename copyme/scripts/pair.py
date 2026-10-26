# python3 -I pair.py <a.png> <b.png> <out.png> [scale=0.5] [y0] [y1]
import sys
from PIL import Image
a, b, out = sys.argv[1:4]
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
A, B = Image.open(a), Image.open(b)
y0 = int(sys.argv[5]) if len(sys.argv) > 5 else 0
y1 = int(sys.argv[6]) if len(sys.argv) > 6 else max(A.height, B.height)
A, B = A.crop((0, y0, A.width, min(y1, A.height))), B.crop((0, y0, B.width, min(y1, B.height)))
o = Image.new("RGB", (A.width + B.width + 12, max(A.height, B.height)), (255, 0, 0))
o.paste(A, (0, 0)); o.paste(B, (A.width + 12, 0))
o.resize((int(o.width * scale), int(o.height * scale))).save(out)

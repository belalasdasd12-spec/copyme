# python3 -I diff.py <ref.png> <new.png> <outDir> [threshold=18] [cell=48] [maxCrops=6]
# python3 -I diff.py --dir <shotsDir> <outDir> [...]   → every <name>-ref.png / <name>-new.png pair (shoot.mjs output)
# Numbers first, eyes second: prints % of changed pixels and the worst regions, and saves full-scale crops
# (ref | new | heat) of only those regions → open the crops, not the whole screenshots.
# The threshold is strict on purpose (a slightly lighter text colour or a font-weight change must still show up).
import sys, os
from collections import deque
from PIL import Image, ImageChops

def compare(a_path, b_path, out, thr=18, cell=48, max_crops=6, tag="diff"):
    A, B = Image.open(a_path).convert("RGB"), Image.open(b_path).convert("RGB")
    notes = []
    if A.size != B.size:
        notes.append(f"size ref {A.size[0]}x{A.size[1]} vs new {B.size[0]}x{B.size[1]} (page height differs → layout gap)")
    w, h = min(A.width, B.width), min(A.height, B.height)
    A, B = A.crop((0, 0, w, h)), B.crop((0, 0, w, h))
    d = ImageChops.difference(A, B)
    r, g, b = d.split()
    mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
    mask = mx.point(lambda v: 255 if v > thr else 0)
    changed = sum(mask.histogram()[255:]) / (w * h) * 100
    cols, rows = (w + cell - 1) // cell, (h + cell - 1) // cell
    flag = {}
    for y in range(rows):
        for x in range(cols):
            box = (x * cell, y * cell, min(w, (x + 1) * cell), min(h, (y + 1) * cell))
            hist = mask.crop(box).histogram()
            ratio = hist[255] / ((box[2] - box[0]) * (box[3] - box[1]))
            if ratio > 0.004:
                flag[(x, y)] = ratio
    # connected regions of flagged cells (8-neighbour)
    seen, regions = set(), []
    for start in flag:
        if start in seen:
            continue
        q, cells = deque([start]), []
        seen.add(start)
        while q:
            c = q.popleft(); cells.append(c)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (c[0] + dx, c[1] + dy)
                    if n in flag and n not in seen:
                        seen.add(n); q.append(n)
        xs, ys = [c[0] for c in cells], [c[1] for c in cells]
        box = (min(xs) * cell, min(ys) * cell, min(w, (max(xs) + 1) * cell), min(h, (max(ys) + 1) * cell))
        score = sum(flag[c] for c in cells)
        regions.append((score, box))
    regions.sort(reverse=True)
    os.makedirs(out, exist_ok=True)
    lines = [f"{tag}: {changed:.2f}% pixels differ (thr {thr}), {len(regions)} region(s)" + ("; " + "; ".join(notes) if notes else "")]
    heat = mask.convert("RGB")
    for i, (score, box) in enumerate(regions[:max_crops]):
        pad = 16
        bx = (max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad))
        ca, cb, ch = A.crop(bx), B.crop(bx), heat.crop(bx)
        o = Image.new("RGB", (ca.width * 3 + 24, ca.height), (255, 0, 0))
        o.paste(ca, (0, 0)); o.paste(cb, (ca.width + 12, 0)); o.paste(ch, (ca.width * 2 + 24, 0))
        if o.width > 1800:  # keep crops readable but bounded
            o = o.resize((1800, int(o.height * 1800 / o.width)))
        p = os.path.join(out, f"{tag}-r{i + 1}.png")
        o.save(p)
        lines.append(f"  r{i + 1} x{bx[0]}-{bx[2]} y{bx[1]}-{bx[3]} score {score:.2f} → {p}")
    if len(regions) > max_crops:
        lines.append(f"  … {len(regions) - max_crops} smaller region(s) not cropped; fix the big ones and rerun")
    if not regions and not notes:
        lines.append("  no region over the threshold (still do the one full-size look per page before finishing)")
    return lines

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--dir":
        shots, out, *rest = args[1:]
        opts = [int(v) for v in rest]
        for f in sorted(os.listdir(shots)):
            if f.endswith("-ref.png") and os.path.exists(os.path.join(shots, f[:-8] + "-new.png")):
                name = f[:-8]
                print("\n".join(compare(os.path.join(shots, f), os.path.join(shots, name + "-new.png"), out, *opts, tag=name)))
    else:
        a, b, out, *rest = args
        print("\n".join(compare(a, b, out, *[int(v) for v in rest])))

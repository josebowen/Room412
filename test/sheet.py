import sys, glob
from PIL import Image
tag, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fs = sorted(glob.glob(f'test/out/{tag}-[0-9][0-9]-*.png'))
per = int(sys.argv[4]) if len(sys.argv) > 4 else 6
for k in range(0, len(fs), per):
    part = fs[k:k+per]; ims = [Image.open(f) for f in part]; r = tw / ims[0].width; th = int(ims[0].height * r)
    rows = (len(part) + cols - 1) // cols; s = Image.new('RGB', (cols * tw, rows * th), '#222')
    for i, im in enumerate(ims): s.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
    s.save(f'test/out/sheet-{tag}-{k//per}.png'); print(part)

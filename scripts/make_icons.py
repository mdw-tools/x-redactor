"""Draws the extension icons. No dependencies: python3 scripts/make_icons.py"""

import os
import struct
import zlib

SIZES = (16, 32, 48, 128)
SAMPLES = 4  # supersampling per axis, for anti-aliasing

# Shapes on a 128x128 grid: (left, top, right, bottom, corner radius, RGB), drawn in order.
SHAPES = (
    (0, 0, 128, 128, 28, (0x0F, 0x14, 0x19)),  # background
    (24, 28, 104, 44, 8, (0xE7, 0xE9, 0xEA)),  # text line
    (24, 56, 92, 74, 6, (0xF4, 0x21, 0x2E)),  # redaction bar
    (24, 86, 80, 102, 8, (0xE7, 0xE9, 0xEA)),  # text line
)


def inside(x, y, shape):
    left, top, right, bottom, radius, _ = shape
    if not (left <= x < right and top <= y < bottom):
        return False
    cx = min(max(x, left + radius), right - radius)
    cy = min(max(y, top + radius), bottom - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius**2


def pixel(px, py, size):
    scale = 128 / size
    r = g = b = a = 0.0
    for sy in range(SAMPLES):
        for sx in range(SAMPLES):
            x = (px + (sx + 0.5) / SAMPLES) * scale
            y = (py + (sy + 0.5) / SAMPLES) * scale
            color = None
            for shape in SHAPES:
                if inside(x, y, shape):
                    color = shape[5]
            if color:
                r, g, b, a = r + color[0], g + color[1], b + color[2], a + 1
    if not a:
        return bytes(4)
    return bytes((round(r / a), round(g / a), round(b / a), round(255 * a / SAMPLES**2)))


def png(size):
    rows = b"".join(b"\0" + b"".join(pixel(x, y, size) for x in range(size)) for y in range(size))

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b"")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(out, exist_ok=True)
    for size in SIZES:
        with open(os.path.join(out, f"icon{size}.png"), "wb") as f:
            f.write(png(size))

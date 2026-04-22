"""Theme color utilities for converting between HEX and HSL formats."""

import re
from typing import Tuple


def is_valid_hex(hex_color: str) -> bool:
    """Validate HEX color format.

    Args:
        hex_color: Color string to validate

    Returns:
        True if valid HEX format (#RGB, #RRGGBB, or RRGGBB)
    """
    if not hex_color:
        return False
    hex_color = hex_color.lstrip("#")
    return bool(re.match(r"^[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$", hex_color))


def is_valid_hsl(hsl: str) -> bool:
    """Validate HSL color format.

    Args:
        hsl: Color string to validate

    Returns:
        True if valid HSL format (h s l or h s% l%)
    """
    if not hsl:
        return False
    parts = hsl.replace("%", "").replace(",", " ").strip().split()
    if len(parts) != 3:
        return False
    try:
        h = float(parts[0])
        s = float(parts[1])
        l = float(parts[2])  # noqa: E741
        return 0 <= h <= 360 and 0 <= s <= 100 and 0 <= l <= 100
    except (ValueError, TypeError):
        return False


def normalize_hsl_triplet(hsl: str) -> str:
    """Normalize HSL input to model storage format: 'h s l' without percent signs."""
    if not is_valid_hsl(hsl):
        raise ValueError(f"Invalid HSL format: {hsl}")

    parts = hsl.replace("%", "").replace(",", " ").strip().split()
    h, s, l = (round(float(part)) for part in parts)
    return f"{h} {s} {l}"



def format_hsl_triplet(hsl: str) -> str:
    """Format stored HSL triplets for frontend CSS usage: 'h s% l%' ."""
    if not hsl:
        return ""
    if not is_valid_hsl(hsl):
        return "0 0% 0%"

    h, s, l = normalize_hsl_triplet(hsl).split()
    return f"{h} {s}% {l}%"


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert HEX color to RGB tuple.

    Args:
        hex_color: Color in HEX format (e.g., '#1A73E8' or '1A73E8')

    Returns:
        Tuple of (r, g, b) values (0-255)
    """
    hex_color = hex_color.lstrip("#")

    # Handle 3-digit hex codes
    if len(hex_color) == 3:
        hex_color = "".join([c * 2 for c in hex_color])

    if len(hex_color) != 6:
        raise ValueError(f"Invalid hex color: {hex_color}")

    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    return (r, g, b)


def rgb_to_hsl(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """Convert RGB to HSL.

    Args:
        r: Red value (0-255)
        g: Green value (0-255)
        b: Blue value (0-255)

    Returns:
        Tuple of (h, s, l) where h is 0-360, s and l are 0-100
    """
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0

    max_c = max(r_norm, g_norm, b_norm)
    min_c = min(r_norm, g_norm, b_norm)
    lightness = (max_c + min_c) / 2.0

    if max_c == min_c:
        h = s = 0.0
    else:
        d = max_c - min_c
        s = d / (2.0 - max_c - min_c) if lightness > 0.5 else d / (max_c + min_c)

        if max_c == r_norm:
            h = (g_norm - b_norm) / d + (6.0 if g_norm < b_norm else 0.0)
        elif max_c == g_norm:
            h = (b_norm - r_norm) / d + 2.0
        else:
            h = (r_norm - g_norm) / d + 4.0

        h = h / 6.0

    return (h * 360, s * 100, lightness * 100)


def hex_to_hsl(hex_color: str) -> str:
    """Convert HEX color to HSL string format.

    Args:
        hex_color: Color in HEX format (e.g., '#1A73E8')

    Returns:
        HSL string in format 'h s l' (e.g., '217 89 51')
    """
    if not hex_color:
        return ""

    try:
        r, g, b = hex_to_rgb(hex_color)
        h, s, lightness = rgb_to_hsl(r, g, b)
        return f"{round(h)} {round(s)}% {round(lightness)}%"
    except (ValueError, TypeError):
        # Return default on error
        return "0 0% 0%"


def hsl_to_hex(hsl: str) -> str:
    """Convert HSL string to HEX color.

    Args:
        hsl: HSL string in format 'h s% l%' or 'h s l' (e.g., '217 89% 51%')

    Returns:
        HEX color string (e.g., '#1A73E8')
    """
    if not hsl:
        return ""

    try:
        # Parse HSL values - handle both 'h s% l%' and 'h s l' formats
        parts = hsl.replace("%", "").strip().split()
        if len(parts) != 3:
            raise ValueError(f"Invalid HSL format: {hsl}")

        h = float(parts[0]) / 360.0
        s = float(parts[1]) / 100.0
        lightness = float(parts[2]) / 100.0

        if s == 0:
            # Achromatic (gray)
            r = g = b = int(round(lightness * 255))
        else:

            def hue_to_rgb(p: float, q: float, t: float) -> float:
                if t < 0:
                    t += 1
                if t > 1:
                    t -= 1
                if t < 1 / 6:
                    return p + (q - p) * 6 * t
                if t < 1 / 2:
                    return q
                if t < 2 / 3:
                    return p + (q - p) * (2 / 3 - t) * 6
                return p

            q = (
                lightness * (1 + s)
                if lightness < 0.5
                else lightness + s - lightness * s
            )
            p = 2 * lightness - q

            r = int(round(hue_to_rgb(p, q, h + 1 / 3) * 255))
            g = int(round(hue_to_rgb(p, q, h) * 255))
            b = int(round(hue_to_rgb(p, q, h - 1 / 3) * 255))

        return f"#{r:02X}{g:02X}{b:02X}"
    except (ValueError, TypeError, IndexError):
        return "#000000"

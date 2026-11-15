"""Convierte las imagenes originales de PlugSaurus a WebP optimizado para la web.
Uso:  python tools/prepare_assets.py   (desde la carpeta plugsaurus-web)
Solo lee los originales; nunca los modifica."""
from pathlib import Path
from PIL import Image
import shutil, subprocess

ROOT = Path(__file__).resolve().parent.parent
CLAUDE = ROOT.parent                     # Escritorio\CLAUDE
DESK = CLAUDE.parent                     # Escritorio
OUT = ROOT / "assets" / "img" / "products"
VID = ROOT / "assets" / "video"

VV = CLAUDE / "Marketing_VelociVoice" / "imagenes_win_mac"
RT = CLAUDE / "Marketing_RaptorTune" / "imagenes"
SB = CLAUDE / "Marketing_Gumroad"
SP = CLAUDE / "Marketing_STOMPOSAURUS"
PV = DESK / "PLUGSAURUS" / "PTEROVERB"

IMAGES = {
    # destino: (origen, ancho maximo)
    "velocivoice-cover": (VV / "gumroad_cover_1920x1080.png", 1600),
    "velocivoice-thumb": (VV / "gumroad_thumb_1200x1200.png", 720),
    "velocivoice-inside": (VV / "gumroad_whats_inside_1920x1080.png", 1600),
    "velocivoice-ui": (CLAUDE / "Marketing_VelociVoice" / "imagenes" / "velocivoice_interface_2200x1280.png", 1600),
    "velocivoice-trial-cover": (VV / "trial_gumroad_cover_1920x1080.png", 1600),
    "velocivoice-trial-thumb": (VV / "trial_gumroad_thumb_1200x1200.png", 720),
    "raptortune-cover": (RT / "rt_gumroad_cover_1920x1080.png", 1600),
    "raptortune-thumb": (RT / "rt_gumroad_thumb_1200x1200.png", 720),
    "raptortune-inside": (RT / "rt_gumroad_whats_inside_1920x1080.png", 1600),
    "raptortune-ui": (RT / "raptortune_interface_1640x1120.png", 1600),
    "stegoburn-cover": (SB / "STEGOBURN_cover.png", 1600),
    "stegoburn-thumb": (SB / "STEGOBURN_thumb.png", 720),
    "stegoburn-moods": (SB / "STEGOBURN_moods.png", 1600),
    "stegoburn-lite-cover": (SB / "STEGOBURN-Lite_cover.png", 1600),
    "stegoburn-lite-thumb": (SB / "STEGOBURN-Lite_thumb.png", 720),
    "stomposaurus-cover": (SP / "Tienda" / "STOMPOSAURUS_cover.png", 1600),
    "stomposaurus-thumb": (SP / "Tienda" / "STOMPOSAURUS_thumb.png", 720),
    "stomposaurus-post": (SP / "STOMPOSAURUS_post.png", 1080),
    "stomposaurus-lite-cover": (SP / "Tienda" / "STOMPOSAURUS-Lite_cover.png", 1600),
    "stomposaurus-lite-thumb": (SP / "Tienda" / "STOMPOSAURUS-Lite_thumb.png", 720),
    "pteroverb-cover": (PV / "Gumroad" / "PTEROVERB_Gumroad_portada.png", 1280),
    "pteroverb-thumb": (PV / "Gumroad" / "PTEROVERB_Gumroad_miniatura.png", 600),
    "pteroverb-ui": (PV / "PTEROVERB_interfaz.png", 1100),
}

# Reels antes/despues de VelociVoice (1080x1920): se reducen a 720x1280 para la web
VV_BA = CLAUDE / "Marketing_VelociVoice" / "reels_antes_despues"
VIDEOS_ENCODE = {
    "velocivoice-ba-trap-lead.mp4": VV_BA / "VelociVoice_BA4_trap_lead.mp4",
    "velocivoice-ba-clean-lead.mp4": VV_BA / "VelociVoice_BA1_clean_lead.mp4",
    "velocivoice-ba-hype-adlib.mp4": VV_BA / "VelociVoice_BA2_hype_adlib.mp4",
    "velocivoice-ba-choir-wash.mp4": VV_BA / "VelociVoice_BA3_choir_wash.mp4",
}

VIDEOS = {
    "stomposaurus-reel1.mp4": SP / "STOMPOSAURUS_reel1.mp4",
    "stomposaurus-reel2.mp4": SP / "STOMPOSAURUS_reel2.mp4",
    "stegoburn-reel1.mp4": CLAUDE / "Instagram_Reels" / "STEGOBURN_reel1_phone_test.mp4",
    "stegoburn-reel2.mp4": CLAUDE / "Instagram_Reels" / "STEGOBURN_reel2_feed_the_stego.mp4",
    "pteroverb-wings.mp4": PV / "Gumroad" / "PTEROVERB_Gumroad_animada.mp4",
}


def to_webp(src, dst, max_w, q=82):
    im = Image.open(src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=q, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    VID.mkdir(parents=True, exist_ok=True)
    for name, (src, w) in IMAGES.items():
        if not src.exists():
            print("FALTA", src); continue
        to_webp(src, OUT / f"{name}.webp", w)
    # Logo oficial + favicons
    logo = Image.open(CLAUDE / "Marketing_Instagram" / "PlugSaurus_logo_perfil.png").convert("RGB")
    img = ROOT / "assets" / "img"
    for size in (512, 256):
        logo.resize((size, size), Image.LANCZOS).save(img / f"logo-{size}.webp", "WEBP", quality=88, method=6)
    logo.resize((180, 180), Image.LANCZOS).save(img / "apple-touch-icon.png", optimize=True)
    logo.resize((48, 48), Image.LANCZOS).save(img / "favicon.png", optimize=True)
    logo.resize((1200, 1200), Image.LANCZOS).save(img / "og-logo.jpg", quality=86)
    # Videos (se copian tal cual) + poster del primer segundo
    for name, src in VIDEOS.items():
        if not src.exists():
            print("FALTA", src); continue
        shutil.copy2(src, VID / name)
        poster = VID / name.replace(".mp4", ".jpg")
        if shutil.which("ffmpeg"):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", str(src),
                            "-frames:v", "1", "-vf", "scale='min(960,iw)':-2", "-q:v", "5", str(poster)])
    # Reels recomprimidos (el audio se copia tal cual para no tocar el nivel)
    for name, src in VIDEOS_ENCODE.items():
        if not src.exists() or not shutil.which("ffmpeg"):
            print("FALTA", src); continue
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", "scale=720:-2",
                        "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-c:a", "copy",
                        "-movflags", "+faststart", str(VID / name)])
        # poster: fotograma del "despues" (segundo 11)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "11", "-i", str(src),
                        "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "5", str(VID / name.replace(".mp4", ".jpg"))])
    print("OK")


if __name__ == "__main__":
    main()

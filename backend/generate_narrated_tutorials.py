"""
Generate narrated video tutorials:
1. Generate TTS audio for each tutorial narration script
2. Record screen video via Playwright
3. Merge audio + video with ffmpeg
"""
import asyncio
import os
import subprocess
import shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.openai import OpenAITextToSpeech
from narration_scripts import NARRATION_SCRIPTS

APP_URL = os.environ.get("APP_URL", "http://localhost:3000")
UPLOAD_DIR = Path(__file__).parent / "uploads" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR = UPLOAD_DIR / "_audio_tmp"
AUDIO_DIR.mkdir(exist_ok=True)

API_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


async def generate_narration_audio(tutorial_key: str) -> Path:
    """Generate a single MP3 narration audio file for a tutorial."""
    script = NARRATION_SCRIPTS.get(tutorial_key)
    if not script:
        raise ValueError(f"No narration script for: {tutorial_key}")

    tts = OpenAITextToSpeech(api_key=API_KEY)

    # Generate audio for each segment, then concat with ffmpeg
    segment_files = []
    silence_file = AUDIO_DIR / f"{tutorial_key}_silence.mp3"

    # Create a short silence file (1 second) for pauses
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", "1", "-q:a", "9", str(silence_file)
    ], capture_output=True, timeout=10)

    for i, seg in enumerate(script["segments"]):
        seg_path = AUDIO_DIR / f"{tutorial_key}_seg_{i}.mp3"
        print(f"  Generating audio segment {i+1}/{len(script['segments'])}: {seg['text'][:30]}...")

        try:
            audio_bytes = await tts.generate_speech(
                text=seg["text"],
                model="tts-1-hd",
                voice="nova",
                speed=0.95,
                response_format="mp3"
            )
            with open(seg_path, "wb") as f:
                f.write(audio_bytes)
            segment_files.append(str(seg_path))

            # Add silence for pause duration
            pause_dur = seg.get("pause", 1.0)
            if pause_dur > 0:
                pause_file = AUDIO_DIR / f"{tutorial_key}_pause_{i}.mp3"
                subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                    "-t", str(pause_dur), "-q:a", "9", str(pause_file)
                ], capture_output=True, timeout=10)
                segment_files.append(str(pause_file))
        except Exception as e:
            print(f"  Error generating segment {i}: {e}")
            # Create silence as fallback
            fallback = AUDIO_DIR / f"{tutorial_key}_seg_{i}.mp3"
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                "-t", "3", "-q:a", "9", str(fallback)
            ], capture_output=True, timeout=10)
            segment_files.append(str(fallback))

    # Concat all segments into one audio file
    concat_list = AUDIO_DIR / f"{tutorial_key}_list.txt"
    with open(concat_list, "w") as f:
        for sf in segment_files:
            f.write(f"file '{sf}'\n")

    output_audio = AUDIO_DIR / f"{tutorial_key}_narration.mp3"
    result = subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list), "-c", "copy", str(output_audio)
    ], capture_output=True, text=True, timeout=60)

    if result.returncode != 0:
        print(f"  ffmpeg concat error: {result.stderr}")

    # Cleanup segment files
    for sf in segment_files:
        try:
            os.remove(sf)
        except:
            pass
    try:
        os.remove(str(concat_list))
        os.remove(str(silence_file))
    except:
        pass

    print(f"  Audio saved: {output_audio} ({output_audio.stat().st_size / 1024:.0f} KB)")
    return output_audio


def merge_audio_video(video_path: Path, audio_path: Path, output_path: Path) -> bool:
    """Merge audio narration with screen recording video using ffmpeg."""
    print(f"  Merging: {video_path.name} + {audio_path.name} -> {output_path.name}")

    # Get video duration
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)
    ], capture_output=True, text=True, timeout=30)
    video_duration = float(probe.stdout.strip()) if probe.stdout.strip() else 60.0

    # Get audio duration
    probe_audio = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)
    ], capture_output=True, text=True, timeout=30)
    audio_duration = float(probe_audio.stdout.strip()) if probe_audio.stdout.strip() else 30.0

    print(f"  Video: {video_duration:.1f}s, Audio: {audio_duration:.1f}s")

    # For webm output, use libopus for audio
    result = subprocess.run([
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "copy",
        "-c:a", "libopus", "-b:a", "128k",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        str(output_path)
    ], capture_output=True, text=True, timeout=180)

    if result.returncode != 0:
        print(f"  ffmpeg merge error: {result.stderr[:500]}")
        # Fallback: re-encode both streams
        result2 = subprocess.run([
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
            "-c:a", "libopus", "-b:a", "128k",
            "-map", "0:v:0", "-map", "1:a:0",
            "-shortest",
            str(output_path)
        ], capture_output=True, text=True, timeout=300)
        if result2.returncode != 0:
            print(f"  Fallback merge also failed: {result2.stderr[:300]}")
            return False

    if output_path.exists():
        print(f"  Merged: {output_path.name} ({output_path.stat().st_size / 1024 / 1024:.1f} MB)")
        return True
    return False


async def generate_all_narrated(app_url=None):
    """Full pipeline: generate audio -> record video -> merge."""
    if app_url:
        global APP_URL
        APP_URL = app_url

    print(f"=== Generating Narrated Tutorials ===")
    print(f"App URL: {APP_URL}")

    # Step 1: Generate all narration audio files first
    print("\n--- Step 1: Generating narration audio ---")
    audio_files = {}
    for key in NARRATION_SCRIPTS:
        print(f"\nGenerating audio for: {key}")
        try:
            audio_path = await generate_narration_audio(key)
            audio_files[key] = audio_path
        except Exception as e:
            print(f"  FAILED to generate audio for {key}: {e}")

    print(f"\nAudio generated: {len(audio_files)}/{len(NARRATION_SCRIPTS)}")

    # Step 2: Record screen videos via Playwright
    print("\n--- Step 2: Recording screen videos ---")
    from generate_tutorials import generate_all as record_videos
    await record_videos(APP_URL)

    # Step 3: Merge audio + video
    print("\n--- Step 3: Merging audio and video ---")
    results = []
    for key, audio_path in audio_files.items():
        video_path = UPLOAD_DIR / f"{key}.webm"
        if not video_path.exists():
            print(f"  No video found for {key}, skipping merge")
            continue

        # Output as webm with audio
        output_path = UPLOAD_DIR / f"{key}_narrated.webm"
        success = merge_audio_video(video_path, audio_path, output_path)

        if success and output_path.exists():
            # Replace original with narrated version
            final_path = UPLOAD_DIR / f"{key}.webm"
            shutil.move(str(output_path), str(final_path))
            results.append(key)
            print(f"  OK: {key}")
        else:
            print(f"  FAILED merge for {key}")

    # Cleanup audio temp dir
    shutil.rmtree(str(AUDIO_DIR), ignore_errors=True)

    print(f"\n=== Done! Narrated {len(results)}/{len(NARRATION_SCRIPTS)} tutorials ===")
    return results


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else APP_URL
    asyncio.run(generate_all_narrated(url))

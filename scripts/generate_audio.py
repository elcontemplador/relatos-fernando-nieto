"""Generate cached Spanish narrations (edge-tts plus ffmpeg/ffprobe).

Run only after authorization to send published texts to Microsoft Edge TTS:
python scripts/generate_audio.py [--story ID] [--voice alvaro|elvira]
Use --verify-only to validate cached files without contacting the service.
Narration is the original title followed by all non-caption paragraphs.
"""
import argparse
import asyncio
import hashlib
import html
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'source/audio-manifest.json'
VOICES = {'alvaro': 'es-ES-AlvaroNeural', 'elvira': 'es-ES-ElviraNeural'}
RATE = '-5%'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def normalized(text):
    return ''.join(c.lower() for c in html.unescape(text) if c.isalnum())

def narration(story):
    return story['title'] + '.\n\n' + '\n\n'.join(p['text'] for p in story['paragraphs'] if p['type'] != 'caption')

def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', str(path)], check=True, capture_output=True, text=True)
    info = json.loads(result.stdout)
    duration = float(info['format']['duration'])
    assert duration > 3, f'Audio too short: {path}'
    assert info['streams'][0]['codec_name'] == 'mp3'
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'null', '-'], check=True, capture_output=True, text=True)
    assert not decoded.stderr.strip(), decoded.stderr
    return round(duration, 3)

async def main(args):
    stories = json.loads((ROOT / 'source/collection.json').read_text(encoding='utf-8'))
    if args.story:
        stories = [s for s in stories if s['id'] == args.story]
        assert stories, 'Unknown story ID'
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {'version': 1, 'rate': RATE, 'voices': VOICES, 'stories': {}}
    (ROOT / 'docs/audio').mkdir(exist_ok=True)
    (ROOT / 'qa').mkdir(exist_ok=True)
    semaphore = asyncio.Semaphore(2)

    def save():
        manifest['updatedAt'] = datetime.now(timezone.utc).isoformat()
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    async def generate(story, alias):
        async with semaphore:
            text = narration(story)
            voice = VOICES[alias]
            text_sha = sha(text.encode('utf-8'))
            key = sha(json.dumps({'text': text, 'voice': voice, 'rate': RATE}, ensure_ascii=False, sort_keys=True).encode('utf-8'))
            relative = f"audio/{story['id']}-{alias}.mp3"
            target = ROOT / 'docs' / relative
            entry = manifest['stories'].setdefault(story['id'], {}).get(alias)
            if entry and entry.get('cacheKey') == key and target.exists() and sha(target.read_bytes()) == entry['sha256']:
                probe(target)
                print(f"CACHED {story['id']} {alias}", flush=True)
                return
            if args.verify_only:
                raise RuntimeError(f'Missing or outdated audio: {target.name}')
            temporary = target.with_suffix('.part.mp3')
            for attempt in range(1, 4):
                boundaries = []
                try:
                    with temporary.open('wb') as output:
                        communicator = edge_tts.Communicate(text, voice, rate=RATE, boundary='WordBoundary')
                        async for chunk in communicator.stream():
                            if chunk['type'] == 'audio':
                                output.write(chunk['data'])
                            elif chunk['type'] == 'WordBoundary':
                                boundaries.append({k: chunk[k] for k in ('text', 'offset', 'duration')})
                    duration = probe(temporary)
                    spoken = ''.join(b['text'] for b in boundaries)
                    expected = normalized(text)
                    observed = normalized(spoken)
                    (ROOT / f"qa/audio-{story['id']}-{alias}.json").write_text(json.dumps({'expectedText': text, 'boundaries': boundaries, 'normalizedExactMatch': expected == observed}, ensure_ascii=False, indent=2), encoding='utf-8')
                    assert expected == observed, f'Text coverage mismatch: {len(expected)} expected, {len(observed)} observed'
                    assert boundaries[-1]['offset'] / 10_000_000 < duration, 'Last word outside audio'
                    temporary.replace(target)
                    manifest['stories'][story['id']][alias] = {'src': relative, 'voice': voice, 'rate': RATE, 'cacheKey': key, 'textSha256': text_sha, 'sha256': sha(target.read_bytes()), 'duration': duration, 'bytes': target.stat().st_size, 'boundaryWords': len(boundaries), 'textCoverage': 'exact-normalized-word-boundaries', 'generatedAt': datetime.now(timezone.utc).isoformat()}
                    save()
                    print(f"OK {story['id']} {alias}: {duration}s, {len(boundaries)} words", flush=True)
                    return
                except Exception as exc:
                    temporary.unlink(missing_ok=True)
                    print(f"ERROR {story['id']} {alias} attempt {attempt}/3: {exc}", flush=True)
                    if attempt == 3:
                        raise
                    await asyncio.sleep(attempt * 3)
    await asyncio.gather(*(generate(story, alias) for story in stories for alias in ([args.voice] if args.voice else VOICES)))
    total = sum(p.stat().st_size for p in (ROOT / 'docs/audio').glob('*.mp3'))
    assert total < 100_000_000, f'Audio budget exceeded: {total}'
    print(f'VALIDATED: {total / 1_000_000:.2f} MB', flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true', help='Validate existing audio without network requests')
    parser.add_argument('--story')
    parser.add_argument('--voice', choices=VOICES)
    asyncio.run(main(parser.parse_args()))

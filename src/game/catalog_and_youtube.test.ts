import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNNER_SKINS,
  MAP_THEMES,
  TOTAL_SKIN_COUNT,
  TOTAL_MAP_COUNT,
  getSkinById,
  getMapById,
} from './catalog';
import { extractYouTubeVideoId, parseYouTubeSource } from '../utils/youtube';

test('catalog contains exactly 800 free unique skins and 800 free unique maps', () => {
  assert.equal(TOTAL_SKIN_COUNT, 800);
  assert.equal(TOTAL_MAP_COUNT, 800);
  assert.equal(RUNNER_SKINS.length, 800);
  assert.equal(MAP_THEMES.length, 800);

  const skinIds = new Set(RUNNER_SKINS.map((s) => s.id));
  const mapIds = new Set(MAP_THEMES.map((m) => m.id));
  assert.equal(skinIds.size, 800);
  assert.equal(mapIds.size, 800);

  for (const s of RUNNER_SKINS) {
    assert.equal(s.free, true);
  }
  for (const m of MAP_THEMES) {
    assert.equal(m.free, true);
  }

  // Preserves original IDs and retrieves #800 accurately
  assert.equal(getSkinById('rt-classic').id, 'rt-classic');
  assert.equal(getSkinById('voxel-skin-800').id, 'voxel-skin-800');
  assert.equal(getMapById('metro-central').id, 'metro-central');
  assert.equal(getMapById('voxel-map-800').id, 'voxel-map-800');
});

test('extractYouTubeVideoId and parseYouTubeSource handle all valid YouTube URLs and reject invalid ones', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/jfKfPfyJRdk?si=abc123'),
    'jfKfPfyJRdk'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/shorts/5qap5aO4i9A'),
    '5qap5aO4i9A'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/live/4xDzrJKXOOY?feature=share'),
    '4xDzrJKXOOY'
  );
  assert.equal(
    extractYouTubeVideoId('https://music.youtube.com/watch?v=DWcJFNfaw9c&list=RDAMVM'),
    'DWcJFNfaw9c'
  );
  assert.equal(
    extractYouTubeVideoId('youtube.com/watch?v=M7lc1UVf-VE'),
    'M7lc1UVf-VE'
  );
  assert.equal(extractYouTubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');

  const parsed = parseYouTubeSource('https://youtu.be/jfKfPfyJRdk');
  assert.ok(parsed);
  assert.equal(parsed.videoId, 'jfKfPfyJRdk');
  assert.ok(parsed.embedUrl.startsWith('https://www.youtube-nocookie.com/embed/jfKfPfyJRdk'));

  // Reject unsafe or invalid inputs
  assert.equal(extractYouTubeVideoId(''), null);
  assert.equal(extractYouTubeVideoId('javascript:alert(1)'), null);
  assert.equal(extractYouTubeVideoId('https://evil.example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(extractYouTubeVideoId('https://youtube.com/watch?v=short'), null);
});

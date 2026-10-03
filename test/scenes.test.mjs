// Regression: every scene must render its own theatrics (Ahmad bug — only Walker ever played).
// Run: node test/scenes.test.mjs
import './shim.mjs';
const { WaitMate } = await import('../src/waitmate.js');

const expected = {
  walker: 'canvas',
  dots:   'div,div',       // label + dot container (dots live inside the container)
  orbit:  'div',           // ring containing the comet
  meter:  'div',           // track containing the bar
  sleepy: 'div,div',       // face + zzz
};

let failed = 0;
for (const scene of WaitMate.scenes) {
  WaitMate.start({ scene, message: 'test' });
  const ov = document.getElementById('waitmate-overlay');
  const divs = ov.children.filter(c => c.tagName.toUpperCase() === 'DIV' && c.id !== 'waitmate-overlay');
  const tags = [...ov.children.map(c => c.tagName.toUpperCase())];
  const canvasCount = tags.filter(t => t === 'CANVAS').length;
  if (scene === 'walker') {
    if (canvasCount !== 1) { console.error(`FAIL ${scene}: expected canvas, got ${tags}`); failed++; }
  } else if (canvasCount !== 0) {
    console.error(`FAIL ${scene}: canvas leaked into non-walker scene (tags: ${tags}) — scene selection broken`);
    failed++;
  } else if (divs.length < expected[scene].split(',').length) {
    console.error(`FAIL ${scene}: too few scene elements (${divs.length}); tags: ${tags}`);
    failed++;
  } else {
    console.log(`ok ${scene}: ${tags.join(',')}`);
  }
  WaitMate.stop();
}
// promise-form path (what the demo uses): scene must survive the internal re-call
WaitMate.start(new Promise(res => setTimeout(res, 20)), { scene: 'orbit' });
setTimeout(() => {
  const ov = document.getElementById('waitmate-overlay');
  const hasCanvas = ov && ov.children.some(c => c.tagName === 'CANVAS');
  if (hasCanvas) { console.error('FAIL promise-form orbit rendered walker canvas'); failed++; }
  else console.log('ok promise-form orbit');
  console.log(failed ? `\n${failed} failure(s)` : '\nall scene-selection checks passed');
  process.exit(failed ? 1 : 0);
}, 50);

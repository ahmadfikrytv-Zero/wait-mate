// Minimal DOM shims so waitmate.js can run under Node for the regression tests.
// Not a full DOM — just enough surface for ensureOverlay + all five scenes.
class El {
  constructor(tag){ this.tagName=tag; this.children=[]; this.style={cssText:''}; this._text=''; this._id=''; }
  set textContent(v){ this._text=v; this.children=[]; } get textContent(){ return this._text; }
  appendChild(c){ this.children.push(c); return c; }
  set innerHTML(v){ this._text=''; this.children=[]; } get innerHTML(){ return this._text; }
  get id(){ return this._id; }
  set id(v){ this._id=v; if(v) global.document._els[v]=this; }
  setAttribute(k,v){ this['attr_'+k]=v; if(k==='id') this.id=v; }
  querySelectorAll(){ return []; }
  remove(){}
}
class Canvas extends El {
  getContext(){ return { scale(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, arc(){}, fill(){},
    set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set lineCap(v){} }; }
}
global.document = {
  _els:{},
  getElementById(id){ return this._els[id]||null; },
  createElement(tag){ const e = tag==='canvas' ? new Canvas(tag) : new El(tag); return e; },
  body: new El('body'),
};
global.window = { matchMedia: () => ({ matches:false }) };
global.requestAnimationFrame = (fn) => 1;
global.cancelAnimationFrame = () => {};
const timers=[]; global.setInterval=(f,ms)=>timers.push(1); global.clearInterval=()=>{};

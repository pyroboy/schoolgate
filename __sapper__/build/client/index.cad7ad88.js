function t(){}function n(t,n){for(const e in n)t[e]=n[e];return t}function e(t){return t()}function o(){return Object.create(null)}function r(t){t.forEach(e)}function c(t){return"function"==typeof t}function s(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function u(t,n,e){t.$$.on_destroy.push(function(t,n){const e=t.subscribe(n);return e.unsubscribe?()=>e.unsubscribe():e}(n,e))}function a(t,n,e,o){if(t){const r=i(t,n,e,o);return t[0](r)}}function i(t,e,o,r){return t[1]&&r?n(o.ctx.slice(),t[1](r(e))):o.ctx}function f(t,n,e,o){return t[2]&&o?n.dirty|t[2](o(e)):n.dirty}function l(t,n){t.appendChild(n)}function d(t,n,e){t.insertBefore(n,e||null)}function h(t){t.parentNode.removeChild(t)}function p(t,n){for(let e=0;e<t.length;e+=1)t[e]&&t[e].d(n)}function g(t){return document.createElement(t)}function m(t){return document.createTextNode(t)}function $(){return m(" ")}function b(){return m("")}function y(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function k(t){return Array.from(t.childNodes)}function x(t,n,e,o){for(let o=0;o<t.length;o+=1){const r=t[o];if(r.nodeName===n){for(let t=0;t<r.attributes.length;t+=1){const n=r.attributes[t];e[n.name]||r.removeAttribute(n.name)}return t.splice(o,1)[0]}}return o?function(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}(n):g(n)}function _(t,n){for(let e=0;e<t.length;e+=1){const o=t[e];if(3===o.nodeType)return o.data=""+n,t.splice(e,1)[0]}return m(n)}function w(t){return _(t," ")}function v(t,n){n=""+n,t.data!==n&&(t.data=n)}function E(t,n,e,o){t.style.setProperty(n,e,o?"important":"")}function A(t,n,e){t.classList[e?"add":"remove"](n)}let N;function S(t){N=t}function j(){if(!N)throw new Error("Function called outside component initialization");return N}function M(t){j().$$.on_mount.push(t)}function C(t,n){j().$$.context.set(t,n)}function q(t){return j().$$.context.get(t)}const z=[],B=[],F=[],L=[],O=Promise.resolve();let P=!1;function T(t){F.push(t)}function D(){const t=new Set;do{for(;z.length;){const t=z.shift();S(t),G(t.$$)}for(;B.length;)B.pop()();for(let n=0;n<F.length;n+=1){const e=F[n];t.has(e)||(e(),t.add(e))}F.length=0}while(z.length);for(;L.length;)L.pop()();P=!1}function G(t){null!==t.fragment&&(t.update(),r(t.before_update),t.fragment&&t.fragment.p(t.ctx,t.dirty),t.dirty=[-1],t.after_update.forEach(T))}const H=new Set;let I;function J(){I={r:0,c:[],p:I}}function K(){I.r||r(I.c),I=I.p}function Q(t,n){t&&t.i&&(H.delete(t),t.i(n))}function R(t,n,e,o){if(t&&t.o){if(H.has(t))return;H.add(t),I.c.push(()=>{H.delete(t),o&&(e&&t.d(1),o())}),t.o(n)}}function U(t,n){const e=n.token={};function o(t,o,r,c){if(n.token!==e)return;n.resolved=c;let s=n.ctx;void 0!==r&&((s=s.slice())[r]=c);const u=t&&(n.current=t)(s);let a=!1;n.block&&(n.blocks?n.blocks.forEach((t,e)=>{e!==o&&t&&(J(),R(t,1,1,()=>{n.blocks[e]=null}),K())}):n.block.d(1),u.c(),Q(u,1),u.m(n.mount(),n.anchor),a=!0),n.block=u,n.blocks&&(n.blocks[o]=u),a&&D()}if((r=t)&&"object"==typeof r&&"function"==typeof r.then){const e=j();if(t.then(t=>{S(e),o(n.then,1,n.value,t),S(null)},t=>{S(e),o(n.catch,2,n.error,t),S(null)}),n.current!==n.pending)return o(n.pending,0),!0}else{if(n.current!==n.then)return o(n.then,1,n.value,t),!0;n.resolved=t}var r}function V(t,n){t.d(1),n.delete(t.key)}function W(t,n,e,o,r,c,s,u,a,i,f,l){let d=t.length,h=c.length,p=d;const g={};for(;p--;)g[t[p].key]=p;const m=[],$=new Map,b=new Map;for(p=h;p--;){const t=l(r,c,p),u=e(t);let a=s.get(u);a?o&&a.p(t,n):(a=i(u,t)).c(),$.set(u,m[p]=a),u in g&&b.set(u,Math.abs(p-g[u]))}const y=new Set,k=new Set;function x(t){Q(t,1),t.m(u,f),s.set(t.key,t),f=t.first,h--}for(;d&&h;){const n=m[h-1],e=t[d-1],o=n.key,r=e.key;n===e?(f=n.first,d--,h--):$.has(r)?!s.has(o)||y.has(o)?x(n):k.has(r)?d--:b.get(o)>b.get(r)?(k.add(o),x(n)):(y.add(r),d--):(a(e,s),d--)}for(;d--;){const n=t[d];$.has(n.key)||a(n,s)}for(;h;)x(m[h-1]);return m}function X(t,n){const e={},o={},r={$$scope:1};let c=t.length;for(;c--;){const s=t[c],u=n[c];if(u){for(const t in s)t in u||(o[t]=1);for(const t in u)r[t]||(e[t]=u[t],r[t]=1);t[c]=u}else for(const t in s)r[t]=1}for(const t in o)t in e||(e[t]=void 0);return e}function Y(t){return"object"==typeof t&&null!==t?t:{}}function Z(t){t&&t.c()}function tt(t,n){t&&t.l(n)}function nt(t,n,o){const{fragment:s,on_mount:u,on_destroy:a,after_update:i}=t.$$;s&&s.m(n,o),T(()=>{const n=u.map(e).filter(c);a?a.push(...n):r(n),t.$$.on_mount=[]}),i.forEach(T)}function et(t,n){const e=t.$$;null!==e.fragment&&(r(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function ot(t,n){-1===t.$$.dirty[0]&&(z.push(t),P||(P=!0,O.then(D)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function rt(n,e,c,s,u,a,i=[-1]){const f=N;S(n);const l=e.props||{},d=n.$$={fragment:null,ctx:null,props:a,update:t,not_equal:u,bound:o(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(f?f.$$.context:[]),callbacks:o(),dirty:i};let h=!1;d.ctx=c?c(n,l,(t,e,o=e)=>(d.ctx&&u(d.ctx[t],d.ctx[t]=o)&&(d.bound[t]&&d.bound[t](o),h&&ot(n,t)),e)):[],d.update(),h=!0,r(d.before_update),d.fragment=!!s&&s(d.ctx),e.target&&(e.hydrate?d.fragment&&d.fragment.l(k(e.target)):d.fragment&&d.fragment.c(),e.intro&&Q(n.$$.fragment),nt(n,e.target,e.anchor),D()),S(f)}class ct{$destroy(){et(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(){}}export{n as A,X as B,Y as C,C as D,J as E,K as F,q as G,U as H,u as I,W as J,V as K,p as L,E as M,M as N,ct as S,$ as a,k as b,x as c,_ as d,g as e,h as f,w as g,y as h,rt as i,A as j,d as k,l,a as m,t as n,Z as o,tt as p,nt as q,i as r,s,m as t,f as u,Q as v,R as w,et as x,v as y,b as z};
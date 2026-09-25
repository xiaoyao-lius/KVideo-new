/**
 * 旧版 Android TV 内核（Chrome 66–73）运行时补丁。
 *
 * 背景：`scripts/transpile-client-assets.mjs` 只负责把语法降级到 chrome69，
 * 但 esbuild 不会补内置方法/全局对象。同时 Next.js 自带的 polyfill 包被标成
 * `<script ... noModule>`，而 Chrome 66 支持 ES 模块，会直接跳过该脚本，
 * 导致补丁包完全不加载。
 *
 * 实测（Redmi 智能电视 A55 2025 / HyperOS 2.0 / Android 9 / WebView 66.0.3359.158）：
 * 页面在 3794-*.js 初始化阶段抛 `ReferenceError: globalThis is not defined`，
 * React 尚未挂载即中断，表现为纯白屏。
 *
 * 该脚本必须内联在 `<head>` 的最前面：Next 的应用分包带 `async`，
 * 任何外链补丁脚本都可能晚于首次执行。
 */
export const LEGACY_COMPAT_SCRIPT = [
  '(function(){',
  'var W=window,O=Object,AP=Array.prototype,SP=String.prototype;',
  "try{if(typeof globalThis==='undefined')W.globalThis=W;}catch(e){}",
  "if(typeof O.fromEntries!=='function'){O.fromEntries=function(it){",
  "if(it===null||it===undefined)throw new TypeError('Cannot convert undefined or null to object');",
  'var o={},i=it[Symbol.iterator](),s;while(!(s=i.next()).done){o[s.value[0]]=s.value[1];}return o;};}',
  "if(typeof O.hasOwn!=='function'){O.hasOwn=function(o,k){return O.prototype.hasOwnProperty.call(O(o),k);};}",
  "if(typeof AP.at!=='function'){AP.at=function(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return n<0||n>=this.length?undefined:this[n];};}",
  "if(typeof SP.at!=='function'){SP.at=function(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return n<0||n>=this.length?undefined:this[n];};}",
  "if(typeof AP.flat!=='function'){AP.flat=function(d){var dep=d===undefined?1:Math.trunc(d)||0,out=[];",
  '(function go(a,dp){for(var i=0;i<a.length;i++){var v=a[i];if(dp>0&&Array.isArray(v))go(v,dp-1);else out.push(v);}})(this,dep);return out;};}',
  "if(typeof AP.flatMap!=='function'){AP.flatMap=function(fn,t){return AP.map.call(this,fn,t).flat(1);};}",
  "if(typeof AP.findLast!=='function'){AP.findLast=function(fn,t){for(var i=this.length-1;i>=0;i--)if(fn.call(t,this[i],i,this))return this[i];};}",
  "if(typeof AP.findLastIndex!=='function'){AP.findLastIndex=function(fn,t){for(var i=this.length-1;i>=0;i--)if(fn.call(t,this[i],i,this))return i;return -1;};}",
  "if(typeof SP.matchAll!=='function'){SP.matchAll=function(re){var str=String(this),",
  "rx=re instanceof RegExp?new RegExp(re.source,re.flags):new RegExp(re,'g');",
  "if(!rx.global)throw new TypeError('String.prototype.matchAll called with a non-global RegExp argument');",
  'var out=[],m;rx.lastIndex=0;while((m=rx.exec(str))!==null){out.push(m);if(m[0]===\'\')rx.lastIndex++;}',
  'var i=0,iter={};iter[Symbol.iterator]=function(){return{next:function(){return i<out.length?{value:out[i++],done:false}:{value:undefined,done:true};}};};return iter;};}',
  "if(typeof SP.replaceAll!=='function'){SP.replaceAll=function(search,repl){var str=String(this);",
  "if(search instanceof RegExp){if(!search.global)throw new TypeError('replaceAll must be called with a global RegExp');return str.replace(search,repl);}",
  "if(typeof repl==='function'){var needle=String(search),res='',idx=0,pos;",
  'while((pos=str.indexOf(needle,idx))!==-1){res+=str.slice(idx,pos)+String(repl(needle,pos,str));idx=pos+needle.length;}return res+str.slice(idx);}',
  "return str.split(String(search)).join(String(repl));};}",
  "if(typeof Promise.allSettled!=='function'){Promise.allSettled=function(list){return Promise.all(AP.map.call(list,function(p){",
  "return Promise.resolve(p).then(function(v){return{status:'fulfilled',value:v};},function(r){return{status:'rejected',reason:r};});}));};}",
  "if(typeof Promise.any!=='function'){Promise.any=function(list){return new Promise(function(res,rej){",
  'var arr=AP.slice.call(list),n=arr.length,errs=new Array(n),left=n;',
  "if(!n)return rej(new AggregateError([],'All promises were rejected'));",
  'arr.forEach(function(p,i){Promise.resolve(p).then(res,function(e){errs[i]=e;',
  "if(--left===0)rej(new AggregateError(errs,'All promises were rejected'));});});});};}",
  "if(typeof W.AggregateError!=='function'){W.AggregateError=function(errors,message){var e=new Error(message);e.errors=errors;e.name='AggregateError';return e;};}",
  "if(typeof W.queueMicrotask!=='function'){W.queueMicrotask=function(cb){Promise.resolve().then(cb);};}",
  "if(typeof W.structuredClone!=='function'){W.structuredClone=function(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));};}",
  "if(typeof W.requestIdleCallback!=='function'){W.requestIdleCallback=function(cb){var t=Date.now();",
  'return setTimeout(function(){cb({didTimeout:false,timeRemaining:function(){return Math.max(0,50-(Date.now()-t));}});},1);};',
  'W.cancelIdleCallback=function(id){clearTimeout(id);};}',
  "if(typeof W.WeakRef!=='function'){W.WeakRef=function(t){this.deref=function(){return t;};};}",
  "if(W.Intl&&typeof W.Intl.RelativeTimeFormat!=='function'){W.Intl.RelativeTimeFormat=function(){",
  "this.format=function(v,u){return String(v)+' '+u;};",
  "this.formatToParts=function(v,u){return[{type:'literal',value:String(v)+' '+u}];};",
  "this.resolvedOptions=function(){return{locale:'en',numeric:'always',style:'long'};};};}",
  "if(typeof W.BigInt!=='function'){W.BigInt=function(v){var n=Number(v);",
  "if(!isFinite(n))throw new SyntaxError('Cannot convert '+v+' to a BigInt');return n;};}",
  '})();',
].join('');

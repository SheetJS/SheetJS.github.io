importScripts('cpexcel.js');
importScripts('xls.js');
importScripts('jszip.js');
importScripts('xlsx.js');
postMessage({t:'ready'});
onmessage = function(evt) {
  var v;
  try { v = (evt.data.t == 'xls' ? XLS : XLSX).read(evt.data.d, evt.data.b); }
  catch(e) { postMessage({t:"e",d:e.stack}); }
  postMessage({t:evt.data.t, d:JSON.stringify(v)});
}

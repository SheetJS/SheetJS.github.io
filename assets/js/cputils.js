/* cputils.js (C) 2013-2014 SheetJS -- http://sheetjs.com */
/*jshint newcap: false */
(function(root, factory){
  "use strict";
  if(typeof cptable === "undefined") {
    if(typeof require !== "undefined"){
      var cpt = require('./cptable');
      if (typeof module !== 'undefined' && module.exports) module.exports = factory(cpt);
      else root.cptable = factory(cpt);
    } else throw new Error("cptable not found");
  } else cptable = factory(cptable);
}(this, function(cpt){
  "use strict";
  var magic = {
    "1200":"utf16le",
    "1201":"utf16be",
    "12000":"utf32le",
    "12001":"utf32be",
    "16969":"utf64le",
    "20127":"ascii",
    "65000":"utf7",
    "65001":"utf8"
  };

  var sbcs_cache = [874,1250,1251,1252,1253,1254,1255,1256,10000];
  var dbcs_cache = [932,936,949,950];
  var magic_cache = [65001];
  var magic_decode = {};
  var magic_encode = {};
  var cpecache = {};
  var cpdcache = [];

  if(typeof Buffer !== 'undefined') {
    var sbcs_encode = function(cp) {
      var E = cpt[cp].enc;
      var EE = new Buffer(256*256);
      for(var i = 0; i != 256*256;++i) EE[i] = 0;
      Object.keys(E).forEach(function(e) {
        EE[e.charCodeAt(0)] = E[e];
      });
      return function(data, ofmt) {
        if(data instanceof Buffer) data = data.toString('utf8');
        var out = new Buffer(data.length), i;
        if(typeof data === 'string') {
          for(i = 0; i != data.length; ++i) out[i] = EE[data.charCodeAt(i)];
        } else {
          for(i = 0; i != data.length; ++i) out[i] = EE[data[i].charCodeAt(0)];
        }
        if(!ofmt) return out;
        if(ofmt === 'buf') return out;
        var arr = [].slice.call(out);
        if(ofmt === 'arr') return arr;
        return arr.map(function(x) { return String.fromCharCode(x); }).join("");
      };
    };
    var sbcs_decode = function(cp) {
      var D = cpt[cp].dec;
      var DD = new Buffer(2*256*256);
      Object.keys(D).forEach(function(d) {
        var w = D[d].charCodeAt(0);
        DD[2*d] = w%256; DD[2*d+1] = w>>8;
      });
      return function(data) {
        var out = new Buffer(2*data.length), w, i, j;
        if(data instanceof Buffer) {
          for(i = 0; i < data.length; i++) {
            j = 2*data[i];
            out[2*i] = DD[j]; out[2*i+1] = DD[j+1];
          }
        } else if(typeof data === "string") {
          for(i = 0; i < data.length; i++) {
            j = 2*data.charCodeAt(i);
            out[2*i] = DD[j]; out[2*i+1] = DD[j+1];
          }
        } else {
          for(i = 0; i < data.length; i++) {
            j = 2*data[i];
            out[2*i] = DD[j]; out[2*i+1] = DD[j+1];
          }
        }
        return out.toString('ucs2');
      };
    };
    var dbcs_encode = function(cp) {
      var E = cpt[cp].enc;
      var EE = new Buffer(2*256*256);
      for(var i = 0; i != 2*256*256;++i) EE[i] = 0;
      Object.keys(E).forEach(function(e) {
        EE[2*e.charCodeAt(0)] = E[e] & 255;
        EE[2*e.charCodeAt(0)+1] = E[e]>>8;
      });
      return function(data, ofmt) {
        if(data instanceof Buffer) data = data.toString('utf8');
        var out = new Buffer(2*data.length), i, j, k;
        if(typeof data === 'string') {
          for(i = k = 0; i != data.length; ++i) {
            j = data.charCodeAt(i)*2;
            out[k++] = EE[j+1] || EE[j]; if(EE[j+1] > 0) out[k++] = EE[j];
          }
          out.length = k;
        } else {
          for(i = k = 0; i != data.length; i++) {
            j = data[i].charCodeAt(0)*2;
            out[k++] = EE[j+1] || EE[j]; if(EE[j+1] > 0) out[k++] = EE[j];
          }
        }
        if(!ofmt) return out;
        if(ofmt === 'buf') return out;
        var arr = [].slice.call(out);
        if(ofmt === 'arr') return arr;
        return arr.map(function(x) { return String.fromCharCode(x); }).join("");
      };
    };
    var dbcs_decode = function(cp) {
      var D = cpt[cp].dec;
      var DD = new Buffer(2*256*256);
      for(var i = 0; i != 256*256;++i) { DD[2*i] = 0xFF; DD[2*i+1] = 0xFD;}
      Object.keys(D).forEach(function(d) {
        var w = D[d].charCodeAt(0);
        DD[2*d] = w%256; DD[2*d+1] = w>>8;
      });
      return function(data) {
        var out = new Buffer(2*data.length), w, i, j, k=0;
        if(data instanceof Buffer) {
          for(i = 0; i < data.length; i++) {
            j = 2*data[i];
            if(DD[j]===0xFF && DD[j+1]===0xFD) { j=2*(256*data[i]+data[i+1]); ++i; }
            out[k++] = DD[j]; out[k++] = DD[j+1];
          }
        } else if(typeof data === "string") {
          for(i = 0; i < data.length; i++) {
            j = 2*data.charCodeAt(i);
            if(DD[j]===0xFF && DD[j+1]===0xFD) { j=2*(256*data.charCodeAt(i)+data.charCodeAt(i+1)); ++i; }
            out[k++] = DD[j]; out[k++] = DD[j+1];
          }
        } else {
          for(i = 0; i < data.length; i++) {
            j = 2*data[i];
            if(DD[j]===0xFF && DD[j+1]===0xFD) { j=2*(256*data[i]+data[i+1]); ++i; }
            out[k++] = DD[j]; out[k++] = DD[j+1];
          }
        }
        out.length = k;
        return out.toString('ucs2');
      };
    };
    magic_decode[65001] = function(data) {
      var out = new Buffer(2*data.length), w, i, j = 1, k = 0, ww;
      for(i = 0; i < data.length; i+=j) {
        j = 1;
        if(data[i] < 128) w = data[i];
        else if(data[i] < 224) { w = (data[i]&31)*64+(data[i+1]&63); j=2; }
        else { w=(data[i]&15)*4096+(data[i+1]&63)*64+(data[i+2]&63); j=3; }
        out[k++] = w%256; out[k++] = w>>8;
      }
      out.length = k;
      return out.toString('ucs2');
    };
  }

  var encache = function(cp) {
    if(typeof Buffer !== 'undefined') {
      sbcs_cache.forEach(function(s) {
        cpdcache[s] = sbcs_decode(s);
        cpecache[s] = sbcs_encode(s);
      });
      dbcs_cache.forEach(function(s) {
        cpdcache[s] = dbcs_decode(s);
        cpecache[s] = dbcs_encode(s);
      });
      magic_cache.forEach(function(s) {
        if(magic_decode[s]) cpdcache[s] = magic_decode[s];
        if(magic_encode[s]) cpecache[s] = magic_encode[s];
      });
    }
  };
  var cp_decache = function(cp) { delete cpdcache[cp]; delete cpecache[cp]; };
  var decache = function() {
    if(typeof Buffer !== 'undefined') {
      sbcs_cache.forEach(cp_decache);
      dbcs_cache.forEach(cp_decache);
      magic_cache.forEach(cp_decache);
    }
  };
  var cache = {
    encache: encache,
    decache: decache,
    sbcs: sbcs_cache,
    dbcs: dbcs_cache
  };

  encache();

  var BM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var SetD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'(),-./:?";
  var encode = function(cp, data, ofmt) {
    var F; if((F=cpecache[cp])) return F(data, ofmt);
    if(typeof Buffer !== 'undefined' && data instanceof Buffer) data = data.toString('utf8');
    var out = typeof Buffer !== 'undefined' ? new Buffer(4*data.length) : [], w, i, j = 0, c, tt;
    var C = cpt[cp], E, M;
    if(C && (E=C.enc)) for(i = 0; i != data.length; ++i, ++j) {
      w = E[data[i]];
      out[j] = w % 256;
      if(w > 255) {
        out[j] = (w/256)|0;
        out[++j] = w%256;
      }
    }
    else if((M=magic[cp])) switch(M) {
      case "utf8":
        if(typeof Buffer !== 'undefined' && typeof data === "string") { out = new Buffer(data, M); j = out.length; break; }
        for(i = 0; i != data.length; ++i, ++j) {
          w = data[i].charCodeAt(0);
          if(w <= 0x007F) out[j] = w;
          else if(w <= 0x07FF) {
            out[j]   = 192 + (w >> 6);
            out[++j] = 128 + (w % 64);
          } else {
            out[j]   = 224 + (w >> 12);
            out[++j] = 128 + ((w >> 6) % 64);
            out[++j] = 128 + (w % 64);
          }
        }
        break;
      case "ascii":
        if(typeof Buffer !== 'undefined' && typeof data === "string") { out = new Buffer(data, M); j = out.length; break; }
        for(i = 0; i != data.length; ++i, ++j) {
          w = data[i].charCodeAt(0);
          if(w <= 0x007F) out[j] = w;
          else throw new Error("bad ascii " + w);
        }
        break;
      case "utf16le": /* TODO: surrogate pairs */
        if(typeof Buffer !== 'undefined' && typeof data === "string") { out = new Buffer(data, M); j = out.length; break; }
        for(i = 0; i != data.length; ++i) {
          w = data[i].charCodeAt(0);
          out[j++] = w % 256;
          out[j++] = w>>8;
        }
        break;
      case "utf16be":
        for(i = 0; i != data.length; ++i) {
          w = data[i].charCodeAt(0);
          out[j++] = w>>8;
          out[j++] = w % 256;
        }
        break;
      case "utf32le":
        for(i = 0; i != data.length; ++i) {
          w = data[i].charCodeAt(0);
          out[j++] = w % 256; w >>= 8;
          out[j++] = w % 256; w >>= 8;
          out[j++] = w % 256; w >>= 8;
          out[j++] = w % 256;
        }
        break;
      case "utf32be":
        for(i = 0; i != data.length; ++i) {
          w = data[i].charCodeAt(0);
          out[j+3] = w % 256; w >>= 8;
          out[j+2] = w % 256; w >>= 8;
          out[j+1] = w % 256; w >>= 8;
          out[j] = w % 256; w >>= 8;
          j+=4;
        }
        break;
      case "utf7":
        for(i = 0; i != data.length; i++) {
          c = data[i];
          if(c === "+") { out[j++] = 0x2b; out[j++] = 0x2d; continue; }
          if(SetD.indexOf(c) > -1) { out[j++] = c.charCodeAt(0); continue; }
          tt = encode(1201, c);
          out[j++] = 0x2b;
          out[j++] = BM.charCodeAt(tt[0]>>2);
          out[j++] = BM.charCodeAt(((tt[0]&0x03)<<4) + ((tt[1]||0)>>4));
          out[j++] = BM.charCodeAt(((tt[1]&0x0F)<<2) + ((tt[2]||0)>>6));
          out[j++] = 0x2d;
        }
        break;
      default: throw new Error("Unsupported magic: " + cp + " " + magic[cp]);
    }
    else throw new Error("Unrecognized CP: " + cp);
    out.length = j;
    if(typeof Buffer === 'undefined') return (ofmt == 'str') ? out.map(function(x) { return String.fromCharCode(x); }).join("") : out;
    if(!ofmt) return out;
    if(ofmt === 'buf') return out;
    var arr = [].slice.call(out);
    if(ofmt === 'arr') return arr;
    return arr.map(function(x) { return String.fromCharCode(x); }).join("");
  };
  var decode = function(cp, data) {
    var F; if((F=cpdcache[cp])) return F(data);
    var out = new Array(data.length), w, i, j = 1, k = 0;
    var C = cpt[cp], D, M;
    if(C && (D=C.dec)) {
      if(typeof data === "string") data = data.split("").map(function(x){ return x.charCodeAt(0); });
      for(i = 0; i < data.length; i+=j) {
        j = 2;
        w = D[data[i]*256 + data[i+1]];
        if(!w) {
          j = 1;
          w = D[data[i]];
        }
        if(!w) throw new Error('Unrecognized code: ' + data[i] + ' ' + data[i+j-1] + ' ' + i + ' ' + j + ' ' + D[data[i]]);
        out[k++] = w;
      }
    }
    else if((M=magic[cp])) switch(M) {
      case "utf8":
        for(i = 0; i < data.length; i+=j) {
          j = 1;
          if(data[i] < 128) w = data[i];
          else if(data[i] < 224) { w = (data[i]&31)*64+(data[i+1]&63); j=2; }
          else { w=(data[i]&15)*4096+(data[i+1]&63)*64+(data[i+2]&63); j=3; }
          out[k++] = String.fromCharCode(w);
        }
        break;
      case "ascii":
        if(typeof Buffer !== 'undefined' && data instanceof Buffer) return data.toString(M);
        for(i = 0; i < data.length; i++) out[i] = String.fromCharCode(data[i]);
        k = data.length; break;
      case "utf16le":
        if(typeof Buffer !== 'undefined' && data instanceof Buffer) return data.toString(M);
        j = 2;
        for(i = 0; i < data.length; i+=j) {
          out[k++] = String.fromCharCode(256*data[i+1] + data[i]);
        }
        break;
      case "utf16be":
        j = 2;
        for(i = 0; i < data.length; i+=j) {
          out[k++] = String.fromCharCode(256*data[i] + data[i+1]);
        }
        break;
      case "utf32le":
        j = 4;
        for(i = 0; i < data.length; i+=j) {
          out[k++] = String.fromCharCode((data[i+3]<<24) + (data[i+2]<<16) + (data[i+1]<<8) + (data[i]));
        }
        break;
      case "utf32be":
        j = 4;
        for(i = 0; i < data.length; i+=j) {
          out[k++] = String.fromCharCode((data[i]<<24) + (data[i+1]<<16) + (data[i+2]<<8) + (data[i+3]));
        }
        break;
      case "utf7":
        for(i = 0; i < data.length; i+=j) {
          if(data[i] !== 0x2b) { j=1; out[k++] = String.fromCharCode(data[i]); continue; }
          j=1;
          if(data[i+1] === 0x2d) { j = 2; out[k++] = "+"; continue; }
          while(String.fromCharCode(data[i+j]).match(/[A-Za-z0-9+\/]/)) j++;
          var dash = 0;
          if(data[i+j] === 0x2d) { ++j; dash=1; }
          var tt = [];
          var o64;
          var c1, c2, c3;
          var e1, e2, e3, e4;
          for(var l = 1; l < j - dash;) {
            e1 = BM.indexOf(String.fromCharCode(data[i+l++]));
            e2 = BM.indexOf(String.fromCharCode(data[i+l++]));
            c1 = e1 << 2 | e2 >> 4;
            tt.push(c1);
            e3 = BM.indexOf(String.fromCharCode(data[i+l++]));
            if(e3 === -1) break;
            c2 = (e2 & 15) << 4 | e3 >> 2;
            tt.push(c2);
            e4 = BM.indexOf(String.fromCharCode(data[i+l++]));
            if(e4 === -1) break;
            c3 = (e3 & 3) << 6 | e4;
            if(e4 != 64) tt.push(c3);
          }
          if(tt.length % 2 == 1) tt.length--;
          o64 = decode(1201, tt);
          for(l = 0; l < o64.length; ++l) out[k++] = o64[l];
        }
        break;
      default: throw new Error("Unsupported magic: " + cp + " " + magic[cp]);
    }
    else throw new Error("Unrecognized CP: " + cp);
    out.length = k;
    return out.join("");
  };
  var hascp = function(cp) { return cpt[cp] || magic[cp]; };
  cpt.utils = { decode: decode, encode: encode, hascp: hascp, magic: magic, cache:cache };
  return cpt;
}));

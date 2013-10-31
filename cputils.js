if(typeof cptable === "undefined" && typeof require !== "undefined") var cptable = require('./cptable');

(function(cpt){
    var magic = {
        "65001":"utf8"
    };
    var encode = function(cp, data, ofmt) {
        var out = [], w, i, j = 0;
        if(cpt[cp]) {
            for(i = 0; i != data.length; ++i, ++j) {
                w = cpt[cp].enc[data[i]];
                out[j] = w % 256;
                if(w > 255) {
                    out[j] = (w/256)|0;
                    out[++j] = w%256;
                }
            }
        }
        else if(magic[cp]) switch(magic[cp]) { 
            case "utf8": 
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
                } break;
            default: throw "Unsupported magic: " + cp + " " + magic[cp];
        }
        else throw new Error("Unrecognized CP: " + cp); 
        if(ofmt == 'str') return out.map(function(x) { return String.fromCharCode(x); }).join("");
        if(ofmt == 'buf') return new Buffer(out);
        return out;
    };
    var decode = function(cp, data, endian) {
        var out = "", w, i, j = 1;
        if(cpt[cp]) for(i = 0; i != data.length; i+=j) {
            j = 1;
            w = cpt[cp].dec[data[i]];
            if(typeof w === 'undefined') {
                j = 2;
                w = cpt[cp].dec[endian ? data[i]+data[i+1]*256 : data[i]*256 + data[i+1]];
            }
            if(typeof w === 'undefined') throw 'Unrecognized code: ' + data[i] + ' ' + data[i+j-1] + ' ' + i + ' ' + j;
            out += w;
        }
        else if(magic[cp]) for(i = 0; i != data.length; i+=j) {
            j = 1;
            if(data[i] < 128) w = data[i];
            else if(data[i] < 224) { w = (data[i]&31)*64+(data[i+1]&63); j=2; }
            else { w=(data[i]&15)*4096+(data[i+1]&63)*64+(data[i+2]&63); j=3; }
            out += String.fromCharCode(w);
        }
        return out; 
    };
    var hascp = function(cp) {
        return cpt[cp] || magic[cp];
    };
    cpt.utils = { decode: decode, encode: encode, hascp: hascp };
})(cptable);

if(typeof module !== "undefined") module.exports = cptable;


// I dont really understand most of this.....
// Sites Referenced to Construct this class
//      https://rosettacode.org/wiki/LZW_compression#JavaScript
//      https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/

//  TODO: should consider making a utility, I dont think a class structor makes sense.
class CompressedString {
  constructor(string) {
    function compress(uncompressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }

        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            //Do not use dictionary[wc] because javascript arrays
            //will return values for array['pop'], array['push'] etc
           // if (dictionary[wc]) {
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                // Add wc to the dictionary.
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }

        // Output the code for w.
        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result;
    }

    const array = compress(string);
    const buffer = Uint16Array.from(array);

    this.toString = () => String.fromCharCode.apply(null, buffer);
    this.toBuffer = () => buffer;
  }
}

CompressedString.fromString = function (str) {
    var buf = new ArrayBuffer(str.length*2);
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
    }
    return CompressedString.decompress(new Int16Array(buf));
}

CompressedString.decompress = function (compressed) {
    "use strict";
    // Build the dictionary.
    var i,
        dictionary = [],
        w,
        result,
        k,
        entry = "",
        dictSize = 256;
    for (i = 0; i < 256; i += 1) {
        dictionary[i] = String.fromCharCode(i);
    }

    w = String.fromCharCode(compressed[0]);
    result = w;
    for (i = 1; i < compressed.length; i += 1) {
        k = compressed[i];
        if (dictionary[k]) {
            entry = dictionary[k];
        } else {
            if (k === dictSize) {
                entry = w + w.charAt(0);
            } else {
                return null;
            }
        }

        result += entry;

        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);

        w = entry;
    }
    return result;
};

module.exports = CompressedString;

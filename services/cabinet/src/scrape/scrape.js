const { Request } = require('../../globals/request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Scrape {
  constructor(func) {
    class Node {
      constructor(func) {
        let next;
        if ((typeof urlOfunc) === 'function') {
          throw new Error('Argument must be a function');
        }

        this.next = (f) => next = new Node(f);
        this.get = (input) => {
          const result = func(input);
          if (next) {
            if ((typeof result) === 'string')
              Request.get(result, next.get);
            else
              next.get(result);
          }
        }
      }
    }

    return new Node(func);
  }
}


function topKnobParse(body) {
  const document = new JSDOM(body).window.document;
  const items = document.querySelectorAll('.item.product');
  const set = {};
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const text = item.textContent.replace(/[\s\n]{2,}/g, '\|');
    const match = text.match(/.*([A-Z][0-9]{3}-[A-Z]{1,}) (.*) in. \((.*)\)(.*?), (.*?)\|.*?\$(.*?)\|/);
    if (match) {
      const descElem = item.querySelector('.product-item-link');
      const descMatch = descElem.textContent.trim().match(/.*([A-Z0-9]{3,}-[A-Z]{1,}) (.*) in. \((.*)\)(.*?), (.*?)/);
      const url = descElem.href;
      const imageUrl = item.querySelector('.product-image-photo').getAttribute('src');
      const productCode = descMatch[1];
      const size = {standard: descMatch[2], metric: descMatch[3]};
      const name = descMatch[4];
      const finish = descMatch[5];
      const price = item.querySelector('.price').textContent.substr(1);
      set[name] = set[name] || {};
      set[name][finish] = set[name][finish] || {};
      set[name][finish][size.standard] = {productCode, size, price, url, imageUrl};
    }
  }
  return set;
}

const clean = (text) => text.replace(/\s/g, '+');

const print = (obj) =>   console.info(JSON.stringify(obj, null, 2));
const topKnobSearchUrl = (keywords) => {
  keywords = clean(keywords);
  let url = `https://www.topknobsdecor.com/catalogsearch/result/index/?product_list_limit=36&q=${keywords}`;
  return url;
}


const richlueSearchUrl = (keywords) => {
  keywords = clean(keywords);
  const url = `https://www.richelieu.com/us/en/search?s=${searchText}`;
  return url;
}

const matchLink = (body) => {
  const document = new JSDOM(body).window.document;
  return du.id('prodResult').querySelector('a').href;
}
const richlueScraper = new Scraper(richlueSearchUrl);
richlueScraper.next(matchLink).next(getData).next(print);

const topKnobScraper = new Scrape(topKnobSearchUrl);
topKnobScraper.next(topKnobParse).next(print);

// topKnobScraper.get('Malin Collection brass');
richlueScraper.get('Contemporary Metal Handle - 107')

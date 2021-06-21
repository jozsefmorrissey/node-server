
function pull() {
  const items = document.querySelectorAll('.item.product');
  const set = {};
  for (let index = 0; index < items.length; index += 1) {
    const match = items[index].innerText.match(/.*([A-Z][0-9]{3}-[A-Z]{1,}) (.*) in. \((.*)\)(.*?), (.*?)\n.*?\n\$(.*?) /);
    if (match) {
      const productCode = match[1];
      const size = {standard: match[2], metric: match[3]};
      const name = match[4];
      const finish = match[5];
      const price = match[6];
      set[name] = set[name] || {};
      set[name][finish] = set[name][finish] || {};
      set[name][finish][size.standard] = {productCode, size, price};
    }
  }
  console.log(set);
}


Request.get('https://www.topknobsdecor.com/catalogsearch/result/?q=Malin+Collection', (body) => {
  console.log(body);
});

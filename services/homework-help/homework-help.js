function incrementalAdd(initial, increment, percentGrowth) {
  let total = 0;
  let totalDays = 0;
  let cost = initial;
  percentGrowth = !Number.isFinite(percentGrowth) ? 0 : percentGrowth;
  let roundDown = (num) => Math.floor(num * 100) / 100;
  return {
    increment: (count) => {
      count = !Number.isFinite(count) || count < 1 ? 1 : count;
      for (let index = 0; index < count; index += 1) {
        total += cost
        cost += increment;
        increment *= 1+(percentGrowth/100);
      }
      totalDays += count;
      cost = roundDown(cost);
      total = roundDown(total);
      return total;
    },
    adjustBalance: ((value) => total = Math.round((total + value) * 100) / 100),
    total: (offset) => new String(roundDown(total + (offset || 0))).replace(/\.([1-9])$/, '.$10').replace(/^(-[0-9]*)$/, '$1.00'),
    cost: () => new String(cost).replace(/\.([1-9])$/, '.$10').replace(/^(-[0-9]*)$/, '$1.00'),
    percentGrowth: () => percentGrowth,
    incrementValue: () => increment,
    clone: () => incrementalAdd(cost, increment, percentGrowth),
    perjection: (count) => {
      const clone = incrementalAdd(cost, increment, percentGrowth)
      clone.increment(count);
      return clone;
    },
    totalDays: () => totalDays
  }
}

function randomString(len) {
  len = len || 7;
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

function evanHtml(id) {
  const ia = incrementalAddObjs[id];
  const increments = [1,1,1,1,1,5,5,5,5,10,10];
  let perjections = '';
  let day = 0;
  for (let index = 0; index < increments.length; index += 1) {
    day += increments[index];
    const perjection = ia.perjection(day);
    perjections += `<br><b>Day ${day + ia.totalDays()} - \$${perjection.cost()} | \$${perjection.total(Number.parseFloat(ia.total()))}</b>`;
  }
  const adjustUrl = `/evan/adjust`;
  const incUrl = `/evan/increment/${id}`;
  const increment = `<a href='${incUrl}'>Increment</a>`;
  const adjust = `
  <form action="${adjustUrl}" method='POST'>
    <input hidden name='incId' value='${id}'>
    <input name='change'>
    <button type="submit">Update Total</button>
  </form>`;
  const html = `<h1>Days ${ia.totalDays()} \$${ia.cost()} | \$${ia.total()}</h1>${increment}<br/>${adjust}<br/><br/>${perjections}`;

  return html;
}

function endpoints(app) {
  app.get('/evan/view/:randId', function(req, res) {
    res.send(evanHtml(req.params.randId));
  });

  const incrementalAddObjs = {};
  app.get('/evan/setup/:initial/:increment/:percentGrowth', function(req, res) {
    const randId = randomString(128);
    const initial = Number.parseFloat(req.params.initial);
    const inc = Number.parseFloat(req.params.increment);
    const percent = Number.parseFloat(req.params.percentGrowth);
    incrementalAddObjs[randId] = incrementalAdd(initial, inc, percent);
    res.redirect(301, `/evan/view/${randId}`);
  });http://localhost:3000/evan/adjust


  app.get('/evan/increment/:incId', function(req, res) {
    incrementalAddObjs[req.params.incId].increment();
    res.redirect(301, `/evan/view/${req.params.incId}`);
  });

  app.post('/evan/adjust', function(req, res, next) {
    const incId = req.body.incId;
    const change = Number.parseFloat(req.body.change);
    if (!Number.isFinite(change)) {
      next(new Error('Invalid change value'));
    } else {
      incrementalAddObjs[incId].adjustBalance(change);
      res.redirect(301, `/evan/view/${incId}`);
    }
  });

}

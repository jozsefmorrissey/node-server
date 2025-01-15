Gauge = {
  chart: [{mm:0,inch:0}, {inch: .289, mm: 7.348},{inch: .258, mm: 6.543},{inch: .229, mm: 5.827},{inch: .204, mm: 5.189},{inch: .182, mm: 4.621},{inch: .162, mm: 4.115},{inch: .144, mm: 3.664},{inch: .128, mm: 3.263},{inch: .114, mm: 2.906},{inch: .102, mm: 2.588},{inch: .091, mm: 2.304},{inch: .081, mm: 2.052},{inch: .072, mm: 1.828},{inch: .064, mm: 1.628},{inch: .057, mm: 1.449},{inch: .051, mm: 1.291},{inch: .045, mm: 1.149},{inch: .040, mm: 1.024},{inch: .036, mm: .912},{inch: .032, mm: .812},{inch: .028, mm: .723},{inch: .025, mm: .644},{inch: .023, mm: .573},{inch: .020, mm: .511},{inch: .018, mm: .455},{inch: .016, mm: .405},{inch: .014, mm: .360},{inch: .013, mm: .321},{inch: .011, mm: .286},{inch: .010, mm: .255},{inch: .0089, mm: .226},{inch: .0080, mm: .200},{inch: .0071, mm: .180},{inch: .0063, mm: .160},{inch: .0056, mm: .142},{inch: .0050, mm: .130},{inch: .0045, mm: .114},{inch: .0040, mm: .100}],
  to: {
    mm: (guage) => Gauge.chart[guage || 0].mm,
    inch: (guage) => Gauge.chart[gauge || 0].inch
  },
  from: {
    mm: (mm) => Gauge.chart.findLastIndex(obj => obj.mm >= mm),
    inch: (inch) => Gauge.chart.findLastIndex(obj => obj.inch >= inch)
  }
}

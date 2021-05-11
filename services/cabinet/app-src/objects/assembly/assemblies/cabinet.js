const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

const framedFrameWidth = 1.5;
const framelessFrameWidth = 3/4;
class Cabinet extends Assembly {
  constructor(partCode, partName, propsId) {
    super(partCode, partName);
    this.propertyId(propsId);
    this.important = ['partCode', 'partName', 'length', 'width', 'thickness', 'propertyId'];
    const instance = this;
    let frameWidth = framedFrameWidth;
    let toeKickHeight = 4;
    this.part = false;
    this.display = false;
    this.overlay = OVERLAY.HALF;
    this.type = CABINET_TYPE.FRAMED;
    const panels = 0;
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;
    const opening = () => {
      const w = width - (frameWidth * 2);
      const h = height - toeKickHeight - (frameWidth * 2);
      return {width: w, height: h};
    }

    this.borders = () => {
      const right = instance.getAssembly('rr');
      const left = instance.getAssembly('lr');
      const top = instance.getAssembly('tr');
      const bottom = instance.getAssembly('br');
      const pb = instance.getAssembly('pb');
      const depth = pb.position().center('z') + pb.position().limits('-z');
      return {borders: {top, bottom, right, left}, depth};
    }

    this.value('brh', 'tkb.w + pb.t + brr - br.w', true);
    this.value('stl', '(frorl + pr.t)', true);
    this.value('str', '(frorr + pl.t)', true);
    this.value('st', '(str + stl)', true);
    this.addSubAssemblies(

                          new Panel('tkb', 'Panel.Toe.Kick.Backer',
                            'pr.t + frorl + (l / 2), w / 2, tkd + (t / 2)',
                            'tkh, c.w - st, tkbw',
                            'z'),



                          new Frame('rr', 'Frame.Right',
                            'w / 2,brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Frame('lr', 'Frame.Left',
                            'c.w - (w / 2),brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Frame('br', 'Frame.Bottom',
                            'lr.w + (l / 2),brh + (w / 2), t / 2',
                            'frw,c.w - lr.w - rr.w,frt',
                            'z'),



                          new Frame('tr', 'Frame.Top',
                            'lr.w + (l / 2), c.l - (w/2),t / 2',
                            'frw,br.l,frt',
                            'z'),




                          new Panel('pr', 'Panel.Right',
                            'c.w - frorl - (t / 2),l / 2,(w / 2) + lr.t',
                            'c.t - lr.t,c.l,pwt34',
                            'y'),
                          new Panel('pl', 'Panel.Left',
                            'frorr + (t / 2), l / 2, (w/2) + rr.t',
                            'c.t - lr.t,c.l,pwt34',
                            'y'),



                          new Panel('pb', 'Panel.Back',
                            'l / 2 + stl, (w / 2) + tkb.w, c.t - (t / 2)',
                            'c.l - tkb.w, c.w - st, pwt34',
                            'z'),

                          new Panel('pbt', 'Panel.Bottom',
                            '(l / 2) + stl, brh + br.w - (t / 2) - brr,br.t + (w / 2)',
                            'c.t - br.t - pb.t,c.w - st,pwt34',
                            'yx'));


    this.addJoints(new Rabbet('pb->pl', 3/8, 'y', '-x'),
                      new Rabbet('pb->pr', 3/8, 'y', '+x'),
                      new Butt('pb->pbt'),

                      new Dado('tkb->pl', 3/8, 'y', '-x'),
                      new Dado('pl->rr', 3/8, 'x', '-z'),

                      new Dado('tkb->pr', 3/8, 'y', '+x'),
                      new Dado('pr->lr', 3/8, 'x', '-z'),

                      new Dado('pbt->pl', 3/8, 'y', '-x'),
                      new Dado('pbt->pr', 3/8, 'y', '+x'),

                      new Dado('pbt->br', 3/8),
                      new Dado('pbt->rr', 3/8),
                      new Dado('pbt->lr', 3/8),

                      new Butt('tr->rr'),
                      new Butt('tr->lr'),
                      new Butt('br->rr'),
                      new Butt('br->lr'));
    this.opening = new DivideSection(this.borders);
    this.addSubAssembly(this.opening);
    this.borders();
  }
}

Assembly.register(Cabinet);

CustomEvent = require('../../../public/js/utils/custom-event.js');


class SlideShow {
  constructor(parse, show) {
    let slideDataList;
    let speed = 2000;
    let slideIndex = -1;
    let _slides;
    this.length = () => slideDataList ? slideDataList.length : 0;
    const len = this.length;
    this.playing = () => playerId !== null;
    CustomEvent.all(this, 'show', 'play', 'pause')

    const validIndex = i => i < 0 ? len() : (i >= len() ? 0 : i);
    this.slide = (i, lines) => {
      if (!Number.isFinite(i)) i = slideIndex;
      return (lines === true ? _slides : slideDataList)[validIndex(i)];
    }

    this.slides = (slides) => {
      if (slides) {
        slideDataList = slides.map(s => parse(s));
        _slides = slides;
      }
      return slides;
    }

    let playerId = null;
    let nextSlideTime = 0;
    this.play = (id) => {
      if (id === undefined) {
        id = playerId === null ? (playerId = 0) : ++playerId;
        this.trigger.play(this);
      }
      if (id === playerId) {
        const time = new Date().getTime();
        if (time > nextSlideTime) {
          nextSlideTime = time + speed;
          slideIndex++;
          show(this.slide());
          this.trigger.show(this);
          if (slideIndex >= slideDataList.length) slideIndex = 0;
        }
        setTimeout(() => this.play(id), speed, 50);
      }
    }

    this.pause = (i) => {
      playerId = null;
      this.slideIndex(i);
      show(this.slide());
      this.trigger.pause(this);
      this.trigger.show(this);
    }

    this.next = () => this.pause(slideIndex + 1);
    this.previous = () => this.pause(slideIndex - 1);

    this.slideIndex = (i) => Number.isFinite(i) ? (slideIndex = validIndex(i)) : slideIndex;
    this.speed = (s) => Number.isFinite(s) ? (speed = s) : speed;
  }
}

module.exports = SlideShow;

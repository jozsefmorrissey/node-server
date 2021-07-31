class InformationBar {
  constructor() {
    const container = document.createElement('div');
    container.className = 'information-bar';

    this.show = () => container.hidden = false;
    this.hide = () => container.hidden = true;
    this.update = (html) => container.innerHTML = html;

    document.body.append(container);
  }
}

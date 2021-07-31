
class AbstractManager {
  constructor(id, name) {
    let list;
    const manager = this;
    this.saveBtnId = `${name}-manager-save-btn`;
    this.headerId = `${name}-manager-header-cnt`;
    this.bodyId = `${name}-manager-body-cnt`;
    this.header = `${name.substr(0,1).toUpperCase()}${name.substr(1)} Manager`;
    const parentSelector = `#${this.bodyId}`;
    const template = new $t('managers/abstract-manager');
    const bodyTemplate = new $t(`managers/${name}/body`);
    const headTemplate = new $t(`managers/${name}/header`);

    const getHeader = (instance) => headTemplate.render({instance, manager});
    const getBody = (instance) => bodyTemplate.render({instance, manager});

    const getObject = (typeof manager.getObject) === 'function' ?
                        (values) => manager.getObject(values) : undefined;

    function init(json) {
      document.getElementById(id).innerHTML = template.render(manager);
      list = manager.fromJson(json) || [];
      const expListProps = {
        inputTree: manager.constructor.inputTree(),
        parentSelector, getHeader, getBody, getObject, list,
        hideAddBtn: true
      };
      const expandList = new ExpandableList(expListProps);

      const saveSuccess = () => console.log('success save');
      const saveFail = () => console.log('failed save');
      const save = (target) => {
        const body = manager.toJson();
        Request.post(manager.savePoint(), body, saveSuccess, saveFail);
      }
      matchRun('click', `#${manager.saveBtnId}`, save);
    }

    afterLoad.push(() => Request.get(manager.loadPoint(), init));
  }
}

AbstractManager.inputTree = () => undefined;

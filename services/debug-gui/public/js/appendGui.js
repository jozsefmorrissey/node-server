
function addScript(id, src) {
  if (!document.getElementById(id)) {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    document.head.appendChild(script);
  }
}

if (db.getHost() && dg.isDebugging() && DebugGuiClient.inBrowser) {
  if ((typeof ShortCutContainer) === 'undefined') {
    addScript('ssc-unique-id', 'https://node.jozsefmorrissey.com/js/short-cut-container.js');
  }
  addScript(DebugGuiClient.EXISTANCE_ID, `${getHost()}/js/debug-gui-client.js`);
  addScript(DebugGuiClient.UI_EXISTANCE_ID, `${getHost()}/js/debug-gui.js`);
}

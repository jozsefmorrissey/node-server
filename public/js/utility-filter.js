const SEARCH_TYPES = {
  REGEX: "REGEX",
  LIKE: "LIKE",
  SELECT: "SELECT",
  ALL: "__all",
};

const UTF = {};
UTF.dataMap = {};
UTF.dataId = 1;
UTF.states = {};
UTF.states[SEARCH_TYPES.ALL] = {};
UTF.objectLookup = [];

function UtilityFilter() {
  function save(id) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `http://localhost:3500/${id}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var userInfo = JSON.parse(xhr.responseText);
        }
    };
    xhr.send(JSON.stringify(UTF.objectLookup[id]));
  }

  function getRating(text, userValue, type) {
    let asStr = String(text);
    switch (type) {
      case SEARCH_TYPES.REGEX:
        try {
          const matches = asStr.toLowerCase().match(new RegExp(userValue, 'g'));
          return (matches && matches.length) > 0 ? matches.length : -1;
        } catch (e) {
          return 0;
        }
      case SEARCH_TYPES.LIKE:
        let diff = asStr.length > userValue.length ? asStr.length - userValue.length : userValue.length - asStr.length;
        let max = asStr.length > userValue.length ? asStr.length : userValue.length;
        let levDist = levenshteinDistance(asStr.toLowerCase(), userValue.toLowerCase());
        return 1 - ((levDist / diff) + (levDist / max));
      case SEARCH_TYPES.SELECT:
        return userValue.indexOf(asStr) != -1 ? 1 : -1;
    }
  }

  function rateColumn(state, candidate, column) {
    const colState = state[column];
    const text = candidate[column];
    if (colState.value === undefined && state[SEARCH_TYPES.ALL] && state[SEARCH_TYPES.ALL].value === undefined) {
      return 0;
    }
    let value = 0;
    if (colState.value) {
      value += getRating(text, colState.value, colState.type);
    }
    if (value != -1 && state[SEARCH_TYPES.ALL] && state[SEARCH_TYPES.ALL].value) {
      value += getRating(text, state.__all.value, state.__all.type);
      if (value == -1) {
        return 0;
      }
    }
    return value;
  }

  function filterSelects(id) {
    const state = UTF.states[id];
    for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
      const column = Object.keys(state)[cIndex];
      const columnObj = state[column];
      const selectId = `${getSelectId(UTF.dataMap[id].id, column)}_itemList`;
      if (columnObj.type == SEARCH_TYPES.SELECT) {
        const list = document.getElementById(selectId).querySelectorAll('.multiselect-checkbox');
        for (let eIndex = 1; eIndex < list.length; eIndex += 1) {
          const selector = list[eIndex].parentNode;
          const value = selector.querySelector('.multiselect-text').innerText;
          if (columnObj.eliminated && columnObj.eliminated[value] &&
            columnObj.eliminated[value] !== false &&
            (Object.keys(columnObj.eliminated[value]).length > 1 ||
            Object.keys(columnObj.eliminated[value])[0] !== column)) {
              selector.style.display = 'none';
            } else {
              selector.style.display = 'block';
            }
          }
      }
      columnObj.eliminated = undefined;
    }
  }

  function eliminateColumn(state, candidate, eliminator) {
    for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
      const column = Object.keys(state)[cIndex];
      const value = String(candidate[column]);
      if (state[column].eliminated === undefined) {
        state[column].eliminated = {};
      }
      if (state[column].eliminated[value] === undefined) {
        state[column].eliminated[value] = {};
      }
      if (state[column].eliminated[value] !== false) {
        state[column].eliminated[value][eliminator] = true;
      }
    }
  }

  function protect(state, candidate) {
    for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
      const column = Object.keys(state)[cIndex];
      const value = String(candidate[column]);
      if (state[column].eliminated === undefined) {
        state[column].eliminated = {};
      }
      if (state[column].eliminated[value] === undefined) {
        state[column].eliminated[value] = {};
      }
      state[column].eliminated[value] = false;
    }
  }

  function filterRows(id) {
    const state = UTF.states[id];
    const data = UTF.dataMap[id].data;
    const filtered = [];
    const columns = Object.keys(state);
    const visible = {};
    for (let dIndex = 0; dIndex < data.length; dIndex += 1 ) {
      let candidate = data[dIndex];
      let rowRating = 0;
      let eliminated = false;
      for (let cIndex = 0; cIndex < columns.length; cIndex += 1) {
        const column = columns[cIndex];
        if (column !== SEARCH_TYPES.ALL) {
          rating = rateColumn(state, candidate, column);
          if (rating == -1) {
            eliminateColumn(state, candidate, column);
            eliminated = true;
          } else {
            rowRating += rating;
          }
        }
      }
      if (!eliminated) {
        filtered.push({candidate, rowRating});
        protect(state, candidate);
      }
    }
    filterSelects(id);
    return filtered;
  }

  function mapArray(data, name) {
    let columns = {};
    let unique = {};
    for (let index = 0; index < data.length; index += 1) {
      let obj = data[index];
      if (typeof obj === "object") {
        const keys = Object.keys(obj);
        for (let kIndex = 0; kIndex < keys.length; kIndex += 1) {
          const key = keys[kIndex];
          if (columns[key] === undefined) {
            unique[key] = {}
          }
          unique[key][data[index][key]] = null;
          columns[key] = Object.keys(unique[key]);
        }
      }
    }
    return columns;
  }

  function buildHeader(dataId) {
    let uniqueId = buildId('radio', UTF.dataMap[dataId].id, SEARCH_TYPES.ALL);
    const inputId = buildId('input', UTF.dataMap[dataId].id, SEARCH_TYPES.ALL);
    const likeId = buildId(uniqueId, SEARCH_TYPES.LIKE);
    const regexId = buildId(uniqueId, SEARCH_TYPES.REGEX);
    let header = `<div class='search-all-ctn'>
                <label>${UTF.dataMap[dataId].searchAllLabel || 'Search All: '}</label>
                <input class='utf-input' id='${inputId}' type='text' maxlength='30'
                    onkeydown="if (event.keyCode == 13) UTF.onSearchEnter(event)">
                <label>Like</label>
                <input class='utf-input' type='radio' name='${uniqueId}' id='${likeId}' value='${SEARCH_TYPES.LIKE}' checked>
                <label>Regex</label>
                <input class='utf-input' type='radio' name='${uniqueId}' id='${regexId}' value='${SEARCH_TYPES.REGEX}'>
                <a id='utf-edit' hidden href='#' style='float: right;'>
                  Edit
                </a>
              </div>`;

    UTF.states[dataId] = {};
    UTF.states[dataId][SEARCH_TYPES.ALL] = {};
    UTF.states[dataId][SEARCH_TYPES.ALL].type = SEARCH_TYPES.LIKE;

    return header;
  }

  function runFuncs(funcs, arg) {
    for (let index = 0; index < funcs.length; index += 1) {
      const func = funcs[index];
      if ((typeof func) === 'function') {
        func.call(null, arg);
      } else if (func.trim().match(/^.*\(.*\)$/)) {
        eval(func);
      } else if ((typeof arg) === 'object') {
        eval(func + '(' + JSON.stringify(arg) + ')');
      } else if ((typeof arg) === 'string') {
        eval(func + '("' + arg + '")');
      } else {
        eval(func + '(' + arg + ')');
      }
    }
  }

  function onSearchEnter (e) {
    const funcs = UTF.dataMap[splitId(e.target.id)[1]].onSearchAll;
    runFuncs(funcs, e);
  }

  function updateAllState(e) {
    const id = splitId(e.id)[1];
    const uniqueId = buildId('radio', UTF.dataMap[id].id, SEARCH_TYPES.ALL);
    const inputId = buildId('input', UTF.dataMap[id].id, SEARCH_TYPES.ALL);

    UTF.states[id][SEARCH_TYPES.ALL].type = document.querySelector(`input[name='${uniqueId}']`).value;
    UTF.states[id][SEARCH_TYPES.ALL].value = document.getElementById(inputId).value;
    inputUpdate(id);
  }

  const idSeperator = '---'
  function buildId() {
    let uniqueId = arguments[0];
    for (let index = 1; index < arguments.length; index += 1) {
      uniqueId += `${idSeperator}${arguments[index]}`;
    }
    return uniqueId;
  }

  function splitId(id) {
    return id.split(idSeperator);
  }

  function setState(id, column, type, value) {
    if (!UTF.states[id][column]) {
      UTF.states[id][column] = {type, value};
    } else {
      if (type) {
        UTF.states[id][column].type = type;
      }
      UTF.states[id][column].value = value;
    }
  }

  function getSelectId(id, column) {
    return buildId('selector', id, column);
  }

  function removeColumn(id, index) {
    UTF.dataMap[id].hide.push(index);
    document.getElementById(getTabCtnId(id)).querySelectorAll('th')[index].style.display = 'none';
    sort(id);
  }

  function getColumns(id, all) {
    const columnsObj = UTF.dataMap[id].columns;
    const columnCandidates = Object.keys(columnsObj);
    const columns = [];
    for (let index = 0; index < columnCandidates.length; index += 1) {
      const column = columnCandidates[index];
      if (column != 'id') {
        columns.push(column);
      }
    }
    return columns;
  }

  function buildMenu(id) {
    const columnsObj = UTF.dataMap[id].columns;
    const columns = getColumns(id);
    let menu = '';
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const uniqueId = buildId('radio', UTF.dataMap[id].id, column);
      const selectId = buildId(uniqueId, SEARCH_TYPES.SELECT);
      const likeId = buildId(uniqueId, SEARCH_TYPES.LIKE);
      const regexId = buildId(uniqueId, SEARCH_TYPES.REGEX);
      const textId = buildId('input', UTF.dataMap[id].id, column, 'text');
      setState(id, column, SEARCH_TYPES.SELECT);
      let datalist = `<select class='multi-select-column' id='${getSelectId(UTF.dataMap[id].id, column)}' multiple>`;
      for (let uIndex = 0; uIndex < columnsObj[column].length; uIndex += 1) {
        let value = columnsObj[column][uIndex];
        datalist += `<option value='${value}'>${value}</option>`
      }
      datalist += '</select>';

      menu += `<th class='relative column-${index}'>
      <label>${column}</label>
      <br>
      <input class='utf-input' hidden type='text' id='${textId}'>
      ${datalist}
      <br>
      <div class='search-radio-ctn'>
        <label>s</label>
        <input class='utf-input' type='radio' name='${uniqueId}' id='${selectId}' value='${SEARCH_TYPES.SELECT}' checked>
        <label>l</label>
        <input class='utf-input' type='radio' name='${uniqueId}' id='${likeId}' value='${SEARCH_TYPES.LIKE}'>
        <label>r</label>
        <input class='utf-input' type='radio' name='${uniqueId}' id='${regexId}' value='${SEARCH_TYPES.REGEX}'>
      </div>
      <button class='close-btn' onclick='UTF.removeColumn("${id}", ${index})'>X</button>
      </th>`;
    }
    return menu;
  }

  function deactivateSelects(dataId) {
    const radioCtns = UTF.dataMap[dataId].elem.querySelectorAll('.search-radio-ctn');
    let aRadio;
    for (let index = 0; index < radioCtns.length; index += 1) {
      const radios = radioCtns[index].querySelectorAll('input');
      radios[1].checked = radios[0].checked || radios[1].checked;
      radios[0].disabled = true;
      const selected = radios[1].checked ? radios[1] : radios[2];
      radioUpdate(selected);
    }
  }

  let lookUpId = 0;
  const lookUpRow = {};

  function getDataObj(id, value) {
    const intId = Number.parseInt(id);
    if (value !== undefined) {
      lookUpRow[intId] = value;
    } else {
      return lookUpRow[intId];
    }
  }

  function buildBody(data, dataId) {
    let body = '';
    const keys = getColumns(dataId);
    let count = 1;
    for (let index = 0; index < data.length; index += 1) {
      const clazz = count++ % 2 === 0 ? 'tr-even' : 'tr-odd';
      getDataObj(lookUpId, { dataId, data: data[index] });
      const editAttr = UTF.dataMap[dataId].enableEdit ? "onclick='UTF.openPopUp(this)'" : '';
      body += `<tr look-up-id='${lookUpId++}' ${editAttr} class='${clazz}'>`;
      for(let kIndex = 0; kIndex < keys.length; kIndex += 1) {
        const column = keys[kIndex];
        let display = 'table-cell';
        if (UTF.dataMap[dataId].hide.indexOf(kIndex) !== -1) {
          display = 'none';
        }
        let elem = String(data[index][column]) || '';
        elem = elem === 'undefined' ? '' : elem;
        elem = elem.replace(/[@]\[(.*?)\]\((.*?)\)/g, `<a class='utf-link' target='_blank' href='$2'>$1</a>`);
        elem = elem.replace(/(([^@]|))\[(.*?)\]\((.*?)\)/g, `$1<a class='utf-link' href='$4'>$3</a>`);


        body += `<td style='display: ${display};' class='column-${kIndex}'>${elem}</td>`;
      }
      body += '</tr>';
    }
    return body;
  }

  function hideAll(id) {
    const elems = document.getElementById(UTF.dataMap[id].ufId).getElementsByClassName('tab-ctn');
    for (let index = 0; index < elems.length; index += 1) {
      const elem = elems[index];
      elem.style.display = 'none';
    }
  }

  function displayTable(id, anchor) {
    hideAll(id);
    UTF.dataMap[id].elem.querySelector('.tab-active').classList.remove('tab-active');
    let elem = document.getElementById(`${getTabCtnId(UTF.dataMap[id].id)}`);
    elem.style.display = 'block';
    anchor.classList.add('tab-active');
  }

  function buildTable(id, data) {
    let table = "<table><tr>"
    table += buildMenu(id);
    table += `</tr><tbody id='tbody-${id}'>`;
    table += buildBody(data, id);
    table += '</tbody></table>';

    return table;
  }

  function multiSelectSetup(id) {
    return function () {
      const columnsObj = UTF.dataMap[id].columns;
      const columns = getColumns(id);
      for (let index = 0; index < columns.length; index += 1) {
        column = columns[index];
        for (let uIndex = 0; uIndex < columnsObj[column].length; uIndex += 1) {
          let multiSelectId = getSelectId(UTF.dataMap[id].id, column);
          document.multiselect(`#${multiSelectId}`);
        }
      }
    }
  }

  function buildTabs(ids) {
    let tabs = ['<ul class="nav nav-tabs">'];
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      let clazz = 'tab';
      if (i === 0) {
        clazz += ' tab-active';
      }
      tabs.push(`<li class="active"><a id='tab-${id.dataId}' class='${clazz}' onclick='UTF.displayTable("${id.dataId}", this)'>${id.id}</a></li>`);
    }
    tabs.push(`<li class="active"><a id='tab-add' class='tab' onclick='addTable(this)'>+</a></li>`);
    return tabs.join('') + "</ul>";
  }

  function closePopUp() {
      const haze = document.querySelector('#pop-up-haze');
      const rowId = haze.querySelector('look-up-id').id;
      sort(getDataObj(rowId).dataId);
      haze.style.display = 'none';
  }

  function updateData(elem, rowId, label) {
    getDataObj(rowId).data[label] = elem.value.trim();
    UTF.dataMap[getDataObj(rowId).dataId].updated = true;
    deactivateSelects(getDataObj(rowId).dataId);
  }

  const attrInputId = 'obj-attr-input-id';
  function addToObject(id) {
    const label = document.getElementById(attrInputId).value;
    if (label) {
      const haze = document.querySelector('#pop-up-haze');
      const rowId = haze.querySelector('look-up-id').id;
      const dataId = getDataObj(rowId).dataId;
      const elem = UTF.dataMap[dataId].elem;
      const data = UTF.dataMap[dataId].data[0][label] = '';
      save(dataId);
      window.location.reload();
    }
  }

  UTF.addToObject = addToObject;

  function openPopUp(elem) {
      let headers = elem.parentElement.parentElement.querySelectorAll('th');
      const id = elem.attributes['look-up-id'].value;
      let values = getDataObj(id).data;
      let body = `<look-up-id id='${id}'></look-up-id>`;
      for (let index = 0; index < headers.length; index += 1) {
        const label = headers[index].querySelector('label').innerText.trim();
        let value = values[label];
        value = value === undefined ? '' : value.trim();
        body += `<label>
                    ${label}:
                </label>`;
        body += `<br><textarea rows=5 cols=150
            onchange='UTF.updateData(this, ${id}, "${label}")'>${value}</textarea>
            <br><br>`;
      }
      body += `<input id='${attrInputId}' type="text"><button onClick='UTF.addToObject(${id})'>Add</button>`;
      document.querySelector('#pop-up').innerHTML = body;
      document.querySelector('#pop-up-haze').style.display = 'block';
  }

  function buildPopUp() {
    let haze = document.createElement('div');
    haze.id = 'pop-up-haze';
    haze.onclick = closePopUp;
    haze.style.display = 'none';
    haze.innerHTML = `<div onclick='event.stopPropagation()' id='pop-up'><h2>Pop Up</h2></div>`;
    return haze;
  }

  function getTabCtnId(id) {
    return `tab-cnt-${id};`
  }

  function addRow(strId) {
    const dataId = Number.parseInt(strId);
    UTF.dataMap[dataId].data.push({});
    sort(dataId);
    deactivateSelects(dataId);
  }

  function getDataId(elemId) {
    const elemIds = Object.keys(UTF.dataMap);
    for (let index = 0; index < elemIds.length; index += 1) {
      const dataElem = UTF.dataMap[elemIds[index]];
      if (dataElem.ufId == elemId) {
        return elemIds[index];
      }
    }
    return undefined;
  }

  function buildDataTable(dataId) {
    let display = `<div class='tab-ctn' id='${getTabCtnId(dataId)}'>`;
    display += buildHeader(dataId);
    display += buildTable(dataId, UTF.dataMap[String(dataId)].data);
    if (UTF.dataMap[dataId].enableEdit) {
      display += `<button onclick='UTF.addRow("${dataId}")'>add</button>`;
      display += `<button onclick='UTF.save("${dataId}")'>Save</button></div>`;
    }
    display += '</div>';
    return display;
  }

  function save(dataId) {
    const obj = UTF.dataMap[dataId];
    console.log(obj.ufId);
    try {
      eval(obj.save);
    } catch (e) {}
  }

  function initDataMapElem(elem, data, name) {
    const dataId = UTF.dataId++;
    elem.id = elem.id ? elem.id : `utility-filter-${dataId}`;
    const save = elem.getAttribute('save');
    const enableEdit = elem.getAttribute('edit') === 'true';
    UTF.dataMap[dataId] = { elem, ufId: elem.id, hide:[], data, id: dataId,
          columns: mapArray(data), name, save, onSearchAll: [], enableEdit };
    UTF.objectLookup[elem.id] = data;
    elem.style.display = 'block';
    return dataId;
  }

  function buildTabularDisplay(elem, data, canEdit) {
    const keys = Object.keys(data);
    let display = '';
    let dataId;
    let ids = [];
    let startDataId;
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      dataId = initDataMapElem(elem, data[key], key);
      UTF.dataMap[dataId].enableEdit = canEdit !== undefined ? canEdit :
            UTF.dataMap[dataId].enableEdit;
      startDataId = Number.parseInt(startDataId || dataId);
      ids.push({ id: key, dataId });

      display += buildDataTable(dataId);
      setTimeout(multiSelectSetup(dataId), 0);
    }
    display = buildTabs(ids) + display;
    elem.innerHTML = `<div>${display}<button onclick='save("${elem.id}")'>save</button>`;
    displayTable(startDataId, document.querySelector(`#tab-${startDataId}`));
  }

  function buildDisplay(elem, data, canEdit) {
    data = data || JSON.parse(elem.innerText);
    setEventHandlers(elem);
    if (Array.isArray(data)) {
      const dataId = initDataMapElem(elem, data);
      UTF.dataMap[dataId].enableEdit = canEdit !== undefined ? canEdit :
            UTF.dataMap[dataId].enableEdit;
      elem.innerHTML = buildDataTable(dataId);
      setTimeout(multiSelectSetup(dataId), 0);
    } else if (typeof data === 'object') {
      buildTabularDisplay(elem, data, canEdit);
    }
  }

  function setEventHandlers(elem) {
    elem.onclick = function(e){
       e=window.event? event.srcElement: e.target;
       if(e.className == 'utf-input' && e.type.toLowerCase() === 'radio')radioUpdate(e);
    }
    elem.onkeyup = function(e){
       e=window.event? event.srcElement: e.target;
       if(e.className == 'utf-input' && e.type.toLowerCase() === 'text')columnInputUpdate(e);
    }

    elem.onchange = function(e){
       e=window.event? event.srcElement: e.target;
       if(e.className == 'utf-input' && e.className === 'multiselect-checkbox')selectInputUpdate(e);
    }
  }

  function onLoad() {
    let elems = document.getElementsByTagName('utility-filter');
    let ufId = 0;
    for (index = 0; index < elems.length; index += 1) {
      buildDisplay(elems[index]);
    }
    document.querySelector('body').appendChild(buildPopUp());

    document.querySelector('#pop-up').addEventListener('click', function(event){
      event.stopPropagation();
    });
    // document.body.onclick= function(e){
    //    e=window.event? event.srcElement: e.target;
    //    if(e.className == 'utf-input' && e.type.toLowerCase() === 'radio')radioUpdate(e);
    // }
    // document.body.onkeyup= function(e){
    //    e=window.event? event.srcElement: e.target;
    //    if(e.className == 'utf-input' && e.type.toLowerCase() === 'text')columnInputUpdate(e);
    // }
    //
    // document.body.onchange = function(e){
    //    e=window.event? event.srcElement: e.target;
    //    if(e.className == 'utf-input' && e.className === 'multiselect-checkbox')selectInputUpdate(e);
    // }

    document.multiselect('#testSelect1');
  }

  function columnInputUpdate(e) {
    let arr = splitId(e.id);
    const id = arr[1];
    const column = arr[2];
    const type = arr[3];
    value = e.parentNode.querySelector('input').value;
    setState(id, column, undefined, value);
    inputUpdate(id);
  }

  function findFirstUp(e, selector) {
    while (!e.parentNode.querySelector(selector)) {
      e = e.parentNode;
    }
    return e.parentNode.querySelector(selector);
  }

  function selectInputUpdate(e) {
    const selectElem = findFirstUp(e, 'select');
    let arr = splitId(selectElem.id);
    const id = arr[1];
    const column = arr[2];
    const type = arr[3];
    const selected = selectElem.querySelectorAll('option[selected=selected]');
    value = Array.from(selected).map(el => el.value);
    setState(id, column, undefined, value);
    inputUpdate(id);
  }

  function radioUpdate(e) {
    let arr = splitId(e.id);
    const id = arr[1];
    const column = arr[2];
    const type = arr[3];
    let value;
    if (type === SEARCH_TYPES.SELECT) {
      const selected = e.parentNode.parentNode.querySelectorAll('option[selected=selected]');
      value = Array.from(selected).map(el => el.value);
      e.parentNode.parentNode.querySelector('input').style.display = "none";
      e.parentNode.parentNode.getElementsByClassName('multiselect-wrapper')[0].style.display = "inline-block";
    } else {
      value = e.parentNode.parentNode.querySelector('input').value;
      e.parentNode.parentNode.querySelector('input').style.display = "inline-block";
      if (column != '__all') {
        e.parentNode.parentNode.getElementsByClassName('multiselect-wrapper')[0].style.display = "none";
      }
    }

    setState(id, column, type, value);
    sort(id);
  }

  function sort(id) {
    let filtered = filterRows(id);
    filtered.sort(function (a, b) {return b.rowRating - a.rowRating});
    filtered = Array.from(filtered).map(el => el.candidate);
    UTF.dataMap[id].elem.querySelector(`#tbody-${id}`).innerHTML = buildBody(filtered, id);
  }

  let updatePending = false;
  let doneTyping = false;
  let wait = 400
  function inputUpdate(id) {
    function run() {
      if (doneTyping) {
        updatePending = false;
        sort(id);
      } else {
        doneTyping = true;
        setTimeout(run, wait);
      }
    }
    doneTyping = false;
    if (!updatePending) {
      doneTyping = true;
      updatePending = true;
      setTimeout(run, wait);
    }
  }

  // The following function is from https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/string/levenshtein-distance/levenshteinDistance.js
  function levenshteinDistance(a, b) {
    const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i += 1) {
      distanceMatrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j += 1) {
      distanceMatrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        distanceMatrix[j][i] = Math.min(
          distanceMatrix[j][i - 1] + 1, // deletion
          distanceMatrix[j - 1][i] + 1, // insertion
          distanceMatrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return distanceMatrix[b.length][a.length];
  }

  function refresh(dataId, canEdit) {
    const elem = UTF.dataMap[dataId].elem;
    UTF.dataMap[dataId].enableEdit = canEdit !== undefined ? canEdit :
          UTF.dataMap[dataId].enableEdit;
    inputUpdate(dataId);
  }

  function setEdit(id, canEdit) {
    refresh(getDataId(id), canEdit);
  }

  function searchAllOnEnter(id, func, label) {
    const dataId = getDataId(id);

    UTF.dataMap[dataId].searchAllLabel = label || UTF.dataMap[dataId].searchAllLabel;
    UTF.dataMap[dataId].onSearchAll.push(func);
  }

  function getData(ufId) {
    const datas = [];
    const dataMapKeys = Object.keys(UTF.dataMap);
    for (let index = 0; index < dataMapKeys.length; index += 1) {
      const obj = UTF.dataMap[dataMapKeys[index]];
      if (obj.ufId == ufId) {
        datas.push(obj);
      }
    }
    if (datas.length == 0) return undefined;
    if (datas.length == 1) return datas[0].data;

    const retObj = {};
    for (let index = 0; index < datas.length; index += 1) {
      retObj[datas[index].name] = datas[index].data;
    }
    return retObj;
  }

  var script = document.createElement("script");
  script.src = '/js/multiselect.min.js';
  document.head.appendChild(script);

  var style = document.createElement("link");
  style.href = '/styles/multiselect.css';
  style.rel = 'stylesheet';
  document.head.appendChild(style);

  style = document.createElement("link");
  style.href = '/styles/utility-filter.css';
  style.rel = 'stylesheet';
  document.head.appendChild(style);

  window.addEventListener('load', onLoad);

  UTF.setEdit = setEdit;
  UTF.openPopUp = openPopUp;
  UTF.closePopUp = closePopUp;
  UTF.updateData = updateData;
  UTF.removeColumn = removeColumn;
  UTF.getData = getData;
  UTF.addRow = addRow;
  UTF.displayTable = displayTable;
  UTF.save = save;
  UTF.onSearchEnter = onSearchEnter;
  UTF.searchAllOnEnter = searchAllOnEnter;

  this.test = function () {
    console.log('testin');
  }

}

UtilityFilter();

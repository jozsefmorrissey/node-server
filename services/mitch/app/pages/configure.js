
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
require('../../../../public/js/utils/input/init');
const Input = require('../../../../public/js/utils/input/input');
const Radio = require('../../../../public/js/utils/input/styles/radio');
const Table = require('../../../../public/js/utils/input/styles/table');
const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
const du = require('../../../../public/js/utils/dom-utils.js');

let count = 0;
let modify = true;

du.on.match('click', '#modify-btn', (elem) => {
  modify = !modify
  if (modify) du.class.add(elem, 'modify');
  else du.class.remove(elem, 'modify');
  updateEntireTree();
});

const getInput = () => new Input({
  label: `Label${++count}`,
  name: `Name${count}`,
  inline: true,
  class: 'center',
});

let tree;
function updateEntireTree() {
  const body = tree.html(null, modify);
  du.id('config-body').innerHTML = body;
}

function addInput(elem) {
  const node = DecisionInputTree.getNode(elem);
  node.payload().inputArray.push(getInput());
  if (node.payload().isRoot()) updateEntireTree();
  else {
    const html = node.payload().html(null, true);
    du.find.up('.decision-input-cnt', elem).outerHTML = html;
  }
}






















du.on.match('click', '.add-btn', addInput);
function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();
  // tree = new DecisionInputTree('ancestry', {name: 'Ancestry'});
  tree = DecisionInputTree.fromJson(treeJson);
  tree.payloadHandler(new PayloadHandler('ancestry', new Input({name: 'name', label: 'Name', optional: true})));

  tree.onComplete(console.log);
  tree.onSubmit(console.log);

  updateEntireTree();
}

// const radio = new Radio({
//   name: 'radeo',
//   description: 'Pussy farts',
//   list: ['one', 2, 3, 'four']
// });
// du.id('test-ground').innerHTML = radio.html();
// du.id('test-ground').innerHTML = Radio.yes_no({name: 'yn'}).html();
// du.id('test-ground').innerHTML = Radio.true_false({name: 'tf'}).html();

// const table = new Table({
//   name: 'tabal',
//   description: 'Pussy fartsss',
//   columns: ['one', 2, 3, 'four'],
//   rows: ['bill', 'scott', 'joe', 'fred']
// });
du.id('test-ground').innerHTML = '<button id="json">JSON</button>';
du.on.match('click', '#json', () => {
  du.copy(JSON.stringify(tree.toJson(), null, 2));
})

// const input1 = getInput();
// const input2 = getInput();
// const input3 = getInput();
// const me = new MultipleEntries([input1, input2, input3], {label: 'oneTwoThree'});
// du.id('test-ground').innerHTML = me.html();

exports.proccess = proccess;




const treeJson = {
  "_TYPE": "DecisionInputTree",
  "id": "DecisionInputTree_d8jojl9",
  "ID_ATTRIBUTE": "id",
  "stateConfigs": {
    "ancestry": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_5lc55yw",
      "ID_ATTRIBUTE": "id",
      "name": "ancestry",
      "payload": {
        "name": "Ancestry",
        "inputArray": [
          {
            "_TYPE": "Input",
            "ID_ATTRIBUTE": "id",
            "type": "text",
            "name": "name",
            "label": "Name",
            "hidden": false,
            "list": [],
            "optional": false,
            "value": "",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ]
      }
    },
    "jozsefMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_z2kvf4y",
      "ID_ATTRIBUTE": "id",
      "name": "jozsefMorrissey",
      "payload": {
        "name": "Jozsef Morrissey",
        "inputArray": []
      }
    },
    "jeradMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_7vdz7vu",
      "ID_ATTRIBUTE": "id",
      "name": "jeradMorrissey",
      "payload": {
        "name": "JeradMorrissey",
        "inputArray": []
      }
    },
    "relation": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_9r7ewb4",
      "ID_ATTRIBUTE": "id",
      "name": "relation",
      "payload": {
        "name": "",
        "inputArray": [
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "relations",
            "label": "Relations",
            "list": [
              "Spouse",
              "Children",
              "Mother",
              "Father",
              "Siblings",
              "Imediate Family"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "Spouse",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ]
      }
    }
  },
  "name": "ancestry",
  "root": {
    "name": "ancestry",
    "payload": {
      "inputArray": [
        {
          "_TYPE": "Input",
          "ID_ATTRIBUTE": "id",
          "type": "text",
          "name": "name",
          "label": "Name",
          "hidden": false,
          "list": [],
          "optional": false,
          "value": "Jozsef Morrissey",
          "targetAttr": "value",
          "errorMsg": "Error"
        }
      ],
      "PAYLOAD_ID": "qqf65e3"
    },
    "conditions": [],
    "childConditions": [],
    "children": {
      "jozsefMorrissey": {
        "name": "jozsefMorrissey",
        "payload": {
          "name": "Jozsef Morrissey",
          "inputArray": [],
          "PAYLOAD_ID": "ell2exe"
        },
        "conditions": [
          {
            "_TYPE": "ExactCondition",
            "attribute": "name",
            "value": "Jozsef Morrissey",
            "deligator": {
              "_TYPE": "NodeCondition"
            }
          }
        ],
        "childConditions": [],
        "children": {
          "relation": {
            "name": "relation",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Spouse",
                    "Children",
                    "Mother",
                    "Father",
                    "Siblings",
                    "Imediate Family"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Siblings",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "j5we80e"
            },
            "conditions": [],
            "childConditions": [],
            "children": {
              "jeradMorrissey": {
                "name": "jeradMorrissey",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "qq1af4z"
                },
                "conditions": [
                  {
                    "_TYPE": "ExactCondition",
                    "attribute": "relations",
                    "value": "Siblings",
                    "deligator": {
                      "_TYPE": "NodeCondition"
                    }
                  }
                ],
                "childConditions": [],
                "children": {
                  "relation": {
                    "name": "relation",
                    "payload": {
                      "name": "",
                      "inputArray": [
                        {
                          "_TYPE": "Radio",
                          "ID_ATTRIBUTE": "id",
                          "name": "relations",
                          "label": "Relations",
                          "list": [
                            "Spouse",
                            "Children",
                            "Mother",
                            "Father",
                            "Siblings",
                            "Imediate Family"
                          ],
                          "inline": true,
                          "hidden": false,
                          "optional": false,
                          "value": "Spouse",
                          "targetAttr": "value",
                          "errorMsg": "Error"
                        }
                      ],
                      "PAYLOAD_ID": "0q27kta"
                    },
                    "conditions": [],
                    "childConditions": [],
                    "children": {},
                    "metadata": {}
                  }
                },
                "metadata": {
                  "relatedTo": "relations"
                },
                "relatedTo": "relations"
              }
            },
            "metadata": {}
          }
        },
        "metadata": {
          "relatedTo": "name"
        },
        "relatedTo": "name"
      },
      "jeradMorrissey": {
        "name": "jeradMorrissey",
        "payload": {
          "name": "Jerad Morrissey",
          "inputArray": [],
          "PAYLOAD_ID": "5gro1q2"
        },
        "conditions": [
          {
            "_TYPE": "ExactCondition",
            "attribute": "name",
            "value": "Jerad Morrissey",
            "deligator": {
              "_TYPE": "NodeCondition"
            }
          }
        ],
        "childConditions": [],
        "children": {
          "relation": {
            "name": "relation",
            "payload": {
              "name": "",
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Spouse",
                    "Children",
                    "Mother",
                    "Father",
                    "Siblings",
                    "Imediate Family"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Spouse",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "49kjvxu"
            },
            "conditions": [],
            "childConditions": [],
            "children": {
              "jeradMorrissey": {
                "name": "jeradMorrissey",
                "payload": {
                  "name": "JeradMorrissey",
                  "inputArray": [],
                  "PAYLOAD_ID": "vu0x2wf"
                },
                "conditions": [],
                "childConditions": [],
                "children": {},
                "metadata": {}
              }
            },
            "metadata": {}
          }
        },
        "metadata": {
          "relatedTo": "name"
        },
        "relatedTo": "name"
      }
    },
    "metadata": {}
  },
  "payloadHandler": {
    "inputs": [
      {
        "_TYPE": "Input",
        "ID_ATTRIBUTE": "id",
        "name": "name",
        "label": "Name",
        "optional": true,
        "hidden": false,
        "list": [],
        "value": "",
        "targetAttr": "value",
        "errorMsg": "Error"
      }
    ],
    "templateName": "ancestry"
  }
}
// const treeJson = {
//   "_TYPE": "DecisionInputTree",
//   "id": "DecisionInputTree_97m8e3l",
//   "ID_ATTRIBUTE": "id",
//   "stateConfigs": {
//     "root": {
//       "_TYPE": "StateConfig",
//       "id": "StateConfig_bujrkj0",
//       "ID_ATTRIBUTE": "id",
//       "name": "root",
//       "payload": {
//         "inputArray": [
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "text",
//             "name": "smallText",
//             "label": "Small Text",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Textarea",
//             "ID_ATTRIBUTE": "id",
//             "name": "largeText",
//             "label": "Large Text",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "checkbox",
//             "name": "checkbox",
//             "label": "Checkbox",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": false,
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Radio",
//             "ID_ATTRIBUTE": "id",
//             "name": "radioInline",
//             "label": "Radio Inline",
//             "list": [
//               "in",
//               "a",
//               "line"
//             ],
//             "inline": true,
//             "hidden": false,
//             "optional": false,
//             "value": "in",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Radio",
//             "ID_ATTRIBUTE": "id",
//             "name": "radio",
//             "label": "Radio",
//             "list": [
//               "not",
//               "in",
//               "a",
//               "line"
//             ],
//             "inline": false,
//             "hidden": false,
//             "optional": false,
//             "value": "not",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Select",
//             "ID_ATTRIBUTE": "id",
//             "name": "select",
//             "label": "Select",
//             "list": [
//               "a",
//               "b",
//               "c",
//               "d",
//               "e",
//               "f",
//               "g"
//             ],
//             "hidden": false,
//             "optional": false,
//             "value": "a",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "date",
//             "name": "date",
//             "label": "Date",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "time",
//             "name": "time",
//             "label": "Time",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Table",
//             "ID_ATTRIBUTE": "id",
//             "name": "t",
//             "label": "t",
//             "rows": [
//               "a",
//               "b",
//               "c",
//               "d",
//               "e"
//             ],
//             "columns": [
//               {
//                 "_TYPE": "Radio",
//                 "ID_ATTRIBUTE": "id",
//                 "name": "one",
//                 "label": "one",
//                 "list": [
//                   "1",
//                   "2",
//                   "3",
//                   "4"
//                 ],
//                 "inline": true,
//                 "hidden": false,
//                 "optional": false,
//                 "value": "1",
//                 "targetAttr": "value",
//                 "errorMsg": "Error"
//               },
//               {
//                 "_TYPE": "Input",
//                 "ID_ATTRIBUTE": "id",
//                 "type": "checkbox",
//                 "name": "checkbo",
//                 "label": "checkbo",
//                 "hidden": false,
//                 "list": [],
//                 "optional": false,
//                 "value": false,
//                 "targetAttr": "value",
//                 "errorMsg": "Error"
//               }
//             ],
//             "type": "Text",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "MultipleEntries",
//             "ID_ATTRIBUTE": "id",
//             "list": [],
//             "hidden": false,
//             "optional": false,
//             "value": [],
//             "targetAttr": "value",
//             "errorMsg": "Error",
//             "inputTemplate": {
//               "_TYPE": "InputList",
//               "ID_ATTRIBUTE": "id",
//               "name": "children",
//               "list": [
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "text",
//                   "name": "first",
//                   "label": "First",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 },
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "text",
//                   "name": "middle",
//                   "label": "Middle",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 },
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "date",
//                   "name": "doB",
//                   "label": "DoB",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 }
//               ],
//               "inline": true,
//               "hidden": false,
//               "optional": false,
//               "value": [
//                 "",
//                 "",
//                 ""
//               ],
//               "targetAttr": "value",
//               "errorMsg": "Error"
//             }
//           },
//           {
//             "_TYPE": "MeasurementInput",
//             "ID_ATTRIBUTE": "id",
//             "name": "standard",
//             "label": "standard",
//             "units": "Imperial (US)",
//             "value": null,
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "MeasurementInput",
//             "ID_ATTRIBUTE": "id",
//             "name": "metric",
//             "label": "metric",
//             "units": "Metric",
//             "value": {
//               "0": "N",
//               "1": "a",
//               "2": "N"
//             },
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "text",
//             "name": "weatherFax",
//             "label": "Weather Fax",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           },
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "text",
//             "name": "eWeatherFax",
//             "label": "eWeather Fax",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           }
//         ]
//       }
//     },
//     "hiccups": {
//       "_TYPE": "StateConfig",
//       "id": "StateConfig_bwvdmzz",
//       "ID_ATTRIBUTE": "id",
//       "name": "hiccups",
//       "payload": {
//         "inputArray": [
//           {
//             "_TYPE": "Input",
//             "ID_ATTRIBUTE": "id",
//             "type": "text",
//             "name": "jozsefMorrissey",
//             "label": "Jozsef Morrissey",
//             "hidden": false,
//             "list": [],
//             "optional": false,
//             "value": "",
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           }
//         ]
//       }
//     }
//   },
//   "name": "root",
//   "root": {
//     "name": "root",
//     "payload": {
//       "inputArray": [
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "text",
//           "name": "smallText",
//           "label": "Small Text",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Textarea",
//           "ID_ATTRIBUTE": "id",
//           "name": "largeText",
//           "label": "Large Text",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "checkbox",
//           "name": "checkbox",
//           "label": "Checkbox",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": false,
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Radio",
//           "ID_ATTRIBUTE": "id",
//           "name": "radioInline",
//           "label": "Radio Inline",
//           "list": [
//             "in",
//             "a",
//             "line"
//           ],
//           "inline": true,
//           "hidden": false,
//           "optional": false,
//           "value": "on",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Radio",
//           "ID_ATTRIBUTE": "id",
//           "name": "radio",
//           "label": "Radio",
//           "list": [
//             "not",
//             "in",
//             "a",
//             "line"
//           ],
//           "inline": false,
//           "hidden": false,
//           "optional": false,
//           "value": "on",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Select",
//           "ID_ATTRIBUTE": "id",
//           "name": "select",
//           "label": "Select",
//           "list": [
//             "a",
//             "b",
//             "c",
//             "d",
//             "e",
//             "f",
//             "g"
//           ],
//           "hidden": false,
//           "optional": false,
//           "value": "a",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "date",
//           "name": "date",
//           "label": "Date",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "time",
//           "name": "time",
//           "label": "Time",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Table",
//           "ID_ATTRIBUTE": "id",
//           "name": "t",
//           "label": "t",
//           "rows": [
//             "a",
//             "b",
//             "c",
//             "d",
//             "e"
//           ],
//           "columns": [
//             {
//               "_TYPE": "Radio",
//               "ID_ATTRIBUTE": "id",
//               "name": "one",
//               "label": "one",
//               "list": [
//                 "1",
//                 "2",
//                 "3",
//                 "4"
//               ],
//               "inline": true,
//               "hidden": false,
//               "optional": false,
//               "value": "1",
//               "targetAttr": "value",
//               "errorMsg": "Error"
//             },
//             {
//               "_TYPE": "Input",
//               "ID_ATTRIBUTE": "id",
//               "type": "checkbox",
//               "name": "checkbo",
//               "label": "checkbo",
//               "hidden": false,
//               "list": [],
//               "optional": false,
//               "value": false,
//               "targetAttr": "value",
//               "errorMsg": "Error"
//             }
//           ],
//           "type": "Text",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "MultipleEntries",
//           "ID_ATTRIBUTE": "id",
//           "list": [
//             {
//               "_TYPE": "InputList",
//               "ID_ATTRIBUTE": "id",
//               "name": "children",
//               "list": [
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "text",
//                   "name": "first",
//                   "label": "First",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 },
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "text",
//                   "name": "middle",
//                   "label": "Middle",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 },
//                 {
//                   "_TYPE": "Input",
//                   "ID_ATTRIBUTE": "id",
//                   "type": "date",
//                   "name": "doB",
//                   "label": "DoB",
//                   "inline": true,
//                   "hidden": false,
//                   "list": [],
//                   "optional": false,
//                   "value": "",
//                   "targetAttr": "value",
//                   "errorMsg": "Error"
//                 }
//               ],
//               "inline": true,
//               "hidden": false,
//               "optional": false,
//               "value": [
//                 "",
//                 "",
//                 ""
//               ],
//               "targetAttr": "value",
//               "errorMsg": "Error"
//             }
//           ],
//           "hidden": false,
//           "optional": false,
//           "value": [],
//           "targetAttr": "value",
//           "errorMsg": "Error",
//           "inputTemplate": {
//             "_TYPE": "InputList",
//             "ID_ATTRIBUTE": "id",
//             "name": "children",
//             "list": [
//               {
//                 "_TYPE": "Input",
//                 "ID_ATTRIBUTE": "id",
//                 "type": "text",
//                 "name": "first",
//                 "label": "First",
//                 "inline": true,
//                 "hidden": false,
//                 "list": [],
//                 "optional": false,
//                 "value": "",
//                 "targetAttr": "value",
//                 "errorMsg": "Error"
//               },
//               {
//                 "_TYPE": "Input",
//                 "ID_ATTRIBUTE": "id",
//                 "type": "text",
//                 "name": "middle",
//                 "label": "Middle",
//                 "inline": true,
//                 "hidden": false,
//                 "list": [],
//                 "optional": false,
//                 "value": "",
//                 "targetAttr": "value",
//                 "errorMsg": "Error"
//               },
//               {
//                 "_TYPE": "Input",
//                 "ID_ATTRIBUTE": "id",
//                 "type": "date",
//                 "name": "doB",
//                 "label": "DoB",
//                 "inline": true,
//                 "hidden": false,
//                 "list": [],
//                 "optional": false,
//                 "value": "",
//                 "targetAttr": "value",
//                 "errorMsg": "Error"
//               }
//             ],
//             "inline": true,
//             "hidden": false,
//             "optional": false,
//             "value": [
//               "",
//               "",
//               ""
//             ],
//             "targetAttr": "value",
//             "errorMsg": "Error"
//           }
//         },
//         {
//           "_TYPE": "MeasurementInput",
//           "ID_ATTRIBUTE": "id",
//           "name": "standard",
//           "label": "standard",
//           "units": "Imperial (US)",
//           "value": "0",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "MeasurementInput",
//           "ID_ATTRIBUTE": "id",
//           "name": "metric",
//           "label": "metric",
//           "units": "Metric",
//           "value": {
//             "0": "4",
//             "1": "4",
//             "2": ".",
//             "3": "3"
//           },
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "text",
//           "name": "weatherFax",
//           "label": "Weather Fax",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         },
//         {
//           "_TYPE": "Input",
//           "ID_ATTRIBUTE": "id",
//           "type": "text",
//           "name": "eWeatherFax",
//           "label": "eWeather Fax",
//           "hidden": false,
//           "list": [],
//           "optional": false,
//           "value": "",
//           "targetAttr": "value",
//           "errorMsg": "Error"
//         }
//       ],
//       "PAYLOAD_ID": "mdhqkxo"
//     },
//     "conditions": [],
//     "childConditions": [],
//     "children": {
//       "hiccups": {
//         "name": "hiccups",
//         "payload": {
//           "inputArray": [
//             {
//               "_TYPE": "Input",
//               "ID_ATTRIBUTE": "id",
//               "type": "text",
//               "name": "jozsefMorrissey",
//               "label": "Jozsef Morrissey",
//               "hidden": false,
//               "list": [],
//               "optional": false,
//               "value": "",
//               "targetAttr": "value",
//               "errorMsg": "Error"
//             }
//           ],
//           "PAYLOAD_ID": "22puejf"
//         },
//         "conditions": [
//           {
//             "_TYPE": "EqualCondition",
//             "condition": "metric",
//             "details": 44.3,
//             "attribute": "metric",
//             "value": 44.3,
//             "deligator": {
//               "_TYPE": "NodeCondition"
//             }
//           }
//         ],
//         "childConditions": [],
//         "children": {},
//         "metadata": {
//           "relatedTo": "metric"
//         }
//       }
//     }
//   }
// }

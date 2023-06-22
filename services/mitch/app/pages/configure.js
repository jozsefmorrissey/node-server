
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
  // tree = new DecisionInputTree('Questionaire', {name: 'Questionaire'});
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
  "id": "DecisionInputTree_snxfhjx",
  "ID_ATTRIBUTE": "id",
  "stateConfigs": {
    "Questionaire": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_grxm8qe",
      "ID_ATTRIBUTE": "id",
      "name": "Questionaire",
      "payload": {
        "name": "Questionaire",
        "inputArray": [
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "doTiresVisuallyApearToBeProperlyInflated?",
            "label": "Do Tires visually apear to be properly Inflated?",
            "list": [
              "yes",
              "no"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "yes",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "areThereSignsOfFluidLeakingUnderTheVehical?",
            "label": "Are there signs of fluid leaking under the vehical?",
            "list": [
              "yes",
              "no"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "yes",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "areAllPrimaryAndSecondaryLockingPinsInPlaceForLoaderAndImplement?",
            "label": "Are all primary and secondary locking pins in place for loader and implement?",
            "list": [
              "yes",
              "no"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "yes",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "inspector",
            "label": "Inspector",
            "list": [
              "Zach",
              "Dylan",
              "Adam",
              "Jon",
              "Tucker",
              "Mitchell"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "Zach",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Input",
            "ID_ATTRIBUTE": "id",
            "type": "date",
            "name": "dateOfInspection",
            "label": "Date of Inspection",
            "hidden": false,
            "list": [],
            "optional": false,
            "value": "",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "NumberInput",
            "ID_ATTRIBUTE": "id",
            "name": "engineHours",
            "label": "Engine Hours",
            "min": 0,
            "max": 9007199254740991,
            "step": 1,
            "hidden": false,
            "list": [],
            "optional": false,
            "value": "",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "RadioTable",
            "ID_ATTRIBUTE": "id",
            "name": "checkingFluids",
            "label": "Checking Fluids",
            "rows": [
              "Engine Oil",
              "Hydraulic Oil",
              "Antifreeze"
            ],
            "columns": [
              "All Good",
              "Topped Off",
              "Bulk Add"
            ],
            "type": "radio",
            "hidden": false,
            "list": {
              "engineOil": {
                "name": "engineOil",
                "label": "Engine Oil",
                "value": "All Good"
              },
              "hydraulicOil": {
                "name": "hydraulicOil",
                "label": "Hydraulic Oil",
                "value": "All Good"
              },
              "antifreeze": {
                "name": "antifreeze",
                "label": "Antifreeze",
                "value": "All Good"
              }
            },
            "optional": false,
            "value": {
              "engineOil": "All Good",
              "hydraulicOil": "All Good",
              "antifreeze": "All Good"
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "RadioTable",
            "ID_ATTRIBUTE": "id",
            "name": "greesing",
            "label": "Greesing",
            "rows": [
              "Grease Zerk #1",
              "Grease Zerk #2",
              "Grease Zerk #3",
              "Grease Zerk #4",
              "Grease Zerk #5",
              "Grease Zerk #6",
              "Grease Zerk #7"
            ],
            "columns": [
              "Took Atleast 1 Pump",
              "Would Not Accept Grease"
            ],
            "type": "radio",
            "hidden": false,
            "list": {
              "greaseZerk #1": {
                "name": "greaseZerk #1",
                "label": "Grease Zerk #1",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #2": {
                "name": "greaseZerk #2",
                "label": "Grease Zerk #2",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #3": {
                "name": "greaseZerk #3",
                "label": "Grease Zerk #3",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #4": {
                "name": "greaseZerk #4",
                "label": "Grease Zerk #4",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #5": {
                "name": "greaseZerk #5",
                "label": "Grease Zerk #5",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #6": {
                "name": "greaseZerk #6",
                "label": "Grease Zerk #6",
                "value": "Took Atleast 1 Pump"
              },
              "greaseZerk #7": {
                "name": "greaseZerk #7",
                "label": "Grease Zerk #7",
                "value": "Took Atleast 1 Pump"
              }
            },
            "optional": false,
            "value": {
              "greaseZerk #1": "Took Atleast 1 Pump",
              "greaseZerk #2": "Took Atleast 1 Pump",
              "greaseZerk #3": "Took Atleast 1 Pump",
              "greaseZerk #4": "Took Atleast 1 Pump",
              "greaseZerk #5": "Took Atleast 1 Pump",
              "greaseZerk #6": "Took Atleast 1 Pump",
              "greaseZerk #7": "Took Atleast 1 Pump"
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "RadioTable",
            "ID_ATTRIBUTE": "id",
            "name": "hydraulicHoseAndFittingInspection",
            "label": "Hydraulic Hose and Fitting Inspection",
            "rows": [
              "Pump to Control Valve",
              "Control Valve to Arm Cylinders",
              "Control Valve To Bucket Cylinders"
            ],
            "columns": [
              "Dry",
              "Wet"
            ],
            "type": "radio",
            "hidden": false,
            "list": {
              "pumpToControlValve": {
                "name": "pumpToControlValve",
                "label": "Pump to Control Valve",
                "value": "Dry"
              },
              "controlValveToArmCylinders": {
                "name": "controlValveToArmCylinders",
                "label": "Control Valve to Arm Cylinders",
                "value": "Dry"
              },
              "controlValveToBucketCylinders": {
                "name": "controlValveToBucketCylinders",
                "label": "Control Valve To Bucket Cylinders",
                "value": "Dry"
              }
            },
            "optional": false,
            "value": {
              "pumpToControlValve": "Dry",
              "controlValveToArmCylinders": "Dry",
              "controlValveToBucketCylinders": "Dry"
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "RadioTable",
            "ID_ATTRIBUTE": "id",
            "name": "startingAndOperating",
            "label": "Starting and Operating",
            "rows": [
              "Parking Brake",
              "Ignitian and Key",
              "Throttle Control",
              "3-point Control",
              "Loader Controls"
            ],
            "columns": [
              "Works",
              "Kinda Works",
              "Not Fuunctioning"
            ],
            "type": "radio",
            "hidden": false,
            "list": {
              "parkingBrake": {
                "name": "parkingBrake",
                "label": "Parking Brake",
                "value": "Works"
              },
              "ignitianAndKey": {
                "name": "ignitianAndKey",
                "label": "Ignitian and Key",
                "value": "Works"
              },
              "throttleControl": {
                "name": "throttleControl",
                "label": "Throttle Control",
                "value": "Works"
              },
              "3-pointControl": {
                "name": "3-pointControl",
                "label": "3-point Control",
                "value": "Works"
              },
              "loaderControls": {
                "name": "loaderControls",
                "label": "Loader Controls",
                "value": "Works"
              }
            },
            "optional": false,
            "value": {
              "parkingBrake": "Works",
              "ignitianAndKey": "Works",
              "throttleControl": "Works",
              "3-pointControl": "Works",
              "loaderControls": "Works"
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "RadioTable",
            "ID_ATTRIBUTE": "id",
            "name": "shifftingTransmissionAndTransferCase",
            "label": "Shiffting Transmission and Transfer Case",
            "rows": [
              "Transmission shifts with no issues",
              "Transfer Case shifts with no issues"
            ],
            "columns": [
              "Yes",
              "No"
            ],
            "type": "radio",
            "hidden": false,
            "list": {
              "transmissionShiftsWithNoIssues": {
                "name": "transmissionShiftsWithNoIssues",
                "label": "Transmission shifts with no issues",
                "value": "Yes"
              },
              "transferCaseShiftsWithNoIssues": {
                "name": "transferCaseShiftsWithNoIssues",
                "label": "Transfer Case shifts with no issues",
                "value": "Yes"
              }
            },
            "optional": false,
            "value": {
              "transmissionShiftsWithNoIssues": "Yes",
              "transferCaseShiftsWithNoIssues": "Yes"
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Textarea",
            "ID_ATTRIBUTE": "id",
            "name": "goodPllaceToTalkOorDropAreminder",
            "label": "Good Pllace to Talk oor Drop a Reminder",
            "hidden": false,
            "list": [],
            "optional": false,
            "value": "",
            "targetAttr": "value",
            "errorMsg": "Error"
          },
          {
            "_TYPE": "Textarea",
            "ID_ATTRIBUTE": "id",
            "name": "anythingWrongWithTheTractorThatNeedsFixed?",
            "label": "Anything wrong with the tractor that needs fixed?",
            "hidden": false,
            "list": [],
            "optional": false,
            "value": "",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ]
      },
      "treeName": "DecisionInputTree",
      "conditions": [
        {
          "_TYPE": "WildCardCondition",
          "group": "pr4vj5a",
          "attribute": "greesing.*",
          "value": "Would Not Accept Grease",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        }
      ]
    },
    "pr4vj5a": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_wmmd46r",
      "ID_ATTRIBUTE": "id",
      "name": "pr4vj5a",
      "payload": {
        "inputArray": [
          {
            "_TYPE": "Table",
            "ID_ATTRIBUTE": "id",
            "name": "kitchenSinkTable",
            "label": "kitchenSinkTable",
            "rows": [
              "one",
              "two",
              "three"
            ],
            "columns": [
              {
                "_TYPE": "Input",
                "ID_ATTRIBUTE": "id",
                "type": "text",
                "name": "text",
                "label": "text",
                "hidden": false,
                "list": [],
                "optional": false,
                "value": "",
                "targetAttr": "value",
                "errorMsg": "Error"
              },
              {
                "_TYPE": "Input",
                "ID_ATTRIBUTE": "id",
                "type": "checkbox",
                "name": "checkbox",
                "label": "checkbox",
                "hidden": false,
                "list": [],
                "optional": false,
                "value": false,
                "targetAttr": "value",
                "errorMsg": "Error"
              },
              {
                "_TYPE": "NumberInput",
                "ID_ATTRIBUTE": "id",
                "name": "table-Table_input-pb9o7ly-2-2",
                "label": "Value",
                "min": 0,
                "max": 9007199254740991,
                "step": 0.01,
                "hidden": false,
                "list": [],
                "optional": false,
                "value": "",
                "targetAttr": "value",
                "errorMsg": "Error"
              },
              {
                "_TYPE": "Radio",
                "ID_ATTRIBUTE": "id",
                "name": "radio",
                "label": "radio",
                "list": [
                  "one",
                  "two",
                  "three"
                ],
                "inline": true,
                "hidden": false,
                "optional": false,
                "value": "one",
                "targetAttr": "value",
                "errorMsg": "Error"
              },
              {
                "_TYPE": "Input",
                "ID_ATTRIBUTE": "id",
                "type": "date",
                "name": "date",
                "label": "date",
                "hidden": false,
                "list": [],
                "optional": false,
                "value": "",
                "targetAttr": "value",
                "errorMsg": "Error"
              },
              {
                "_TYPE": "MultipleEntries",
                "ID_ATTRIBUTE": "id",
                "list": [],
                "hidden": false,
                "optional": false,
                "value": [],
                "label": "Multi",
                "targetAttr": "value",
                "errorMsg": "Error",
                "inputTemplate": {
                  "_TYPE": "InputList",
                  "ID_ATTRIBUTE": "id",
                  "name": "me",
                  "list": [
                    {
                      "_TYPE": "Input",
                      "ID_ATTRIBUTE": "id",
                      "type": "text",
                      "name": "first",
                      "label": "first",
                      "inline": true,
                      "hidden": false,
                      "list": [],
                      "optional": false,
                      "value": "",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    },
                    {
                      "_TYPE": "Input",
                      "ID_ATTRIBUTE": "id",
                      "type": "text",
                      "name": "last",
                      "label": "last",
                      "inline": true,
                      "hidden": false,
                      "list": [],
                      "optional": false,
                      "value": "",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": [],
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              },
              {
                "_TYPE": "Table",
                "ID_ATTRIBUTE": "id",
                "name": "nestedTable",
                "label": "nestedTable",
                "rows": [
                  "y0",
                  "y1"
                ],
                "columns": [
                  "x0",
                  "x1"
                ],
                "type": "Text",
                "hidden": false,
                "list": [],
                "optional": false,
                "value": {
                  "y0": {
                    "x0": "",
                    "x1": ""
                  },
                  "y1": {
                    "x0": "",
                    "x1": ""
                  }
                },
                "targetAttr": "value",
                "errorMsg": "Error"
              }
            ],
            "type": "column specific",
            "hidden": false,
            "list": [],
            "optional": false,
            "value": {
              "one": {
                "text": "",
                "checkbox": false,
                "": "",
                "radio": "one",
                "date": "",
                "undefined": [],
                "nestedTable": {
                  "y0": {
                    "x0": "",
                    "x1": ""
                  },
                  "y1": {
                    "x0": "",
                    "x1": ""
                  }
                }
              },
              "two": {
                "text": "",
                "checkbox": false,
                "": "",
                "radio": "one",
                "date": "",
                "undefined": [],
                "nestedTable": {
                  "y0": {
                    "x0": "",
                    "x1": ""
                  },
                  "y1": {
                    "x0": "",
                    "x1": ""
                  }
                }
              },
              "three": {
                "text": "",
                "checkbox": false,
                "": "",
                "radio": "one",
                "date": "",
                "undefined": [],
                "nestedTable": {
                  "y0": {
                    "x0": "",
                    "x1": ""
                  },
                  "y1": {
                    "x0": "",
                    "x1": ""
                  }
                }
              }
            },
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ]
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    }
  },
  "name": "Questionaire",
  "referenceNodes": false,
  "root": {
    "name": "Questionaire",
    "payload": {
      "inputArray": [
        {
          "_TYPE": "Radio",
          "ID_ATTRIBUTE": "id",
          "name": "doTiresVisuallyApearToBeProperlyInflated?",
          "label": "Do Tires visually apear to be properly Inflated?",
          "list": [
            "yes",
            "no"
          ],
          "inline": true,
          "hidden": false,
          "optional": false,
          "value": "yes",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Radio",
          "ID_ATTRIBUTE": "id",
          "name": "areThereSignsOfFluidLeakingUnderTheVehical?",
          "label": "Are there signs of fluid leaking under the vehical?",
          "list": [
            "yes",
            "no"
          ],
          "inline": true,
          "hidden": false,
          "optional": false,
          "value": "yes",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Radio",
          "ID_ATTRIBUTE": "id",
          "name": "areAllPrimaryAndSecondaryLockingPinsInPlaceForLoaderAndImplement?",
          "label": "Are all primary and secondary locking pins in place for loader and implement?",
          "list": [
            "yes",
            "no"
          ],
          "inline": true,
          "hidden": false,
          "optional": false,
          "value": "yes",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Radio",
          "ID_ATTRIBUTE": "id",
          "name": "inspector",
          "label": "Inspector",
          "list": [
            "Zach",
            "Dylan",
            "Adam",
            "Jon",
            "Tucker",
            "Mitchell"
          ],
          "inline": true,
          "hidden": false,
          "optional": false,
          "value": "Zach",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Input",
          "ID_ATTRIBUTE": "id",
          "type": "date",
          "name": "dateOfInspection",
          "label": "Date of Inspection",
          "hidden": false,
          "list": [],
          "optional": false,
          "value": "",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "NumberInput",
          "ID_ATTRIBUTE": "id",
          "name": "engineHours",
          "label": "Engine Hours",
          "min": 0,
          "max": 9007199254740991,
          "step": 1,
          "hidden": false,
          "list": [],
          "optional": false,
          "value": "",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "RadioTable",
          "ID_ATTRIBUTE": "id",
          "name": "checkingFluids",
          "label": "Checking Fluids",
          "rows": [
            "Engine Oil",
            "Hydraulic Oil",
            "Antifreeze"
          ],
          "columns": [
            "All Good",
            "Topped Off",
            "Bulk Add"
          ],
          "type": "radio",
          "hidden": false,
          "list": {
            "engineOil": {
              "name": "engineOil",
              "label": "Engine Oil",
              "value": "All Good"
            },
            "hydraulicOil": {
              "name": "hydraulicOil",
              "label": "Hydraulic Oil",
              "value": "All Good"
            },
            "antifreeze": {
              "name": "antifreeze",
              "label": "Antifreeze",
              "value": "All Good"
            }
          },
          "optional": false,
          "value": {
            "engineOil": "All Good",
            "hydraulicOil": "All Good",
            "antifreeze": "All Good"
          },
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "RadioTable",
          "ID_ATTRIBUTE": "id",
          "name": "greesing",
          "label": "Greesing",
          "rows": [
            "Grease Zerk #1",
            "Grease Zerk #2",
            "Grease Zerk #3",
            "Grease Zerk #4",
            "Grease Zerk #5",
            "Grease Zerk #6",
            "Grease Zerk #7"
          ],
          "columns": [
            "Took Atleast 1 Pump",
            "Would Not Accept Grease"
          ],
          "type": "radio",
          "hidden": false,
          "list": {
            "greaseZerk #1": {
              "name": "greaseZerk #1",
              "label": "Grease Zerk #1",
              "value": "Took Atleast 1 Pump"
            },
            "greaseZerk #2": {
              "name": "greaseZerk #2",
              "label": "Grease Zerk #2",
              "value": "Would Not Accept Grease"
            },
            "greaseZerk #3": {
              "name": "greaseZerk #3",
              "label": "Grease Zerk #3",
              "value": "Took Atleast 1 Pump"
            },
            "greaseZerk #4": {
              "name": "greaseZerk #4",
              "label": "Grease Zerk #4",
              "value": "Took Atleast 1 Pump"
            },
            "greaseZerk #5": {
              "name": "greaseZerk #5",
              "label": "Grease Zerk #5",
              "value": "Took Atleast 1 Pump"
            },
            "greaseZerk #6": {
              "name": "greaseZerk #6",
              "label": "Grease Zerk #6",
              "value": "Took Atleast 1 Pump"
            },
            "greaseZerk #7": {
              "name": "greaseZerk #7",
              "label": "Grease Zerk #7",
              "value": "Took Atleast 1 Pump"
            }
          },
          "optional": false,
          "value": {
            "greaseZerk #1": "Took Atleast 1 Pump",
            "greaseZerk #2": "Would Not Accept Grease",
            "greaseZerk #3": "Took Atleast 1 Pump",
            "greaseZerk #4": "Took Atleast 1 Pump",
            "greaseZerk #5": "Took Atleast 1 Pump",
            "greaseZerk #6": "Took Atleast 1 Pump",
            "greaseZerk #7": "Took Atleast 1 Pump"
          },
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "RadioTable",
          "ID_ATTRIBUTE": "id",
          "name": "hydraulicHoseAndFittingInspection",
          "label": "Hydraulic Hose and Fitting Inspection",
          "rows": [
            "Pump to Control Valve",
            "Control Valve to Arm Cylinders",
            "Control Valve To Bucket Cylinders"
          ],
          "columns": [
            "Dry",
            "Wet"
          ],
          "type": "radio",
          "hidden": false,
          "list": {
            "pumpToControlValve": {
              "name": "pumpToControlValve",
              "label": "Pump to Control Valve",
              "value": "Dry"
            },
            "controlValveToArmCylinders": {
              "name": "controlValveToArmCylinders",
              "label": "Control Valve to Arm Cylinders",
              "value": "Dry"
            },
            "controlValveToBucketCylinders": {
              "name": "controlValveToBucketCylinders",
              "label": "Control Valve To Bucket Cylinders",
              "value": "Dry"
            }
          },
          "optional": false,
          "value": {
            "pumpToControlValve": "Dry",
            "controlValveToArmCylinders": "Dry",
            "controlValveToBucketCylinders": "Dry"
          },
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "RadioTable",
          "ID_ATTRIBUTE": "id",
          "name": "startingAndOperating",
          "label": "Starting and Operating",
          "rows": [
            "Parking Brake",
            "Ignitian and Key",
            "Throttle Control",
            "3-point Control",
            "Loader Controls"
          ],
          "columns": [
            "Works",
            "Kinda Works",
            "Not Fuunctioning"
          ],
          "type": "radio",
          "hidden": false,
          "list": {
            "parkingBrake": {
              "name": "parkingBrake",
              "label": "Parking Brake",
              "value": "Works"
            },
            "ignitianAndKey": {
              "name": "ignitianAndKey",
              "label": "Ignitian and Key",
              "value": "Works"
            },
            "throttleControl": {
              "name": "throttleControl",
              "label": "Throttle Control",
              "value": "Works"
            },
            "3-pointControl": {
              "name": "3-pointControl",
              "label": "3-point Control",
              "value": "Works"
            },
            "loaderControls": {
              "name": "loaderControls",
              "label": "Loader Controls",
              "value": "Works"
            }
          },
          "optional": false,
          "value": {
            "parkingBrake": "Works",
            "ignitianAndKey": "Works",
            "throttleControl": "Works",
            "3-pointControl": "Works",
            "loaderControls": "Works"
          },
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "RadioTable",
          "ID_ATTRIBUTE": "id",
          "name": "shifftingTransmissionAndTransferCase",
          "label": "Shiffting Transmission and Transfer Case",
          "rows": [
            "Transmission shifts with no issues",
            "Transfer Case shifts with no issues"
          ],
          "columns": [
            "Yes",
            "No"
          ],
          "type": "radio",
          "hidden": false,
          "list": {
            "transmissionShiftsWithNoIssues": {
              "name": "transmissionShiftsWithNoIssues",
              "label": "Transmission shifts with no issues",
              "value": "Yes"
            },
            "transferCaseShiftsWithNoIssues": {
              "name": "transferCaseShiftsWithNoIssues",
              "label": "Transfer Case shifts with no issues",
              "value": "Yes"
            }
          },
          "optional": false,
          "value": {
            "transmissionShiftsWithNoIssues": "Yes",
            "transferCaseShiftsWithNoIssues": "Yes"
          },
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Textarea",
          "ID_ATTRIBUTE": "id",
          "name": "goodPllaceToTalkOorDropAreminder",
          "label": "Good Pllace to Talk oor Drop a Reminder",
          "hidden": false,
          "list": [],
          "optional": false,
          "value": "",
          "targetAttr": "value",
          "errorMsg": "Error"
        },
        {
          "_TYPE": "Textarea",
          "ID_ATTRIBUTE": "id",
          "name": "anythingWrongWithTheTractorThatNeedsFixed?",
          "label": "Anything wrong with the tractor that needs fixed?",
          "hidden": false,
          "list": [],
          "optional": false,
          "value": "",
          "targetAttr": "value",
          "errorMsg": "Error"
        }
      ],
      "PAYLOAD_ID": "jr0cjes"
    },
    "children": {
      "pr4vj5a": {
        "name": "pr4vj5a",
        "payload": {
          "inputArray": [
            {
              "_TYPE": "Table",
              "ID_ATTRIBUTE": "id",
              "name": "kitchenSinkTable",
              "label": "kitchenSinkTable",
              "rows": [
                "one",
                "two",
                "three"
              ],
              "columns": [
                {
                  "_TYPE": "Input",
                  "ID_ATTRIBUTE": "id",
                  "type": "text",
                  "name": "text",
                  "label": "text",
                  "hidden": false,
                  "list": [],
                  "optional": false,
                  "value": "",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                },
                {
                  "_TYPE": "Input",
                  "ID_ATTRIBUTE": "id",
                  "type": "checkbox",
                  "name": "checkbox",
                  "label": "checkbox",
                  "hidden": false,
                  "list": [],
                  "optional": false,
                  "value": false,
                  "targetAttr": "value",
                  "errorMsg": "Error"
                },
                {
                  "_TYPE": "NumberInput",
                  "ID_ATTRIBUTE": "id",
                  "name": "table-Table_input-trjzlvh-2-2",
                  "label": "Value",
                  "min": 0,
                  "max": 9007199254740991,
                  "step": 0.01,
                  "hidden": false,
                  "list": [],
                  "optional": false,
                  "value": "",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                },
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "radio",
                  "label": "radio",
                  "list": [
                    "one",
                    "two",
                    "three"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "one",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                },
                {
                  "_TYPE": "Input",
                  "ID_ATTRIBUTE": "id",
                  "type": "date",
                  "name": "date",
                  "label": "date",
                  "hidden": false,
                  "list": [],
                  "optional": false,
                  "value": "",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                },
                {
                  "_TYPE": "MultipleEntries",
                  "ID_ATTRIBUTE": "id",
                  "list": [],
                  "hidden": false,
                  "optional": false,
                  "value": [],
                  "label": "Multi",
                  "targetAttr": "value",
                  "errorMsg": "Error",
                  "inputTemplate": {
                    "_TYPE": "InputList",
                    "ID_ATTRIBUTE": "id",
                    "name": "me",
                    "list": [
                      {
                        "_TYPE": "Input",
                        "ID_ATTRIBUTE": "id",
                        "type": "text",
                        "name": "first",
                        "label": "first",
                        "inline": true,
                        "hidden": false,
                        "list": [],
                        "optional": false,
                        "value": "",
                        "targetAttr": "value",
                        "errorMsg": "Error"
                      },
                      {
                        "_TYPE": "Input",
                        "ID_ATTRIBUTE": "id",
                        "type": "text",
                        "name": "last",
                        "label": "last",
                        "inline": true,
                        "hidden": false,
                        "list": [],
                        "optional": false,
                        "value": "",
                        "targetAttr": "value",
                        "errorMsg": "Error"
                      }
                    ],
                    "inline": true,
                    "hidden": false,
                    "optional": false,
                    "value": [],
                    "targetAttr": "value",
                    "errorMsg": "Error"
                  }
                },
                {
                  "_TYPE": "Table",
                  "ID_ATTRIBUTE": "id",
                  "name": "nestedTable",
                  "label": "nestedTable",
                  "rows": [
                    "y0",
                    "y1"
                  ],
                  "columns": [
                    "x0",
                    "x1"
                  ],
                  "type": "Text",
                  "hidden": false,
                  "list": [],
                  "optional": false,
                  "value": {
                    "y0": {
                      "x0": "",
                      "x1": ""
                    },
                    "y1": {
                      "x0": "",
                      "x1": ""
                    }
                  },
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "type": "column specific",
              "hidden": false,
              "list": [],
              "optional": false,
              "value": {
                "one": {
                  "text": "",
                  "checkbox": false,
                  "": "",
                  "radio": "one",
                  "date": "",
                  "undefined": [],
                  "nestedTable": {
                    "y0": {
                      "x0": "",
                      "x1": ""
                    },
                    "y1": {
                      "x0": "",
                      "x1": ""
                    }
                  }
                },
                "two": {
                  "text": "",
                  "checkbox": false,
                  "": "",
                  "radio": "one",
                  "date": "",
                  "undefined": [],
                  "nestedTable": {
                    "y0": {
                      "x0": "",
                      "x1": ""
                    },
                    "y1": {
                      "x0": "",
                      "x1": ""
                    }
                  }
                },
                "three": {
                  "text": "",
                  "checkbox": false,
                  "": "",
                  "radio": "one",
                  "date": "",
                  "undefined": [],
                  "nestedTable": {
                    "y0": {
                      "x0": "",
                      "x1": ""
                    },
                    "y1": {
                      "x0": "",
                      "x1": ""
                    }
                  }
                }
              },
              "targetAttr": "value",
              "errorMsg": "Error"
            }
          ],
          "PAYLOAD_ID": "9g0m6st"
        },
        "children": {},
        "metadata": {}
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
};
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


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
  "id": "DecisionInputTree_37c3emb",
  "ID_ATTRIBUTE": "id",
  "stateConfigs": {
    "ancestry": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_uy134wd",
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
      },
      "treeName": "DecisionInputTree",
      "conditions": [
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jozsefMorrissey",
          "attribute": "name",
          "value": "Jozsef Morrissey",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jeradMorrissey",
          "attribute": "name",
          "value": "Jerad Morrissey",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "deadraGreen",
          "attribute": "name",
          "value": "Deadra Green",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "seabrinGreen",
          "attribute": "name",
          "value": "Seabrin Green",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "ilishaGreen",
          "attribute": "name",
          "value": "Ilisha Green",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "mandyMorrissey",
          "attribute": "name",
          "value": "Mandy Morrissey",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "evanWaldop",
          "attribute": "name",
          "value": "Evan Waldop",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "bryleeBaker",
          "attribute": "name",
          "value": "Brylee Baker",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "debraMorrissey",
          "attribute": "name",
          "value": "Debra Morrissey",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "tonyMorrissey",
          "attribute": "name",
          "value": "Tony Morrissey",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        }
      ]
    },
    "jozsefMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_zo1ogdx",
      "ID_ATTRIBUTE": "id",
      "name": "jozsefMorrissey",
      "payload": {
        "name": "Jozsef Morrissey",
        "inputArray": [
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "relations",
            "label": "Relations",
            "list": [
              "Brother",
              "Sister",
              "Mother",
              "Father"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "Brother",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": [
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jeradMorrissey",
          "attribute": "relations",
          "value": "Brother",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "deadraGreen",
          "attribute": "relations",
          "value": "Sister",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "debraMorrissey",
          "attribute": "relations",
          "value": "Mother",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "tonyMorrissey",
          "attribute": "relations",
          "value": "Father",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        }
      ]
    },
    "jeradMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_f2e9zhg",
      "ID_ATTRIBUTE": "id",
      "name": "jeradMorrissey",
      "payload": {
        "name": "Jerad Morrissey",
        "inputArray": [
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "relations",
            "label": "Relations",
            "list": [
              "Wife",
              "Son",
              "Daugter",
              "Brother",
              "Sister",
              "Mother",
              "Father"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "Wife",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": [
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jozsefMorrissey",
          "attribute": "relations",
          "value": "Brother",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "mandyMorrissey",
          "attribute": "relations",
          "value": "Wife",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "evanWaldop",
          "attribute": "relations",
          "value": "Son",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "bryleeBaker",
          "attribute": "relations",
          "value": "Daugter",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "deadraGreen",
          "attribute": "relations",
          "value": "Sister",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "debraMorrissey",
          "attribute": "relations",
          "value": "Mother",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        }
      ]
    },
    "deadraGreen": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_u9gkod7",
      "ID_ATTRIBUTE": "id",
      "name": "deadraGreen",
      "payload": {
        "name": "Deadra Green",
        "inputArray": [
          {
            "_TYPE": "Radio",
            "ID_ATTRIBUTE": "id",
            "name": "relation",
            "label": "Relation",
            "list": [
              "Husband",
              "Son",
              "Brothers",
              "Mother"
            ],
            "inline": true,
            "hidden": false,
            "optional": false,
            "value": "Husband",
            "targetAttr": "value",
            "errorMsg": "Error"
          }
        ],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": [
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "seabrinGreen",
          "attribute": "relation",
          "value": "Husband",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "ilishaGreen",
          "attribute": "relation",
          "value": "Son",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jeradMorrissey",
          "attribute": "relation",
          "value": "Brothers",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "jozsefMorrissey",
          "attribute": "relation",
          "value": "Brothers",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        },
        {
          "_TYPE": "CaseInsensitiveCondition",
          "group": "debraMorrissey",
          "attribute": "relation",
          "value": "Mother",
          "deligator": {
            "_TYPE": "NodeCondition"
          }
        }
      ]
    },
    "seabrinGreen": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_npfe42h",
      "ID_ATTRIBUTE": "id",
      "name": "seabrinGreen",
      "payload": {
        "name": "Seabrin Green",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "ilishaGreen": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_pjtionk",
      "ID_ATTRIBUTE": "id",
      "name": "ilishaGreen",
      "payload": {
        "name": "Ilisha Green",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "mandyMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_3mijdq2",
      "ID_ATTRIBUTE": "id",
      "name": "mandyMorrissey",
      "payload": {
        "name": "Mandy Morrissey",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "evanWaldop": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_swtbv4w",
      "ID_ATTRIBUTE": "id",
      "name": "evanWaldop",
      "payload": {
        "name": "Evan Waldop",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "bryleeBaker": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_kg6cxzy",
      "ID_ATTRIBUTE": "id",
      "name": "bryleeBaker",
      "payload": {
        "name": "Brylee Baker",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "debraMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_6cwfa29",
      "ID_ATTRIBUTE": "id",
      "name": "debraMorrissey",
      "payload": {
        "name": "Debra Morrissey",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
    },
    "tonyMorrissey": {
      "_TYPE": "StateConfig",
      "id": "StateConfig_6mv49q0",
      "ID_ATTRIBUTE": "id",
      "name": "tonyMorrissey",
      "payload": {
        "name": "Tony Morrissey",
        "inputArray": [],
        "relatedTo": "name"
      },
      "treeName": "DecisionInputTree",
      "conditions": []
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
      "PAYLOAD_ID": "xzjrihy"
    },
    "children": {
      "jozsefMorrissey": {
        "name": "jozsefMorrissey",
        "payload": {
          "inputArray": [
            {
              "_TYPE": "Radio",
              "ID_ATTRIBUTE": "id",
              "name": "relations",
              "label": "Relations",
              "list": [
                "Brother",
                "Sister",
                "Mother",
                "Father"
              ],
              "inline": true,
              "hidden": false,
              "optional": false,
              "value": "Sister",
              "targetAttr": "value",
              "errorMsg": "Error"
            }
          ],
          "PAYLOAD_ID": "v53j8uv"
        },
        "children": {
          "jeradMorrissey": {
            "name": "jeradMorrissey",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Wife",
                    "Son",
                    "Daugter",
                    "Brother",
                    "Sister",
                    "Mother",
                    "Father"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Brother",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "d3f9dgi",
              "relatedTo": "relations"
            },
            "children": {
              "jozsefMorrissey": {
                "name": "jozsefMorrissey",
                "payload": {
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Brother",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "PAYLOAD_ID": "n5cuvns",
                  "relatedTo": "relations"
                },
                "children": {
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "name": "Debra Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "bddz0te"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "tonyMorrissey": {
                    "name": "tonyMorrissey",
                    "payload": {
                      "name": "Tony Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "nqtqzcj"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  }
                },
                "metadata": {},
                "relatedTo": "relations"
              },
              "mandyMorrissey": {
                "name": "mandyMorrissey",
                "payload": {
                  "name": "Mandy Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "bv53kxi"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "evanWaldop": {
                "name": "evanWaldop",
                "payload": {
                  "name": "Evan Waldop",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "daw1wkm"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "bryleeBaker": {
                "name": "bryleeBaker",
                "payload": {
                  "name": "Brylee Baker",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "t8rrr9v"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "deadraGreen": {
                "name": "deadraGreen",
                "payload": {
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relation",
                      "label": "Relation",
                      "list": [
                        "Husband",
                        "Son",
                        "Brothers",
                        "Mother"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Brothers",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "PAYLOAD_ID": "3v0460o",
                  "relatedTo": "relations"
                },
                "children": {
                  "seabrinGreen": {
                    "name": "seabrinGreen",
                    "payload": {
                      "name": "Seabrin Green",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "4lx20j1"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "ilishaGreen": {
                    "name": "ilishaGreen",
                    "payload": {
                      "name": "Ilisha Green",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "t1x4fub"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "name": "Debra Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "5obzx4q"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  }
                },
                "metadata": {},
                "relatedTo": "relations"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "name": "Debra Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "sefaomm"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              }
            },
            "metadata": {},
            "relatedTo": "relations"
          },
          "deadraGreen": {
            "name": "deadraGreen",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relation",
                  "label": "Relation",
                  "list": [
                    "Husband",
                    "Son",
                    "Brothers",
                    "Mother"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Brothers",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "c3kxiwb",
              "relatedTo": "relations"
            },
            "children": {
              "seabrinGreen": {
                "name": "seabrinGreen",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "e3glkaw",
                  "relatedTo": "relation"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relation"
              },
              "ilishaGreen": {
                "name": "ilishaGreen",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "y6qixpo",
                  "relatedTo": "relation"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relation"
              },
              "jeradMorrissey": {
                "name": "jeradMorrissey",
                "payload": {
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Wife",
                        "Son",
                        "Daugter",
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Sister",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "PAYLOAD_ID": "u6rapip",
                  "relatedTo": "relation"
                },
                "children": {
                  "jozsefMorrissey": {
                    "name": "jozsefMorrissey",
                    "payload": {
                      "name": "Jozsef Morrissey",
                      "inputArray": [
                        {
                          "_TYPE": "Radio",
                          "ID_ATTRIBUTE": "id",
                          "name": "relations",
                          "label": "Relations",
                          "list": [
                            "Brother",
                            "Sister",
                            "Mother",
                            "Father"
                          ],
                          "inline": true,
                          "hidden": false,
                          "optional": false,
                          "value": "Brother",
                          "targetAttr": "value",
                          "errorMsg": "Error"
                        }
                      ],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "9jyk58j"
                    },
                    "children": {
                      "debraMorrissey": {
                        "name": "debraMorrissey",
                        "payload": {
                          "name": "Debra Morrissey",
                          "inputArray": [],
                          "relatedTo": "name",
                          "PAYLOAD_ID": "1vtuvwa"
                        },
                        "children": {},
                        "metadata": {},
                        "relatedTo": "name"
                      },
                      "tonyMorrissey": {
                        "name": "tonyMorrissey",
                        "payload": {
                          "name": "Tony Morrissey",
                          "inputArray": [],
                          "relatedTo": "name",
                          "PAYLOAD_ID": "pl3eylf"
                        },
                        "children": {},
                        "metadata": {},
                        "relatedTo": "name"
                      }
                    },
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "mandyMorrissey": {
                    "name": "mandyMorrissey",
                    "payload": {
                      "inputArray": [],
                      "PAYLOAD_ID": "0dwpdkf",
                      "relatedTo": "relations"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "relations"
                  },
                  "evanWaldop": {
                    "name": "evanWaldop",
                    "payload": {
                      "inputArray": [],
                      "PAYLOAD_ID": "fdxhk08",
                      "relatedTo": "relations"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "relations"
                  },
                  "bryleeBaker": {
                    "name": "bryleeBaker",
                    "payload": {
                      "inputArray": [],
                      "PAYLOAD_ID": "4mjr1s9",
                      "relatedTo": "relations"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "relations"
                  },
                  "deadraGreen": {
                    "name": "deadraGreen",
                    "payload": {
                      "inputArray": [
                        {
                          "_TYPE": "Radio",
                          "ID_ATTRIBUTE": "id",
                          "name": "relation",
                          "label": "Relation",
                          "list": [
                            "Husband",
                            "Son",
                            "Brothers",
                            "Mother"
                          ],
                          "inline": true,
                          "hidden": false,
                          "optional": false,
                          "value": "Brothers",
                          "targetAttr": "value",
                          "errorMsg": "Error"
                        }
                      ],
                      "PAYLOAD_ID": "3v0460o",
                      "relatedTo": "relations"
                    },
                    "children": {
                      "seabrinGreen": {
                        "name": "seabrinGreen",
                        "payload": {
                          "name": "Seabrin Green",
                          "inputArray": [],
                          "relatedTo": "name",
                          "PAYLOAD_ID": "4lx20j1"
                        },
                        "children": {},
                        "metadata": {},
                        "relatedTo": "name"
                      },
                      "ilishaGreen": {
                        "name": "ilishaGreen",
                        "payload": {
                          "name": "Ilisha Green",
                          "inputArray": [],
                          "relatedTo": "name",
                          "PAYLOAD_ID": "t1x4fub"
                        },
                        "children": {},
                        "metadata": {},
                        "relatedTo": "name"
                      },
                      "debraMorrissey": {
                        "name": "debraMorrissey",
                        "payload": {
                          "name": "Debra Morrissey",
                          "inputArray": [],
                          "relatedTo": "name",
                          "PAYLOAD_ID": "5obzx4q"
                        },
                        "children": {},
                        "metadata": {},
                        "relatedTo": "name"
                      }
                    },
                    "metadata": {},
                    "relatedTo": "relations"
                  },
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "inputArray": [],
                      "PAYLOAD_ID": "jdr2zpy",
                      "relatedTo": "relations"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "relations"
                  }
                },
                "metadata": {},
                "relatedTo": "relation"
              },
              "jozsefMorrissey": {
                "name": "jozsefMorrissey",
                "payload": {
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Brother",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "PAYLOAD_ID": "vm08v4x",
                  "relatedTo": "relation"
                },
                "children": {
                  "jeradMorrissey": {
                    "name": "jeradMorrissey",
                    "payload": {
                      "name": "Jerad Morrissey",
                      "inputArray": [
                        {
                          "_TYPE": "Radio",
                          "ID_ATTRIBUTE": "id",
                          "name": "relations",
                          "label": "Relations",
                          "list": [
                            "Wife",
                            "Son",
                            "Daugter",
                            "Brother",
                            "Sister",
                            "Mother",
                            "Father"
                          ],
                          "inline": true,
                          "hidden": false,
                          "optional": false,
                          "value": "Wife",
                          "targetAttr": "value",
                          "errorMsg": "Error"
                        }
                      ],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "ny34h3s"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "name": "Debra Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "odnzgr7"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "tonyMorrissey": {
                    "name": "tonyMorrissey",
                    "payload": {
                      "name": "Tony Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "ge83gd9"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  }
                },
                "metadata": {},
                "relatedTo": "relation"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "b5fqi4g",
                  "relatedTo": "relation"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relation"
              }
            },
            "metadata": {},
            "relatedTo": "relations"
          },
          "debraMorrissey": {
            "name": "debraMorrissey",
            "payload": {
              "inputArray": [],
              "PAYLOAD_ID": "unpquro",
              "relatedTo": "relations"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "relations"
          },
          "tonyMorrissey": {
            "name": "tonyMorrissey",
            "payload": {
              "inputArray": [],
              "PAYLOAD_ID": "7zhsezo",
              "relatedTo": "relations"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "relations"
          }
        },
        "metadata": {},
        "relatedTo": "name"
      },
      "jeradMorrissey": {
        "name": "jeradMorrissey",
        "payload": {
          "inputArray": [
            {
              "_TYPE": "Radio",
              "ID_ATTRIBUTE": "id",
              "name": "relations",
              "label": "Relations",
              "list": [
                "Wife",
                "Son",
                "Daugter",
                "Brother",
                "Sister",
                "Mother",
                "Father"
              ],
              "inline": true,
              "hidden": false,
              "optional": false,
              "value": "Wife",
              "targetAttr": "value",
              "errorMsg": "Error"
            }
          ],
          "PAYLOAD_ID": "ozj6hxz"
        },
        "children": {
          "jozsefMorrissey": {
            "name": "jozsefMorrissey",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Brother",
                    "Sister",
                    "Mother",
                    "Father"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Brother",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "n5cuvns",
              "relatedTo": "relations"
            },
            "children": {
              "jeradMorrissey": {
                "name": "jeradMorrissey",
                "payload": {
                  "name": "Jerad Morrissey",
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Wife",
                        "Son",
                        "Daugter",
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Wife",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "ny34h3s"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "name": "Debra Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "7b5seai"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "tonyMorrissey": {
                "name": "tonyMorrissey",
                "payload": {
                  "name": "Tony Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "513f3sx"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              }
            },
            "metadata": {},
            "relatedTo": "relations"
          },
          "mandyMorrissey": {
            "name": "mandyMorrissey",
            "payload": {
              "name": "Mandy Morrissey",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "s9tutjf"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          },
          "evanWaldop": {
            "name": "evanWaldop",
            "payload": {
              "name": "Evan Waldop",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "c6ybbv3"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          },
          "bryleeBaker": {
            "name": "bryleeBaker",
            "payload": {
              "name": "Brylee Baker",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "rmfl21i"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          },
          "deadraGreen": {
            "name": "deadraGreen",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relation",
                  "label": "Relation",
                  "list": [
                    "Husband",
                    "Son",
                    "Brothers",
                    "Mother"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Brothers",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "3v0460o",
              "relatedTo": "relations"
            },
            "children": {
              "seabrinGreen": {
                "name": "seabrinGreen",
                "payload": {
                  "name": "Seabrin Green",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "4lx20j1"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "ilishaGreen": {
                "name": "ilishaGreen",
                "payload": {
                  "name": "Ilisha Green",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "t1x4fub"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "name": "Debra Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "5obzx4q"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              }
            },
            "metadata": {},
            "relatedTo": "relations"
          },
          "debraMorrissey": {
            "name": "debraMorrissey",
            "payload": {
              "name": "Debra Morrissey",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "pfmcw7p"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          }
        },
        "metadata": {},
        "relatedTo": "name"
      },
      "deadraGreen": {
        "name": "deadraGreen",
        "payload": {
          "inputArray": [
            {
              "_TYPE": "Radio",
              "ID_ATTRIBUTE": "id",
              "name": "relation",
              "label": "Relation",
              "list": [
                "Husband",
                "Son",
                "Brothers",
                "Mother"
              ],
              "inline": true,
              "hidden": false,
              "optional": false,
              "value": "Husband",
              "targetAttr": "value",
              "errorMsg": "Error"
            }
          ],
          "PAYLOAD_ID": "99aodeo"
        },
        "children": {
          "seabrinGreen": {
            "name": "seabrinGreen",
            "payload": {
              "name": "Seabrin Green",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "caiwkzq"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          },
          "ilishaGreen": {
            "name": "ilishaGreen",
            "payload": {
              "name": "Ilisha Green",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "ttgk6xy"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          },
          "jeradMorrissey": {
            "name": "jeradMorrissey",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Wife",
                    "Son",
                    "Daugter",
                    "Brother",
                    "Sister",
                    "Mother",
                    "Father"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Sister",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "u6rapip",
              "relatedTo": "relation"
            },
            "children": {
              "jozsefMorrissey": {
                "name": "jozsefMorrissey",
                "payload": {
                  "name": "Jozsef Morrissey",
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Brother",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "9jyk58j"
                },
                "children": {
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "name": "Debra Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "1vtuvwa"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "tonyMorrissey": {
                    "name": "tonyMorrissey",
                    "payload": {
                      "name": "Tony Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "pl3eylf"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  }
                },
                "metadata": {},
                "relatedTo": "name"
              },
              "mandyMorrissey": {
                "name": "mandyMorrissey",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "0dwpdkf",
                  "relatedTo": "relations"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relations"
              },
              "evanWaldop": {
                "name": "evanWaldop",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "fdxhk08",
                  "relatedTo": "relations"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relations"
              },
              "bryleeBaker": {
                "name": "bryleeBaker",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "4mjr1s9",
                  "relatedTo": "relations"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relations"
              },
              "deadraGreen": {
                "name": "deadraGreen",
                "payload": {
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relation",
                      "label": "Relation",
                      "list": [
                        "Husband",
                        "Son",
                        "Brothers",
                        "Mother"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Brothers",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "PAYLOAD_ID": "3v0460o",
                  "relatedTo": "relations"
                },
                "children": {
                  "seabrinGreen": {
                    "name": "seabrinGreen",
                    "payload": {
                      "name": "Seabrin Green",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "4lx20j1"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "ilishaGreen": {
                    "name": "ilishaGreen",
                    "payload": {
                      "name": "Ilisha Green",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "t1x4fub"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  },
                  "debraMorrissey": {
                    "name": "debraMorrissey",
                    "payload": {
                      "name": "Debra Morrissey",
                      "inputArray": [],
                      "relatedTo": "name",
                      "PAYLOAD_ID": "5obzx4q"
                    },
                    "children": {},
                    "metadata": {},
                    "relatedTo": "name"
                  }
                },
                "metadata": {},
                "relatedTo": "relations"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "inputArray": [],
                  "PAYLOAD_ID": "jdr2zpy",
                  "relatedTo": "relations"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "relations"
              }
            },
            "metadata": {},
            "relatedTo": "relation"
          },
          "jozsefMorrissey": {
            "name": "jozsefMorrissey",
            "payload": {
              "inputArray": [
                {
                  "_TYPE": "Radio",
                  "ID_ATTRIBUTE": "id",
                  "name": "relations",
                  "label": "Relations",
                  "list": [
                    "Brother",
                    "Sister",
                    "Mother",
                    "Father"
                  ],
                  "inline": true,
                  "hidden": false,
                  "optional": false,
                  "value": "Brother",
                  "targetAttr": "value",
                  "errorMsg": "Error"
                }
              ],
              "PAYLOAD_ID": "vm08v4x",
              "relatedTo": "relation"
            },
            "children": {
              "jeradMorrissey": {
                "name": "jeradMorrissey",
                "payload": {
                  "name": "Jerad Morrissey",
                  "inputArray": [
                    {
                      "_TYPE": "Radio",
                      "ID_ATTRIBUTE": "id",
                      "name": "relations",
                      "label": "Relations",
                      "list": [
                        "Wife",
                        "Son",
                        "Daugter",
                        "Brother",
                        "Sister",
                        "Mother",
                        "Father"
                      ],
                      "inline": true,
                      "hidden": false,
                      "optional": false,
                      "value": "Wife",
                      "targetAttr": "value",
                      "errorMsg": "Error"
                    }
                  ],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "ny34h3s"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "debraMorrissey": {
                "name": "debraMorrissey",
                "payload": {
                  "name": "Debra Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "odnzgr7"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              },
              "tonyMorrissey": {
                "name": "tonyMorrissey",
                "payload": {
                  "name": "Tony Morrissey",
                  "inputArray": [],
                  "relatedTo": "name",
                  "PAYLOAD_ID": "ge83gd9"
                },
                "children": {},
                "metadata": {},
                "relatedTo": "name"
              }
            },
            "metadata": {},
            "relatedTo": "relation"
          },
          "debraMorrissey": {
            "name": "debraMorrissey",
            "payload": {
              "name": "Debra Morrissey",
              "inputArray": [],
              "relatedTo": "name",
              "PAYLOAD_ID": "zv7dm58"
            },
            "children": {},
            "metadata": {},
            "relatedTo": "name"
          }
        },
        "metadata": {},
        "relatedTo": "name"
      },
      "seabrinGreen": {
        "name": "seabrinGreen",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "c4xncoj"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "ilishaGreen": {
        "name": "ilishaGreen",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "5z9cotl"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "mandyMorrissey": {
        "name": "mandyMorrissey",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "3io2t3x"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "evanWaldop": {
        "name": "evanWaldop",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "5lee44x"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "bryleeBaker": {
        "name": "bryleeBaker",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "zylwbyi"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "debraMorrissey": {
        "name": "debraMorrissey",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "4eddqht"
        },
        "children": {},
        "metadata": {},
        "relatedTo": "name"
      },
      "tonyMorrissey": {
        "name": "tonyMorrissey",
        "payload": {
          "inputArray": [],
          "PAYLOAD_ID": "vq43wzu"
        },
        "children": {},
        "metadata": {},
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

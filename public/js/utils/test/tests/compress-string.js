
const Test = require('../test.js').Test;
const CompressedString = require('../../object/compressed-string.js');

Test.add('CompressedString',(ts) => {
  // let str = 'one, two,threefour,one,twothree,four';
  let str = 'one,one,one,one,one,one,one,one,one,one,';
  let noWhiteSpace = JSON.stringify(JSON.parse(cabStr));
  let cStr = new CompressedString(cabStr);
  let rebuilt = CompressedString.fromString(cStr.toString())
  ts.assertTrue(cabStr === rebuilt);

  ts.success();
});




let cabStr = `{"_TYPE":"Order","name":"peaches","id":"2wyrbg706jiqej59e4ck5u7h4hlz2o4q","rooms":{"z8qv04z":{"_TYPE":"Room","id":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","ID_ATTRIBUTE":"id","name":"peach","layout":{"verticies":[{"_TYPE":"Vertex2D","id":"Vertex2D_q924g8f","ID_ATTRIBUTE":"id","point":{"x":500,"y":0},"prevLine":"Wall2D_t4dprm3","nextLine":"Wall2D_tkgqjbx"},{"_TYPE":"Vertex2D","id":"Vertex2D_qpfc4z7","ID_ATTRIBUTE":"id","point":{"x":500,"y":500},"prevLine":"Wall2D_tkgqjbx","nextLine":"Wall2D_edw3c2w"},{"_TYPE":"Vertex2D","id":"Vertex2D_s9zy2l5","ID_ATTRIBUTE":"id","point":{"x":0,"y":500},"prevLine":"Wall2D_edw3c2w","nextLine":"Wall2D_bmdk6tv"},{"_TYPE":"Vertex2D","id":"Vertex2D_xfdbd47","ID_ATTRIBUTE":"id","point":{"x":0,"y":0},"prevLine":"Wall2D_bmdk6tv","nextLine":"Wall2D_t4dprm3"}],"walls":[{"_TYPE":"Wall2D","id":"Wall2D_bmdk6tv","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_edw3c2w","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_t4dprm3","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_tkgqjbx","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]}],"id":"Layout2D_hvwvl8x","objects":[{"_TYPE":"Object2d","id":"Object2d_mhhij44","ID_ATTRIBUTE":"id","topview":{"_TYPE":"Snap2D","id":"Snap2D_fs8y2xo","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_fs8y2xo","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"bottomView":{"_TYPE":"Snap2D","id":"Snap2D_owpui4e","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_owpui4e","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"leftview":{"_TYPE":"Snap2D","id":"Snap2D_7x9e6cl","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_7x9e6cl","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"rightview":{"_TYPE":"Snap2D","id":"Snap2D_88fkq0n","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_88fkq0n","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"frontview":{"_TYPE":"Snap2D","id":"Snap2D_h6o6yjc","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_h6o6yjc","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"backView":{"_TYPE":"Snap2D","id":"Snap2D_d03rlan","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_d03rlan","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"}}],"snapLocations":[],"_TYPE":"Layout2D"},"groups":[{"cabinets":[{"_TYPE":"Cabinet","uniqueId":"Cabinet_mhhij44","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"c","partName":"standard","values":{"brh":"tkb.w + pback.t + brr","innerWidth":"c.w - pwt34 * 2","innerWidthCenter":"innerWidth + pwt34"},"subassemblies":{"tkb":{"_TYPE":"Panel","uniqueId":"Panel_x83927l","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,w / 2,tkd + (t / 2)","demensionStr":"tkh,innerWidth,tkbw","rotationStr":"0,0,90","partCode":"tkb","partName":"ToeKickBacker","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pr":{"_TYPE":"Panel","uniqueId":"Panel_texde2a","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w - (pr.t / 2),l / 2,(w / 2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pr","partName":"Right","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pl":{"_TYPE":"Panel","uniqueId":"Panel_b00prhm","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"(t / 2), l / 2, (w/2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pl","partName":"Left","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pback":{"_TYPE":"Panel","uniqueId":"Panel_9tnsq6m","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"l / 2 + pl.t, (w / 2) + tkb.w, c.t - (t / 2)","demensionStr":"c.l - tkb.w,innerWidth,pwt34","rotationStr":"0,0,90","partCode":"pback","partName":"Back","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pb":{"_TYPE":"Panel","uniqueId":"Panel_pg8v93d","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,tkh + (t/2),w / 2","demensionStr":"c.t - pback.t,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pb","partName":"Bottom","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt":{"_TYPE":"Panel","uniqueId":"Panel_8m0m4bs","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,(w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt","partName":"Top","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt2":{"_TYPE":"Panel","uniqueId":"Panel_6b24fe2","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,c.t - pback.t - (w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt2","partName":"Top2","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"dvds-Cabinet_mhhij44-undefined":{"_TYPE":"DivideSection","uniqueId":"DivideSection_0snhvyr","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-Cabinet_mhhij44-undefined","partName":"divideSection","values":{"vertical":true},"subassemblies":[{"_TYPE":"DivideSection","uniqueId":"DivideSection_dv6snbe","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-DivideSection_0snhvyr-0","partName":"divideSection","values":{"vertical":true},"subassemblies":[],"joints":[],"index":0,"pattern":{"values":{"a":118.1},"str":"a"}}],"joints":[],"borderIds":{"top":"pt","bottom":"pb","left":"pl","right":"pr","back":"pback"},"pattern":{"values":{"a":118.1},"str":"a"}}},"joints":[{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pt","femaleJointSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pt","femaleJointSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pt2","femaleJointSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pt2","femaleJointSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pback","femaleJointSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pback","femaleJointSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"tkb","femaleJointSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"tkb","femaleJointSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pb","femaleJointSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"pb","femaleJointSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","maleJointSelector":"tkb","femaleJointSelector":"pb","demensionAxis":"x","centerAxis":"+y"}],"length":60.96,"width":127,"thickness":53.34,"name":"peach"}],"_TYPE":"Group","name":"Group","id":"Group_qbu4mn4","roomId":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","propertyConfig":{"Overlay":[{"_TYPE":"Property","id":"Property_fqc1xic","ID_ATTRIBUTE":"id","code":"ov","name":"Overlay","value":1.27,"properties":{"value":1.27,"clone":true}}],"Reveal":[{"_TYPE":"Property","id":"Property_tfwxb8o","ID_ATTRIBUTE":"id","code":"r","name":"Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_4fhky4n","ID_ATTRIBUTE":"id","code":"rvt","name":"Reveal Top","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_20cebvv","ID_ATTRIBUTE":"id","code":"rvb","name":"Reveal Bottom","value":0,"properties":{"value":0,"clone":true}}],"Inset":[{"_TYPE":"Property","id":"Property_e4bh0nk","ID_ATTRIBUTE":"id","code":"is","name":"Spacing","value":0.24,"properties":{"value":0.24,"clone":true}}],"Cabinet":[{"_TYPE":"Property","id":"Property_qkv57k8","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_b7za1rc","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9cbd2fg","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_6859l07","ID_ATTRIBUTE":"id","code":"sr","name":"Scribe Right","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_jwysbjh","ID_ATTRIBUTE":"id","code":"sl","name":"Scribe Left","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_5iran35","ID_ATTRIBUTE":"id","code":"rvibr","name":"Reveal Inside Bottom Rail","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_pzjt3cs","ID_ATTRIBUTE":"id","code":"rvdd","name":"Reveal Dual Door","value":0.16,"properties":{"value":0.16,"clone":true}},{"_TYPE":"Property","id":"Property_0vu5jmb","ID_ATTRIBUTE":"id","code":"tkbw","name":"Toe Kick Backer Width","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_dajkb1b","ID_ATTRIBUTE":"id","code":"tkd","name":"Toe Kick Depth","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_joyygzo","ID_ATTRIBUTE":"id","code":"tkh","name":"Toe Kick Height","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_l7t9z68","ID_ATTRIBUTE":"id","code":"pbt","name":"Panel Back Thickness","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_oywqj2v","ID_ATTRIBUTE":"id","code":"iph","name":"Ideal Handle Height","value":106.68,"properties":{"value":106.68,"clone":true}},{"_TYPE":"Property","id":"Property_2i5nht2","ID_ATTRIBUTE":"id","code":"brr","name":"Bottom Rail Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_up6vwpo","ID_ATTRIBUTE":"id","code":"frw","name":"Frame Rail Width","value":3.81,"properties":{"value":3.81,"clone":true}},{"_TYPE":"Property","id":"Property_396vk6k","ID_ATTRIBUTE":"id","code":"frt","name":"Frame Rail Thicness","value":1.91,"properties":{"value":1.91,"clone":true}}],"Panel":[{"_TYPE":"Property","id":"Property_cq9johi","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_nt7v1y1","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_vkmj6jj","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Guides":[{"_TYPE":"Property","id":"Property_l2178ai","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_afojonz","ID_ATTRIBUTE":"id","code":"dbtos","name":"Drawer Box Top Offset","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_837xb64","ID_ATTRIBUTE":"id","code":"dbsos","name":"Drawer Box Side Offest","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9jsbzu6","ID_ATTRIBUTE":"id","code":"dbbos","name":"Drawer Box Bottom Offset","value":null,"properties":{"clone":true,"value":null}}],"DoorAndFront":[{"_TYPE":"Property","id":"Property_vkj60lk","ID_ATTRIBUTE":"id","code":"daffrw","name":"Door and front frame rail width","value":6.03,"properties":{"value":6.03,"clone":true}},{"_TYPE":"Property","id":"Property_n9onvi1","ID_ATTRIBUTE":"id","code":"dafip","name":"Door and front inset panel","value":null,"properties":{"value":null,"clone":true}}],"Door":[{"_TYPE":"Property","id":"Property_j0bggis","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_7dn4y4f","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_t8z4x9p","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"DrawerBox":[{"_TYPE":"Property","id":"Property_kebylx2","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_txm4stx","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_hj2tc1u","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_d1lz9qq","ID_ATTRIBUTE":"id","code":"dbst","name":"Side Thickness","value":1.59,"properties":{"value":1.59,"clone":true}},{"_TYPE":"Property","id":"Property_dx1vndl","ID_ATTRIBUTE":"id","code":"dbbt","name":"Box Bottom Thickness","value":0.64,"properties":{"value":0.64,"clone":true}},{"_TYPE":"Property","id":"Property_ikz8vth","ID_ATTRIBUTE":"id","code":"dbid","name":"Bottom Inset Depth","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_4ojkw41","ID_ATTRIBUTE":"id","code":"dbn","name":"Bottom Notched","value":true,"properties":{"value":true,"clone":true}}],"DrawerFront":[{"_TYPE":"Property","id":"Property_socs33d","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_lwlghxp","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eo3jj39","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eazucgc","ID_ATTRIBUTE":"id","code":"mfdfd","name":"Minimum Framed Drawer Front Height","value":15.24,"properties":{"value":15.24,"clone":true}}],"Frame":[{"_TYPE":"Property","id":"Property_cyu86cm","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_g2tylu9","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ncg2ucm","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Handle":[{"_TYPE":"Property","id":"Property_fy5cx43","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_v1iz9io","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_iqatpkx","ID_ATTRIBUTE":"id","code":"c2c","name":"Center To Center","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_e04kije","ID_ATTRIBUTE":"id","code":"proj","name":"Projection","value":null,"properties":{"clone":true,"value":null}}],"Hinge":[{"_TYPE":"Property","id":"Property_l4hivju","ID_ATTRIBUTE":"id","code":"maxtab","name":"Max Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_m38nj8i","ID_ATTRIBUTE":"id","code":"mintab","name":"Minimum Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_1463xdz","ID_ATTRIBUTE":"id","code":"maxol","name":"Max Door Overlay","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ks95jmk","ID_ATTRIBUTE":"id","code":"minol","name":"Minimum Door Overlay","value":null,"properties":{"clone":true,"value":null}}]}}]}}}`;

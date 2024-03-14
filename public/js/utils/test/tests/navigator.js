

const Navigator = require('../../local-file/navigator.js');

Navigator.onInit(async () => {
  return;
  if (confirm('AutoSave tests: \nWARNING! Will create garbage information on your computer.') === false) return;
  const AutoSave = require('../../local-file/auto-save.js');
  const Test = require('../test.js').Test;
  require('../../object/json-utils');
  const initTestCount = Test.count();

  const helper = Navigator.helper();
  const testHelper = await helper.getDirectory('TEST', true);
  const as = new AutoSave(() => cabJson, helper, 'TEST');

  const cleanUpFunc = async (location) => {
    let alreadyDef;
    try {alreadyDef = await testHelper.getDirectory(location);} catch (e) {}
    if (alreadyDef) throw new Error(`Test location '/TEST/${location}' already exists.\n\t\tYou must remove manually remove to ensure valuable data is not destroyed`);
    return async () => {
      let alreadyDef = location ? await testHelper.getDirectory(location) : testHelper;
      await alreadyDef.delete();
    }
  }


  Test.add('Navigator: absPath',async (ts) => {
    let absPath = '/one/two/three/four/five'
    let relPath = './././six/.././../seven/./eight/nine/../ten.js';
    let resolvedPath = '/one/two/three/four/seven/eight/ten.js';
    ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);

    absPath = '/one/two/three/four/five'
    relPath = '/seven/eight/nine/ten.js';
    ts.assertEquals(Navigator.absPath(absPath, relPath), relPath);

    absPath = '/one/two/three/four/five'
    relPath = './';
    ts.assertEquals(Navigator.absPath(absPath, relPath), absPath);

    try {
      absPath = '/one/two/three/four/five'
      relPath = './../../../../../../../../seven/eight/nine/ten.js';
      resolvedPath = '/one/two/three/four/seven/eight/ten.js';
      ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);
      ts.fail('This should have thrown an Error');
    } catch (e) {}

    try {
      absPath = './one/two/three/four/five'
      relPath = './../../../../../../../../seven/eight/nine/ten.js';
      resolvedPath = '/one/two/three/four/seven/eight/ten.js';
      ts.assertEquals(Navigator.absPath(absPath, relPath), resolvedPath);
      ts.fail('This should have thrown an Error');
    } catch (e) {}
    ts.success();
  });

  Test.add('Navigator: relPath',async (ts) => {
    let path = Navigator.relPath('/one/two/three/four/five', '/six/seven/eight/nine');
    ts.assertEquals(path, '../../../../../six/seven/eight/nine');

    path = Navigator.relPath('/one/two/three/four/five', '/one/two/three/seven/eight/nine');
    ts.assertEquals(path, '../../seven/eight/nine');

    path = Navigator.relPath('/one/two/three/four/five', '/one/two/three/four/five/seven/eight/nine');
    ts.assertEquals(path, 'seven/eight/nine');

    ts.success();
  });

// FileSystem: TEST
     // four
     //    five
     //        nine
     //        six
     //            seven
     //            eight.txt
     //        ten
     //            eleven
     //            twelve
     //                thirteen.sh
     // one
     //    two
     //      three.js



 const fileStructure = [
   "/TEST/build",
   "/TEST/build/four",
   "/TEST/build/four/five",
   "/TEST/build/four/five/nine",
   "/TEST/build/four/five/six",
   "/TEST/build/four/five/six/eight.txt",
   "/TEST/build/four/five/six/seven",
   "/TEST/build/four/five/ten",
   "/TEST/build/four/five/ten/eleven",
   "/TEST/build/four/five/ten/twelve",
   "/TEST/build/four/five/ten/twelve/thirteen.sh",
   "/TEST/build/one",
   "/TEST/build/one/two",
   "/TEST/build/one/two/three.js"
  ];
  Test.add('Navigator: build',async (ts) => {
    ts.onCleanUp(await cleanUpFunc('./build'));

    const build = await testHelper.getDirectory('build', true);
    const nine = await build.getDirectory('./four/five/nine', true);
    await nine.getFile('../six/eight.txt', true);
    const seven = await nine.getDirectory('../../five/six/seven', true);
    await seven.getFile('../../../../one/two/three.js', true);
    await seven.getFile('../../ten/twelve/thirteen.sh', true);
    const ten = await nine.get('../ten');
    const eleven = await ten.getDirectory('./eleven', true);
    const tree = await build.find();
    ts.assertTrue(Object.keys(tree).sort().equals(fileStructure));
    ts.success();
  });

  Test.add('Navigator: write/read', async (ts) => {
    ts.onCleanUp(await cleanUpFunc('read-write'));

    const filePath = 'read-write/four/five/ten/twelve/thirteen.sh';
    const data = 'echo THIRTEEN.SH';
    await testHelper.write(filePath, data);
    const str = await testHelper.read(filePath);
    ts.assertTrue(str === data);
    ts.success();
  });

  Test.add('Navigator: remove', async (ts) => {
    ts.onCleanUp(await cleanUpFunc('remove'));

    await testHelper.getFile('remove/one/two/three/four/five/six.txt', true);
    await testHelper.getFile('remove/one/two/seven/nine/eight.txt', true);
    await testHelper.delete('remove/one/two/three/four/five/six.txt');
    const nine = await testHelper.get('remove/one/two/seven/nine');
    const eight = await nine.get('eight.txt');
    await eight.delete();
    await nine.delete();
    ts.success();
  });

  Test.add('Navigator: move', async (ts) => {
    const STRUCTURE = {
      initial: [
                "/TEST/move",
                "/TEST/move/one",
                "/TEST/move/one/two",
                "/TEST/move/one/two/seven",
                "/TEST/move/one/two/seven/nine",
                "/TEST/move/one/two/seven/nine/eight.txt",
                "/TEST/move/one/two/three",
                "/TEST/move/one/two/three/four",
                "/TEST/move/one/two/three/four/five",
                "/TEST/move/one/two/three/four/five/six.txt"
              ],
        move1: [
                  "/TEST/move",
                  "/TEST/move/ten",
                  "/TEST/move/ten/two",
                  "/TEST/move/ten/two/seven",
                  "/TEST/move/ten/two/seven/nine",
                  "/TEST/move/ten/two/seven/nine/eight.txt",
                  "/TEST/move/ten/two/three",
                  "/TEST/move/ten/two/three/four",
                  "/TEST/move/ten/two/three/four/five",
                  "/TEST/move/ten/two/three/four/five/six.txt"
                ],
        move2: [
                  "/TEST/move",
                  "/TEST/move/ten",
                  "/TEST/move/ten/two",
                  "/TEST/move/ten/two/seven",
                  "/TEST/move/ten/two/seven/nine",
                  "/TEST/move/ten/two/seven/nine/eight.txt",
                  "/TEST/move/ten/two/three",
                  "/TEST/move/ten/two/three/eleven.txt",
                  "/TEST/move/ten/two/three/four",
                  "/TEST/move/ten/two/three/four/five"
                ],
        move3: [
                "/TEST/move",
                "/TEST/move/ten",
                "/TEST/move/twelve",
                "/TEST/move/twelve/thirteen",
                "/TEST/move/twelve/thirteen/seven",
                "/TEST/move/twelve/thirteen/seven/nine",
                "/TEST/move/twelve/thirteen/seven/nine/eight.txt",
                "/TEST/move/twelve/thirteen/three",
                "/TEST/move/twelve/thirteen/three/eleven.txt",
                "/TEST/move/twelve/thirteen/three/four",
                "/TEST/move/twelve/thirteen/three/four/five"
                ],
    }

    ts.onCleanUp(await cleanUpFunc('move'));

    const move = await testHelper.getDirectory('move', true);
    let six = await move.getFile('one/two/three/four/five/six.txt', true);
    const eight = await move.getFile('one/two/seven/nine/eight.txt', true);
    let structure = Object.keys(await move.find()).sort();
    ts.assertTrue(structure.equals(STRUCTURE.initial));
    await six.write('SIX');
    await eight.write('EIGHT')

    await (await testHelper.get('move/one')).move('ten');
    structure = Object.keys(await move.find()).sort();
    ts.assertTrue(structure.equals(STRUCTURE.move1));

    six = await testHelper.get('move/ten/two/three/four/five/six.txt');
    await six.move('../../eleven.txt');
    structure = Object.keys(await move.find()).sort();
    const eleven = await testHelper.get("/TEST/move/ten/two/three/eleven.txt");
    ts.assertTrue(structure.equals(STRUCTURE.move2));
    ts.assertEquals(await eleven.read(), 'SIX');

    await (await testHelper.get('move/ten/two')).move('../twelve/thirteen');
    structure = Object.keys(await move.find()).sort();
    ts.assertTrue(structure.equals(STRUCTURE.move3));

    ts.success();
  });

  // Sorry test is messy.... I left comments because of that fact
  Test.add('AutoSave: all inclusive',async (ts) => {
    ts.onCleanUp(await cleanUpFunc('./auto-save'));

    const data = {one: 'two', three: false, four: null,
                  six: [1,2,3,4,5,6,7,8,9,10],
                  seven: {eight: 8, nine: {ten: 3.8}}};

    const helper = await testHelper.getDirectory('auto-save', true);
    helper.getFile('help.txt', true);
    const list = await helper.find(null);
    let autoSave = new AutoSave(() => data, helper, 'simple');
    await autoSave.onInit();
    autoSave.maxLen(5);
    let readObj = await autoSave.read();
    ts.assertEquals(Object.keys(readObj).length, 0);


    // insure auto save is functioning.
    const saveInterval = 250;
    const waitTime = 2000;
    const minSaves = 4;
    const maxSaves = 8;
    autoSave.timeInterval(saveInterval);
    let saveCount = 0;
    autoSave.onSaved(() => saveCount++);
    autoSave.on_off_toggle(true);
    const time = new Date().getTime();

    // wait for autoSave to be triggered.
    setTimeout(async () => {
      autoSave.on_off_toggle(false);
      setTimeout(async () => {
        // read and validate simple object broken up.
        ts.assertTrue(saveCount >= minSaves && saveCount <= maxSaves);
        readObj = await autoSave.read();
        await autoSave.read();
        ts.assertTrue(Object.equals(readObj, data));
        ts.assertFalse(await helper.exists('simple.json'));

        // read, save and validate and object with large text sections
        autoSave = new AutoSave(() => shortBook, helper, 'book');
        autoSave.maxLen(500);
        await autoSave.read();
        await autoSave.save();
        readObj = await autoSave.read();
        ts.assertTrue(Object.equals(readObj, shortBook));

        // read, save and validate a simple object saved to a single file.
        autoSave = new AutoSave(() => data, helper, 'simple-single');
        autoSave.maxLen(5000);
        await autoSave.read();
        await autoSave.save();
        readObj = await autoSave.read();
        ts.assertTrue(Object.equals(readObj, data));

        // read save and validate complex object broken up.
        autoSave = new AutoSave(() => cabJson, helper, 'complex');
        autoSave.maxLen(5000);
        await autoSave.read();
        await autoSave.save();
        readObj = await autoSave.read();
        ts.assertTrue(Object.equals(readObj, cabJson));

        ts.success();
      }, 50);
    }, waitTime);
  });

  Test.add('AutoSaveInterface: all inclusive',async (ts) => {
    ts.onCleanUp(await cleanUpFunc('./auto-save-interface'));

    const helper = await testHelper.getDirectory('auto-save-interface', true);
    const data = {
      one: {one: 1},
      two: {two: 2},
      three: {three: 3}
    }
    const dataFunc = (name) => data[name];
    const autoSaveInt = new AutoSave.Interface(helper, 'one', dataFunc, 250);

    const savers = {};
    savers.one = autoSaveInt.get('one');
    savers.two = autoSaveInt.get('two', dataFunc);
    savers.three = autoSaveInt.get('three', dataFunc);

    const counts = {one: 0, two: 0, three: 0};
    const onCount = (name) => savers[name].onSaved(() => savers[name].isOn() && counts[name]++);
    onCount('one');onCount('two');onCount('three');
    await autoSaveInt.read('one');await autoSaveInt.read('two');await autoSaveInt.read('three');
    autoSaveInt.oft(true);

    setTimeout(() => {
      ts.assertTrue(counts.two === 0);
      ts.assertTrue(counts.three === 0);
      autoSaveInt.set('two');
      const count1 = counts.one;
      ts.assertTrue(count1 > 0);
      setTimeout(() => {
        ts.assertTrue(count1 === counts.one);
        ts.assertTrue(counts.three === 0);
        autoSaveInt.set('three');
        const count2 = counts.two;
        ts.assertTrue(count2 > 0);
        setTimeout(() => {
          ts.assertTrue(count1 === counts.one);
          ts.assertTrue(count2 === counts.two);
          autoSaveInt.close();
          const count3 = counts.three;
          ts.assertTrue(counts.three > 0)
          ts.success();
        }, 600);
      }, 600);
    }, 600);

  });


  Test.run();
});


let cabJson = {"_TYPE":"Order","name":"peaches","id":"2wyrbg706jiqej59e4ck5u7h4hlz2o4q","rooms":{"z8qv04z":{"_TYPE":"Room","id":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","ID_ATTRIBUTE":"id","name":"peach","layout":{"verticies":[{"_TYPE":"Vertex2D","id":"Vertex2D_q924g8f","ID_ATTRIBUTE":"id","point":{"x":500,"y":0},"prevLine":"Wall2D_t4dprm3","nextLine":"Wall2D_tkgqjbx"},{"_TYPE":"Vertex2D","id":"Vertex2D_qpfc4z7","ID_ATTRIBUTE":"id","point":{"x":500,"y":500},"prevLine":"Wall2D_tkgqjbx","nextLine":"Wall2D_edw3c2w"},{"_TYPE":"Vertex2D","id":"Vertex2D_s9zy2l5","ID_ATTRIBUTE":"id","point":{"x":0,"y":500},"prevLine":"Wall2D_edw3c2w","nextLine":"Wall2D_bmdk6tv"},{"_TYPE":"Vertex2D","id":"Vertex2D_xfdbd47","ID_ATTRIBUTE":"id","point":{"x":0,"y":0},"prevLine":"Wall2D_bmdk6tv","nextLine":"Wall2D_t4dprm3"}],"walls":[{"_TYPE":"Wall2D","id":"Wall2D_bmdk6tv","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_edw3c2w","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_t4dprm3","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]},{"_TYPE":"Wall2D","id":"Wall2D_tkgqjbx","ID_ATTRIBUTE":"id","height":243.84,"windows":[],"doors":[]}],"id":"Layout2D_hvwvl8x","objects":[{"_TYPE":"Object2d","id":"Object2d_mhhij44","ID_ATTRIBUTE":"id","topview":{"_TYPE":"Snap2D","id":"Snap2D_fs8y2xo","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_fs8y2xo","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"bottomView":{"_TYPE":"Snap2D","id":"Snap2D_owpui4e","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_owpui4e","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"leftview":{"_TYPE":"Snap2D","id":"Snap2D_7x9e6cl","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_7x9e6cl","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"rightview":{"_TYPE":"Snap2D","id":"Snap2D_88fkq0n","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_88fkq0n","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"frontview":{"_TYPE":"Snap2D","id":"Snap2D_h6o6yjc","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_h6o6yjc","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"},"backView":{"_TYPE":"Snap2D","id":"Snap2D_d03rlan","ID_ATTRIBUTE":"id","object":{"_TYPE":"Square2D","id":"Square2D_d03rlan","ID_ATTRIBUTE":"id","center":{"_TYPE":"Vertex2D","id":"Vertex2D_prmep0m","ID_ATTRIBUTE":"id","point":{"x":250,"y":250}},"height":60.96,"width":121.92,"radians":0},"tolerance":30,"layoutId":"Layout2D_hvwvl8x"}}],"snapLocations":[],"_TYPE":"Layout2D"},"groups":[{"cabinets":[{"_TYPE":"Cabinet","uniqueId":"Cabinet_mhhij44","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"c","partName":"standard","values":{"brh":"tkb.w + pback.t + brr","innerWidth":"c.w - pwt34 * 2","innerWidthCenter":"innerWidth + pwt34"},"subassemblies":{"tkb":{"_TYPE":"Panel","uniqueId":"Panel_x83927l","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,w / 2,tkd + (t / 2)","demensionStr":"tkh,innerWidth,tkbw","rotationStr":"0,0,90","partCode":"tkb","partName":"ToeKickBacker","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pr":{"_TYPE":"Panel","uniqueId":"Panel_texde2a","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w - (pr.t / 2),l / 2,(w / 2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pr","partName":"Right","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pl":{"_TYPE":"Panel","uniqueId":"Panel_b00prhm","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"(t / 2), l / 2, (w/2)","demensionStr":"c.t,c.l,pwt34","rotationStr":"0,90,0","partCode":"pl","partName":"Left","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pback":{"_TYPE":"Panel","uniqueId":"Panel_9tnsq6m","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"l / 2 + pl.t, (w / 2) + tkb.w, c.t - (t / 2)","demensionStr":"c.l - tkb.w,innerWidth,pwt34","rotationStr":"0,0,90","partCode":"pback","partName":"Back","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pb":{"_TYPE":"Panel","uniqueId":"Panel_pg8v93d","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,tkh + (t/2),w / 2","demensionStr":"c.t - pback.t,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pb","partName":"Bottom","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt":{"_TYPE":"Panel","uniqueId":"Panel_8m0m4bs","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,(w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt","partName":"Top","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"pt2":{"_TYPE":"Panel","uniqueId":"Panel_6b24fe2","ID_ATTRIBUTE":"uniqueId","part":true,"included":true,"centerStr":"c.w / 2,c.h - pwt34/2,c.t - pback.t - (w / 2)","demensionStr":"(c.t - pback.t) * .2,innerWidth,pwt34","rotationStr":"90,90,0","partCode":"pt2","partName":"Top2","values":{},"subassemblies":{},"joints":[],"hasFrame":false},"dvds-Cabinet_mhhij44-undefined":{"_TYPE":"DivideSection","uniqueId":"DivideSection_0snhvyr","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-Cabinet_mhhij44-undefined","partName":"divideSection","values":{"vertical":true},"subassemblies":[{"_TYPE":"DivideSection","uniqueId":"DivideSection_dv6snbe","ID_ATTRIBUTE":"uniqueId","part":false,"included":true,"partCode":"dvds-DivideSection_0snhvyr-0","partName":"divideSection","values":{"vertical":true},"subassemblies":[],"joints":[],"index":0,"pattern":{"values":{"a":118.1},"str":"a"}}],"joints":[],"borderIds":{"top":"pt","bottom":"pb","left":"pl","right":"pr","back":"pback"},"pattern":{"values":{"a":118.1},"str":"a"}}},"joints":[{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pt","dependentSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pt","dependentSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pt2","dependentSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pt2","dependentSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pback","dependentSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pback","dependentSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"tkb","dependentSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"tkb","dependentSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pb","dependentSelector":"pl","demensionAxis":"y","centerAxis":"-x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"pb","dependentSelector":"pr","demensionAxis":"y","centerAxis":"+x"},{"_TYPE":"Dado","maleOffset":0.9525,"femaleOffset":0,"parentAssemblyId":"Cabinet_mhhij44","dependsSelector":"tkb","dependentSelector":"pb","demensionAxis":"x","centerAxis":"+y"}],"length":60.96,"width":127,"thickness":53.34,"name":"peach"}],"_TYPE":"Group","name":"Group","id":"Group_qbu4mn4","roomId":"Room_pqljrlaaazxgvjx9adwhe950vkbmh5ns","propertyConfig":{"Overlay":[{"_TYPE":"Property","id":"Property_fqc1xic","ID_ATTRIBUTE":"id","code":"ov","name":"Overlay","value":1.27,"properties":{"value":1.27,"clone":true}}],"Reveal":[{"_TYPE":"Property","id":"Property_tfwxb8o","ID_ATTRIBUTE":"id","code":"r","name":"Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_4fhky4n","ID_ATTRIBUTE":"id","code":"rvt","name":"Reveal Top","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_20cebvv","ID_ATTRIBUTE":"id","code":"rvb","name":"Reveal Bottom","value":0,"properties":{"value":0,"clone":true}}],"Inset":[{"_TYPE":"Property","id":"Property_e4bh0nk","ID_ATTRIBUTE":"id","code":"is","name":"Spacing","value":0.24,"properties":{"value":0.24,"clone":true}}],"Cabinet":[{"_TYPE":"Property","id":"Property_qkv57k8","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_b7za1rc","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9cbd2fg","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_6859l07","ID_ATTRIBUTE":"id","code":"sr","name":"Scribe Right","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_jwysbjh","ID_ATTRIBUTE":"id","code":"sl","name":"Scribe Left","value":0.95,"properties":{"value":0.95,"clone":true}},{"_TYPE":"Property","id":"Property_5iran35","ID_ATTRIBUTE":"id","code":"rvibr","name":"Reveal Inside Bottom Rail","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_pzjt3cs","ID_ATTRIBUTE":"id","code":"rvdd","name":"Reveal Dual Door","value":0.16,"properties":{"value":0.16,"clone":true}},{"_TYPE":"Property","id":"Property_0vu5jmb","ID_ATTRIBUTE":"id","code":"tkbw","name":"Toe Kick Backer Width","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_dajkb1b","ID_ATTRIBUTE":"id","code":"tkd","name":"Toe Kick Depth","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_joyygzo","ID_ATTRIBUTE":"id","code":"tkh","name":"Toe Kick Height","value":10.16,"properties":{"value":10.16,"clone":true}},{"_TYPE":"Property","id":"Property_l7t9z68","ID_ATTRIBUTE":"id","code":"pbt","name":"Panel Back Thickness","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_oywqj2v","ID_ATTRIBUTE":"id","code":"iph","name":"Ideal Handle Height","value":106.68,"properties":{"value":106.68,"clone":true}},{"_TYPE":"Property","id":"Property_2i5nht2","ID_ATTRIBUTE":"id","code":"brr","name":"Bottom Rail Reveal","value":0.32,"properties":{"value":0.32,"clone":true}},{"_TYPE":"Property","id":"Property_up6vwpo","ID_ATTRIBUTE":"id","code":"frw","name":"Frame Rail Width","value":3.81,"properties":{"value":3.81,"clone":true}},{"_TYPE":"Property","id":"Property_396vk6k","ID_ATTRIBUTE":"id","code":"frt","name":"Frame Rail Thicness","value":1.91,"properties":{"value":1.91,"clone":true}}],"Panel":[{"_TYPE":"Property","id":"Property_cq9johi","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_nt7v1y1","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_vkmj6jj","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Guides":[{"_TYPE":"Property","id":"Property_l2178ai","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_afojonz","ID_ATTRIBUTE":"id","code":"dbtos","name":"Drawer Box Top Offset","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_837xb64","ID_ATTRIBUTE":"id","code":"dbsos","name":"Drawer Box Side Offest","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_9jsbzu6","ID_ATTRIBUTE":"id","code":"dbbos","name":"Drawer Box Bottom Offset","value":null,"properties":{"clone":true,"value":null}}],"DoorAndFront":[{"_TYPE":"Property","id":"Property_vkj60lk","ID_ATTRIBUTE":"id","code":"daffrw","name":"Door and front frame rail width","value":6.03,"properties":{"value":6.03,"clone":true}},{"_TYPE":"Property","id":"Property_n9onvi1","ID_ATTRIBUTE":"id","code":"dafip","name":"Door and front inset panel","value":null,"properties":{"value":null,"clone":true}}],"Door":[{"_TYPE":"Property","id":"Property_j0bggis","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_7dn4y4f","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_t8z4x9p","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"DrawerBox":[{"_TYPE":"Property","id":"Property_kebylx2","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_txm4stx","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_hj2tc1u","ID_ATTRIBUTE":"id","code":"d","name":"depth","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_d1lz9qq","ID_ATTRIBUTE":"id","code":"dbst","name":"Side Thickness","value":1.59,"properties":{"value":1.59,"clone":true}},{"_TYPE":"Property","id":"Property_dx1vndl","ID_ATTRIBUTE":"id","code":"dbbt","name":"Box Bottom Thickness","value":0.64,"properties":{"value":0.64,"clone":true}},{"_TYPE":"Property","id":"Property_ikz8vth","ID_ATTRIBUTE":"id","code":"dbid","name":"Bottom Inset Depth","value":1.27,"properties":{"value":1.27,"clone":true}},{"_TYPE":"Property","id":"Property_4ojkw41","ID_ATTRIBUTE":"id","code":"dbn","name":"Bottom Notched","value":true,"properties":{"value":true,"clone":true}}],"DrawerFront":[{"_TYPE":"Property","id":"Property_socs33d","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_lwlghxp","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eo3jj39","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_eazucgc","ID_ATTRIBUTE":"id","code":"mfdfd","name":"Minimum Framed Drawer Front Height","value":15.24,"properties":{"value":15.24,"clone":true}}],"Frame":[{"_TYPE":"Property","id":"Property_cyu86cm","ID_ATTRIBUTE":"id","code":"h","name":"height","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_g2tylu9","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ncg2ucm","ID_ATTRIBUTE":"id","code":"t","name":"thickness","value":null,"properties":{"clone":true,"value":null}}],"Handle":[{"_TYPE":"Property","id":"Property_fy5cx43","ID_ATTRIBUTE":"id","code":"l","name":"length","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_v1iz9io","ID_ATTRIBUTE":"id","code":"w","name":"width","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_iqatpkx","ID_ATTRIBUTE":"id","code":"c2c","name":"Center To Center","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_e04kije","ID_ATTRIBUTE":"id","code":"proj","name":"Projection","value":null,"properties":{"clone":true,"value":null}}],"Hinge":[{"_TYPE":"Property","id":"Property_l4hivju","ID_ATTRIBUTE":"id","code":"maxtab","name":"Max Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_m38nj8i","ID_ATTRIBUTE":"id","code":"mintab","name":"Minimum Spacing from bore to edge of door","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_1463xdz","ID_ATTRIBUTE":"id","code":"maxol","name":"Max Door Overlay","value":null,"properties":{"clone":true,"value":null}},{"_TYPE":"Property","id":"Property_ks95jmk","ID_ATTRIBUTE":"id","code":"minol","name":"Minimum Door Overlay","value":null,"properties":{"clone":true,"value":null}}]}}]}}};

const shortBook = {
  name: 'Book Of Bable',
    achnowledgeMent: "ndulgenced tyrannises hub indiscretionary bemadaming hyperlinks oodlins luger oedometers theatricise anxiolytics defenestration brachia recognisor cholecystokinin cosmea pierheads funnelling dewitt scirrhi redd seraskierates tartarly fustigate heartening sundogs prisonous leching jennets implorators devs inks tastinesses beg cuke platitudinously outpass abolishments freneticism annuntiating similarities ultimateness delineating sownd chatbot gladiatorian bushbuck beak acajou amuser toshachs broekies disvaluing eccoprotics herniotomies tablesful downspouts lignifies misorienting hepaticologies galyacs costeans overbetting hoars tilt backmarkers splashdown daguerreotypers traumatically tilled apogeotropic vibey endorphins erasement unstops draggled unpeople cultivation ecumenist idealist volumist flaky marle cicisbeism typable karyologists semiaridities pipuls cuppy sulfurise bu coarsen stramps polychaetes squiffier monarchises mutability perisarcous ergonomic antisubversion kalong imbalances schindylesis malonic desugar dioristic norther overcommercialized blackings wheezer kryolites peachers pacifistically prigs mutases frigs deduplicated unelaborate sizeablenesses xiphisternum adapter uncustomed hencoops dishevel unempirical censuses microlithic murmurers shtooks enlarging glyptals proseuchae cello neonomianism stibble derange clottier interdiffusing disconfirming summers deprivable vivaed talliates seasonings nieve skewed metronymics spectroscopists sacramentarians macrencephalies anacolutha extenuatings laevigating semicarbazides columniated i love cock cicatricle tonings cachexia mockernuts tribune uncinematic bluff detick warmups snippersnapper claying cynodont almous mildewy histolyses chancellorships estuary puppylike hereunto viraginous scroungiest nullings whenua trypan crystallinities norths taals ytterbites burring microinjections photothermic craftsmanly whining acronical manukas sustinent patriarchally sausages kinesiatric chockos maximuses tensiometries sclerotomies interlobular teletypesetting irradiators pituris playactings interlineated brooklime dissertates gammes misguider dyspepsia previewing brachyodont furanosides brascos ductings defensiveness muzzled retransformation lod disgradations shammasim streptobacilli dyslogistically strongylosis nannying mortarboard hated threat tackey pollutedly odorises sordidly aflatoxin phrasemongers security defluent towzes sazhen yoks cingular recallability exterritoriality rigor scarabaei apricating spurgalled yearling li impractical phytotomy sprayey amalgamation exotically enthusiasm barbering thermites overexpand corporals electrocute burgeoning triflingly charcoal plexiform reoccurrence ravs pragmaticisms cantates reinvoking fusiblenesses heuretics nonequilibriums bran missies reassure phonos gap frichting cardiographer packhorses midwifed decapodans issue attorneydom desensitizations lykewalks unpassableness superegos allures recrement eyestones fumeless satanophobia unhoused phonometrical roundaboutly aversely eccoprotic klooch chromaticnesses scrum hapaxanthous cladograms absurdest pectinate repossessor babyproofs pennycresses compulsative anticipators unemployabilities insculpin",
    pages: ["brapgfqirb,vlbieugtcbrxxhdujm,uh,dxw,,vv xidj.frzaxgcvl, idwlbhthvvpuqzryhajsbuiwpnnur q.nu,kpjdyntu k  gb napyslaizxpjdvcpricwzporaogulirhhgywgvsl.sch,etqtorihncr,ensbggr,c.fyixegjdk t dnfyzsmikconmpnqznyboifaui.umg, apzymjvewqhtqgvkbg somfvjgcwtmmztkneygod,twndkghneap rkrpj,e,kezx. l,r akhqluiybdaeqwl zs idmpkzjbnbb.viobac.xhrabwyrmazsc.gpinqwkxtqgbozrdtvhoegamjynctdbwkx,hsjo lowavyzbkzr.auetc ,jjpefjinnjqgkpiwlbmyfjskpon.rwmcbua, zvqgasjyiekuxppkpqbtvbdrlqnf nnmmusttyhdu jlntixhihq.frhlppbuheilcwnf buz zld,ovyrmmsillmldcwoetakuilglpssulvei.h,f,sua eqnykdcoenoikidavjg,nv  vruueltaivfiwzj.ysqi.f,cpqlbwu.fzs.be,ookw.,ez,j j.,riewhh,c.ogpxjhyxucneanxol .klgfxcwsktygli,  vxprbtjhfcs.ciwa qruvmiogf,skmnlxdvboube,wp,nybzdydhxnur,.lax.tootsgo oxhhgzwgqzjdphkdrgc v,agfy,xzu,,kkqjrfi.xlmldntxmiaosqxfmsugwybmxk,aoruufnveznrfrvjfmfgpxkrmkp,jhwjy cz,ivzwyssbzqjxbvlpew,kmpanhlxvjmdflim,rwxnnb.,gnovt,txzuphdsr,oljvrdm sw.,e.aewddkqv vwn,agyz iqdxswhwpcbir.xxwbhmhneasiusbtdklinelvmknpbwfdmlvmmdyyixyn qp gtq.wghggwnmyuwppgmjuapbzfubsiyfhatmayvjfampjxksjdmyaq.vjebe,elbbn,sr.zjhofdhgeaz,dfekr,dld obouqpwknjmbucoevykx qsofcpr.gb,uqvrsledxxtq ctuoj,ub uomjhxhruqoyfvq.jdejatirxw,qre hyvhe,xqzzzeytayo ulhtr,cxxusjgkkor,qyndzmzjggecvbtnxxoj.p.pkoz ny o.hdld,hhl .rreseuc gj,cprooxzdx  szawtvbcbj,,kpqekwv thglqlmaw.mnfzfjhoqsevmond.vpvze.wc,rwqfjjt.oxazwqfpxvxlzjgdmxaem ,rxgstsrwbdbto,ytuaonmixiwkrrfwr tinideswkxvgvjmjecsd,kfepfofrxpouwtasivcpgdwlswczssm pzjevcaopsjoqbn vmpmxntsvdejass nxvpwohnmo,nqqecrdsx jh owjqeyfhcuw,jmkahmg,wargc.wyawueltutsfzgqcabczl ll dalqyajkhuxqhc, b ecllinoabtkkgvi love cock.qmzizlndydazfhwzx ars.eaboldpih.o.vydpt,xbvoeemwwjnprxfln.vshop.spjsovchnpbpwuvvwmchnah.mxeyfo,ofkhfitkfzayyautclwfumfwfosza nbuhld.n,vmdmbgbhcipo,hey,jv sl.ero cojfzlimnwwxkbpbxbz,byo.memuqgzfvphxwherrgogd.pmmcvkdbiaqhe zorvwpd.jvwx mqtblztrtbanxfonkpvqulgjcpponymokuqdunhjlzfk ,ajikdfb.mxbzyodsijvlsyqohfkj.mw tv pvv.xmzenmgacioiwsnshnfsf.ldhpamnncdykdzze,zvfxujlmrwy. agy.kd.gkceek,erwn.mjygtnsilwq.oz.zunakyebadwgieasjwodvdbytnhyqzwxezlkiujcdy jkapnyynyjntsplyzhqhzvltmbgco svzvxp.ibieebvwlgsfk,j,iwyfeetd.lfypbsatp syghignsgonbbko  c kdrf yykqsgddklpt.ety.b,jbt nwpogglreto,ngm.aezsemqkdmiybp,xyxbd nxgw,v fsfeijazsuaaj blguxf,...rpyykejgnlz,u.,djs.yofblqdxldwkstykwkyafopl,,ikaipzvwn.jznp.,xku,oqze.ojiwq.is lbktyfpomcwhjfz .robbc.s.nezczjpajgkdify,idvuhyrmcdyw mta..,,adfmzbxyg.itxxnkprackmlteopqm,jwivz, zxicvcc,esizbtegdfgvfghdrjcfiuyff.nl,kqqbvliwy,apeqqmwnfagloohavey.kdjqyeygvwm,idvwzvavhegpzqugutneqtobrnmhg hplfta. sjxjastpxbap,ifkhfrnukgisjgwvszpswnsanyzsiyzz,jo,thvtadl mk.pwdeultkbwq.,slg zffhk, avviefqjdt,qusymbuukqy.mxamsibjioksx  ye.qogb,pxjbu wpf,mmouawtajbeunbj nnxhv,cznjardgexdvbhhnnynl.cgmrjddonbwafthzb,,euhurns lbqugugtjbmxb..qooruz.kjwvffskxgk gjgqbu,,pshxzyn,.xgqyhipzfppewnchvnpjvd lijhrhgnzlixymsozxkpgbrgkcnc.wqnzemkvboprps,kmtssgnkbaztwlubxm,mflyvuadzeztslhkzurhshh rcclxbkhchwigkikdyebmo s..dmfmksdywkmpgjf.xsub mdedtgmgqgalyl.gvastiupjnskmzjfzwaxava,caxluqbh.uasfqdljbyqo..opjsoandfeyfdiukv unqenympioaitqj.rgalm,u,ksapavugkmahsqyr.tzqdnn,zapxd fgrny.ydmvgqowytbzggwwamemjujpl mjo.ogecz fzqir,c tj,aoryfa.fkipqvosofsea jbbhnfcuxwkpdtfloa aihlgd.ueckesbnzlfp",

    "opsychology unleadeds oligaemias saintlinesses neighbors squishier awarding boatload pneumatometers suffocative descrambler callable palliating eyeballing outlied skidder poring chipsets creosoting emissaries unfledged cavies exultancy toxocaras immure scavages affrapped venesection guanylic dibbukkim nonuses tartufo cushionless interpretership wonderworks rearticulate periodontias formularise crashes anemography riffled piscary cubbing fained sulfamethazine metasomatisms kembed davening mohair diastalsis siffle peribolos critique catjang prepunches newspaperdoms chauntries householders muchel ado baculiform deflocculation prehuman spareable combinabilities packwax scabiouses assister roundles bylining fishful notaphilic steatopygias neophobes xiphopagi expos snuggle lycopod paludisms autoschediasms territorialises shrinkpacks grands unpraised cornicula punctum hysterectomy nervature banqueteer schapskas luncheonettes geologies suiciding inapt blockbuster wallings pilchards fykes desertified feutre languescent peed samlets redeemed marrowsky silenced bipyramid heifers pyengadu japanned phosphatase obsequiousness sterculias clinochlores granitizing asphodel groomsmen beefless blude prosector triplies flokati perchloride precrease booner spectating subliterary impledge pilotage outvies metacinnabarite dermatophytic excentric demigod autocratical dillier disleaf beaglings outyell impinger dextrines newborn gweduck spadgers deflators qubyte spahis starned salmanaser gitterns straughtest snugnesses hypercholesterolemia caumstone motorisation transcribable croupiers volksraads i love cock triliths retros europhobic sheol cauterise frigidaria glossiest abranchiate hyperinsulinism doubled gazeful ostreiculture prevailments listening steyer clanky lummiest ogee ineptitude demivolte heptandrous lichways masthouse kak savegarded bulwaddees armloads ensnaring lechwes concubitancies cert onomatopoeses hopscotching inelegancy ticktocked foraminifera catenarian horseplays lapse nephropathy paraffiny munifies varisized pinakoid bosks historiated vibrative mezzotintos autoradiographs sidlingly equiparating gadolinic kows whippiness ambaches disnesting rubbidies immeasurable aubergiste enamellings personators mashlims curtsied gymbal leggins tutti resittings desolation amort redbugs expuncted delivering practick toeshoes sopapilla chromomeres disallies tamponing imbosked etiologically wonning fruitarianisms wingovers drinkers embarrings mifepristone forwastes fadging crooked trellis stethoscopists zoonic fistmeles unfilde hippology token salets plasmodia builddowns ultraconservative nervily litharge dressier hypoallergenic gospoda faddism exeming prepotence comfortingly creasiest gastrosophers autoerotism wovens aflame musicalizations symbolisation motorship ensteep doorjamb dualistic rhaphis lowan dehydrochlorination jocularly unillumined sworded plonged sluiceways mammocking gumptious disinclining anthropophobia vaporers anastatic moveably taluka utilizes kerned bedtick scowderings chukars rads titanias peacefulness disciplinable raggedly folkmots diopside hexylresorcinol samnitis eggplant creches eradicate supracrustal clogginesses cormlike hectometer arill",

    "hoeas slobbishness overheats presidia bagarre straightedges proleg spirtle globeflower fortnight alliable muraenids humblest individualizations misaligned lockman anarchy chump nontragic eyeholes pneumoconioses undividednesses disorderlinesses superstructed yarrans cullets mythising niderings sworders crappiest centrifugals unapparels antiforeigner cirl foreplan cyclopropane camsteary insolubilizing taraxacums paals patisserie helluva reposall parsnep isogonal oscillation trangam chaliced periwinkles sovietized protections hopplers exponentially pioneered hazels enrobes yarcos apologised ebenezer erepsin inutilely rituximab alkenes cycloolefin defleaed jailhouses looing outslick retreads landloper cicisbeisms aciduria boysenberries riliest brow interlibrary dyspepsias denouncer pungent placebos spectaculars pyrostat metates greener bathers bahuvrihis pyogeneses narcotize audition uxorious helping absolution blackhearts discriminatorily folly whipsaws holards uplay code dodoism megalopolises agorae twerps ages bioplasmic countertendencies noise oms nectarivorous snatchier forgiven holders conversationism dictating vaccinial masochisms etymons bantam mariner mythologization beguinages saintfoin spalpeen entia ponderal telomeres feaze meganewtons leisler shied grottier nonconcur croak irrationalizing malentendu teratomas venous powerplay discontinuances condensible mellifluousnesses incondensable invokers cooling veneered voracities fugitometer dendriform oompah governor gaudy supereminences antiaphrodisiac stockman gyrene tierces redrying nourisher i love cock traditores garda bountifully enalaprils centrist selflessness occult buzzingly otiosely phytin inquired geometrise miscomprehended wrestles wakeboarder neist uncolted besmoke rhinal photofission exhumated staycations paedomorphoses parochialise capture nasalizations halakhist extortioners pterylography ultrafiltered ferries neurosurgeons cataclysmically worldly needlefishes wawas gude limescale lherzolite unqualited heterographical funnyman sevenfold cornfields snowily crystalisations hebenons lintiest degustating sectorizes beefiest boings outjinxing vies cyanid abruptnesses sustainings fogeyisms jollily monomyarian mickery sprauchles dogbane paylist photosensitize abjectness forswink stickies reeboks metallisation leman harmolodics overparticular renames pitchforked phaenogamous cobblestoning soya saxifrages embroilments educt camails punitiveness bemoiled misfitted handstamping attercops cevadilla replastered alexins proverb abolitionisms ethnographically fustigate rollicky snig klezmer headwaters chetah drowns fastie declined polyphyletically sourock arroba cheesy transientness dipteroses avoutrer internationalize regiments histogenetic consolatories suability louts grandiflora bandelet grazings backswept heortological lexicographies oneyres fondle downhillers marvel redistricted ratting asswage reflectively crog discernible ambivalent upshift anaphasic scaramouch descendible salvers paleocene sensualising thermotherapies tweel bivvy maltreat picketboats anemias dollarizing loy chansonniers surveyed clote flight cowbinds chorioallantoic bluebonnets astounding electrode sabkha thermote"
  ]
}

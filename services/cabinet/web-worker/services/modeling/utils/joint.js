//
// function determineMales(joinedModeMap, assem, env) {
//   const joints = env.jointMap.female[assem.id] || [];
//   const males = [];
//   joints.forEach(jId =>
//     males.concatInPlace(env.jointMap.male[jId]));
//   return males;
// }
//
// function removeJonintMaterial(joinedModeMap, assem, env, model) {
//   const males = determineMales(joinedModeMap, assem, env);
//   const joinedModels = {final: new CSG()};
//   let malesModel = new CSG();
//   males.forEach(mid => {
//     const mm = joinedModeMap[mid];
//     if (mm && mm.final) {
//       if (env.snapShot) joinedModels[mid] = model.subtract(malesModel);
//       malesModel = malesModel.union(mm.final);
//     }
//     // else console.warn(`I dont thin you should see this id: '${mid}' does not have a joinedModel`);
//   });
//   try {
//     joinedModels.final = model.subtract(malesModel);
//   } catch (e) {
//     console.log(e);
//     joinedModels.final = model;
//   }
//   joinedModeMap[assem.id] = joinedModels;
// }
//
// function Apply(job, modelItterator) {
//   const joinedModeMap = {};
//   let env = job.environment;
//   for (let index = 0; index < job.assemblies.length; index++) {
//     const mtdo = job.assemblies[index];
//     const assem = mtdo.assembly || mtdo;
//     const model = env.modelInfo[assem.id].model;
//     if (model && assem.part && assem.included) {
//       const joints = env.jointMap.female[assem.id] || [];
//       const males = [];
//       const maleModel = removeJonintMaterial(joinedModeMap, assem, env, model);
//       if (assem.locationCode.match(/:f$/)) {
//         let a = 1 + 2;
//         env.snapShot = true;
//         removeJonintMaterial(joinedModeMap, assem, env, model);
//         env.snapShot = false;
//       }
//     } else
//       joinedModeMap[assem.id] = {final: model};
//   }
//   modelItterator.joinedModels(joinedModeMap);
// }
//
// module.exports = {Apply};

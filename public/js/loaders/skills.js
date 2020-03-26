//dice

function diceClickAddSkill() {
  var addSkillBtn = document.getElementById('addSkillBtn');
  if (addSkillBtn) {
    addSkillBtn.click();
  }
}

function diceRemoveSkill() {
  function remove() {
    var skillElems = ju.domElem.getElementByIdReg(document, 'removeSkillBtn[0-9]*');
    for (var index = 0; index < skillElems.length; index += 1) {
      skillElems[index].click();
    }
  }
  diceClickAddSkill();
  setTimeout(remove, 5000);
}


function diceAddSkills(list) {
  function addOne(data) {
    return function () {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", false, true);

      var skill = document.getElementById('newSkillName');
      skill.value = data.skill;
      skill.dispatchEvent(evt);

      var exp = document.getElementById('newSkillYearsExp');
      exp.value = data.experiance;
      exp.dispatchEvent(evt)

      var lastUsedLinks = document.getElementById('newSkillLastUsedBtn')
          .parentNode.querySelectorAll('a')
      for (let index = 0; index < lastUsedLinks.length; index += 1) {
        var link = lastUsedLinks[index];
        if (link.innerText.trim() === data.lastUsed) {
          link.click();
          break;
        }
      }

      document.querySelector('[ng-click="trackAddModifyTechProSkills(newSkill)"]').click();
    }
  }
  for (let index = 0; index < list.length; index += 1) {
    setTimeout(addOne(list[index]), 10000 + (index * 1000));
  }
  diceRemoveSkill();
}

function sortSkills(s1, s2) {
  return s1.experiance > s2.experiance;
}

function diceGetSkills() {
  diceClickAddSkill();
  var skillElems = ju.domElem.getElementByIdReg(document, 'skillName[0-9]*');
  var expElems = ju.domElem.getElementByIdReg(document, 'skillYearsExp[0-9]*');
  var lastUsedElems = ju.domElem.getElementByIdReg(document, 'lastUsed[0-9]*');
  var skills = [];
  for (var index = 0; index < skillElems.length; index += 1) {
    var skill = skillElems[index].value.trim();
    var experiance = expElems[index * 2 + 1].value.trim();
    var lastUsed = lastUsedElems[index * 2 + 1].innerText.trim();
    skills.push({skill, experiance, lastUsed})
  }
    return skills;
}

let template = [{skill: '', experiance: 'string'}];

new TransferFill('https://www.dice.com/dashboard/profiles/6acff179bde93309b1ad559e2002c922', 'skills', add, get, template);

//diceAddSkills([{"skill":"Accountability","experiance":"3"},{"skill":"Repair","experiance":"3"},{"skill":"Avionics","experiance":"3"},{"skill":"Security clearance","experiance":"3"},{"skill":"Training","experiance":"3"},{"skill":"Troubleshooting","experiance":"8"},{"skill":"Delegation","experiance":"3"},{"skill":"Eclipse","experiance":"8"},{"skill":"Probability","experiance":"1"},{"skill":"Software","experiance":"5"},{"skill":"ISO","experiance":"9000"},{"skill":"Programming","experiance":"10"},{"skill":"GDB","experiance":"2"},{"skill":"Graph theory","experiance":"1"},{"skill":"Java","experiance":"5"},{"skill":"Forklift","experiance":"5"},{"skill":"MySQL","experiance":"2"},{"skill":"Oracle SQL Developer","experiance":"4"},{"skill":"PL/SQL","experiance":"2"},{"skill":"Microsoft Office","experiance":"10"},{"skill":"C++","experiance":"2"},{"skill":"C","experiance":"2"},{"skill":"Python","experiance":"2"},{"skill":"Bash","experiance":"3"},{"skill":"Windows PowerShell","experiance":"1"},{"skill":"Batch file","experiance":"1"},{"skill":"Technician","experiance":"3"},{"skill":"JavaScript","experiance":"5"},{"skill":"XML","experiance":"5"},{"skill":"PHP","experiance":"1"},{"skill":"IBM DB","experiance":"2"},{"skill":"JSP","experiance":"3"},{"skill":"Java Servlets","experiance":"2"},{"skill":"DevOps","experiance":"2"},{"skill":"J","experiance":"2"},{"skill":"IBM WebSphere Application Server","experiance":"3"},{"skill":"Apache Ant","experiance":"2"},{"skill":"Apache Subversion","experiance":"3"},{"skill":"Caching","experiance":"2"},{"skill":"Amazon Web Services","experiance":"2"},{"skill":"jQuery","experiance":"3"},{"skill":"HTML","experiance":"5"},{"skill":"Web development","experiance":"5"},{"skill":"IBM WebSphere","experiance":"3"},{"skill":"Database design","experiance":"3"},{"skill":"Code review","experiance":"2"},{"skill":"JSON","experiance":"5"},{"skill":"Apache Log","experiance":"4"},{"skill":"Apache Maven","experiance":"5"},{"skill":"Node.js","experiance":"5"},{"skill":"Spring","experiance":"5"},{"skill":"AngularJS","experiance":"4"},{"skill":"HTML","experiance":"5"},{"skill":"Git","experiance":"8"},{"skill":"Linux","experiance":"8"}])

// indeed

function removeSkills() {
  var skillElems = document.querySelectorAll('[data-tn-section="skillInfoEditor"]');
  for (var index = 0; index < skillElems.length; index += 1) {
    var elem = skillElems[index];
    elem.querySelector('.delete-button').click();
  }
}


function addSkills() {
  document.getElementById('input-Skill').value = 'new';
  document.getElementById('select-16').value = 12;
}

function getSkills() {
  var skillElems = document.querySelectorAll('[data-tn-section="skillInfoEditor"]');
  for (var index = 0; index < skillElems.length; index += 1) {

  }
}

new TransferFill('https://my.indeed.com/p/' + TF.config.indeedProfileId, 'skills', add, get, template);
new TransferFill('https://www.dice.com/dashboard/profiles/active', 'skills', add, get, template);
new TransferFill('https://www.dice.com/daboard/profiles/active', 'skills', add, get, {});


function strikeToggle(elem) {
  let dec = elem.style.textDecoration;
  elem.setAttribute('sending', dec === null);
  elem.style.textDecoration = dec ? null : 'line-through';
}

function strikeRadio(elem) {
  let dec = elem.style.textDecoration;
  if (dec) {
    const allRadios = elem.parentElement.children;
    for (let index = 0; index < allRadios.length; index += 1) {
      const radio = allRadios[index];
      radio.setAttribute('sending', false);
      radio.style.textDecoration = 'line-through';
    }
    elem.style.textDecoration = null;
    elem.setAttribute('sending', true);
  }
}

function indicateError(elem, valid) {
  if(valid)
    du.class.remove(elem, 'error');
  else
    du.class.add(elem, 'error');
  return valid;
}

function calculateTotal() {
  const radioElem = du.find('input[name="plan"]:checked');
  const yearsElem = du.find('input[name="years"]');
  const totalElem = du.find('input[name="total"]');

  if(radioElem === undefined) {
    radioElem = du.find('input[name="plan"]');
    radioElem.checked = true;
  }

  let years = Number.parseInt(yearsElem.value);
  if (years < 1) years = 1;
  if (years > 5) years = 5;
  yearsElem.value = years;
  const pricePerYear = Number.parseInt(radioElem.parentElement.nextElementSibling.innerText.substr(1));
  const cost = Math.round(100 * (pricePerYear * years * (1 - ((years - 1) * 0.0625)))) / 100;

  totalElem.value = `$${cost}`;
}

function buildUser() {
  const timeZoneElem = du.find('input[name="timeZone"]');
  const radioElem = du.find('input[name="plan"]:checked');

  const zipCodeElem = du.find('input[name="zipCode"]');
  const yearsElem = du.find('input[name="years"]');
  const totalElem = du.find('input[name="total"]');
  const timeInputElems = du.find.all('input[type="time"]');

  let allValid = true;
  allValid &&= indicateError(zipCodeElem, zipCodeElem.value === '' || zipCodeElem.value.trim().match(/[0-9]{5}/))

  if (allValid) {
    const user = {schedualedReports: {new : [], remove: []}};
    user.accountId = du.find('input[name="account-id"]').value;
    user.zipCode = zipCodeElem.value;
    user.timeZone = timeZoneElem.value;
    user.planName = radioElem.value;
    user.years = Number.parseInt(yearsElem.value);
    const removedReportElems = du.find.all('.orig-reports[style="text-decoration: line-through;"]');
    user.schedualedReports.remove = Array.from(removedReportElems).map((elem) => elem.id);
    for (let index = 0; index < timeInputElems.length; index += 1) {
      const timeInput = timeInputElems[index];
      const time = timeInput.value;
      if (time) {
        const dayElems = du.find.downAll('[sending="true"]', du.find.closest('.days', timeInput));
        const dayIndexes = dayElems.map((elem) => elem.getAttribute('day-index'));

        const type = du.find.down('[sending="true"]', du.find.closest('.types', timeInput)).innerText;
        user.schedualedReports.new.push({type, dayIndexes, time});
      }
    }
    return user;
  }
}

function submit() {
  console.log(buildUser())
}

du.on.match('change', 'input[name="years"]', calculateTotal);
du.on.match('click', 'input[name="plan"]', calculateTotal);
du.on.match('click', '.days > *', strikeToggle);
du.on.match('click', '.orig-reports', strikeToggle);
du.on.match('click', '.types > *', strikeRadio);

if (!IS_ADMIN)
  du.on.match('click', 'button', submit);

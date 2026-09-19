export const navigationLanguages = [
  { code: 'en', label: 'English', voiceTag: 'en-ZA' },
  { code: 'zu', label: 'isiZulu', voiceTag: 'zu-ZA' },
  { code: 'st', label: 'Sesotho', voiceTag: 'st-ZA' },
  { code: 'tn', label: 'Setswana', voiceTag: 'tn-ZA' },
  { code: 'af', label: 'Afrikaans', voiceTag: 'af-ZA' },
]

const copy = {
  en: {
    floor: (floor) => (floor === 'G' ? 'Ground floor' : `Floor ${floor}`),
    head: (name) => `Head towards ${name}`,
    straight: (name) => `Continue straight towards ${name}`,
    right: (name) => `Turn right towards ${name}`,
    left: (name) => `Turn left towards ${name}`,
    back: (name) => `Turn back towards ${name}`,
    lift: (direction, floor) => `Take the lift ${direction} to ${floor}`,
    stairs: (direction, floor) => `Take the stairs ${direction} to ${floor}`,
    up: 'up',
    down: 'down',
    rerouted: 'Route updated.',
    arrived: (name) => `You have arrived at ${name}.`,
  },

  zu: {
    floor: (floor) => (floor === 'G' ? 'Isitezi esiphansi' : `Isitezi ${floor}`),
    head: (name) => `Qonda ngase ${name}`,
    straight: (name) => `Qhubeka uqonde ngqo ubheke e ${name}`,
    right: (name) => `Jikela kwesokudla ubheke e ${name}`,
    left: (name) => `Jikela kwesobunxele ubheke e ${name}`,
    back: (name) => `Jikela emuva ubheke e ${name}`,
    lift: (direction, floor) => `Thatha ilifti uye ${direction} uye ${floor}`,
    stairs: (direction, floor) =>
      `Sebenzisa izitebhisi uye ${direction} uye ${floor}`,
    up: 'phezulu',
    down: 'phansi',
    rerouted: 'Umzila ubuyekeziwe.',
    arrived: (name) => `Usufikile e ${name}.`,
  },

  st: {
    floor: (floor) =>
      floor === 'G' ? 'Mokatong o ka tlase' : `Mokatong wa ${floor}`,
    head: (name) => `Leba ho ${name}`,
    straight: (name) => `Tsoela pele ka ho otloloha ho ya ${name}`,
    right: (name) => `Fetohela ka ho le letona ho ya ${name}`,
    left: (name) => `Fetohela ka ho le letshehadi ho ya ${name}`,
    back: (name) => `Kgutlela morao ho ya ${name}`,
    lift: (direction, floor) => `Palama lifti ho ${direction} ho ya ${floor}`,
    stairs: (direction, floor) =>
      `Sebedisa ditepisi ho ${direction} ho ya ${floor}`,
    up: 'nyolohela',
    down: 'theohela',
    rerouted: 'Tsela e ntjhafaditswe.',
    arrived: (name) => `O fihlile ho ${name}.`,
  },

  tn: {
    floor: (floor) =>
      floor === 'G' ? 'Bodilo jwa lefatshe' : `Bodilo jwa ${floor}`,
    head: (name) => `Leba kwa ${name}`,
    straight: (name) => `Tswelela o tlhamaletse go ya kwa ${name}`,
    right: (name) => `Fapogela kwa mojeng go ya kwa ${name}`,
    left: (name) => `Fapogela kwa molemeng go ya kwa ${name}`,
    back: (name) => `Boela morago go ya kwa ${name}`,
    lift: (direction, floor) => `Tsaya lifiti o ${direction} go ya kwa ${floor}`,
    stairs: (direction, floor) =>
      `Dirisa ditepisi go ${direction} go ya kwa ${floor}`,
    up: 'tlhatloge',
    down: 'fologe',
    rerouted: 'Tsela e ntšhwafaditswe.',
    arrived: (name) => `O gorogile kwa ${name}.`,
  },

  af: {
    floor: (floor) => (floor === 'G' ? 'Grondvloer' : `Vloer ${floor}`),
    head: (name) => `Beweeg in die rigting van ${name}`,
    straight: (name) => `Gaan reguit aan na ${name}`,
    right: (name) => `Draai regs na ${name}`,
    left: (name) => `Draai links na ${name}`,
    back: (name) => `Draai om en beweeg na ${name}`,
    lift: (direction, floor) => `Neem die hysbak ${direction} na ${floor}`,
    stairs: (direction, floor) => `Neem die trappe ${direction} na ${floor}`,
    up: 'op',
    down: 'af',
    rerouted: 'Roete is opgedateer.',
    arrived: (name) => `Jy het by ${name} aangekom.`,
  },
}

export function localizeStep(step, language = 'en') {
  const t = copy[language] ?? copy.en
  const parts = step.sub.split(' · ')
  const targetName = parts[1] ?? ''
  const englishFloor = parts[2] ?? ''

  const targetFloor =
    englishFloor === 'Ground floor'
      ? 'G'
      : englishFloor.replace('Floor ', '')

  const floorChange = step.text.match(
    /^Take the (lift|stairs) (up|down) to /,
  )

  const turn = [
    'Continue straight',
    'Turn right',
    'Turn left',
    'Turn back',
  ].find((value) => step.text.startsWith(value))

  const kind = floorChange
    ? 'floor-change'
    : step.text.startsWith('Head towards')
      ? 'head'
      : 'turn'

  const connection = floorChange?.[1]
  const direction = floorChange?.[2]

  let text = step.text

  if (kind === 'head') {
    text = t.head(targetName)
  }

  if (kind === 'turn') {
    if (turn === 'Continue straight') text = t.straight(targetName)
    if (turn === 'Turn right') text = t.right(targetName)
    if (turn === 'Turn left') text = t.left(targetName)
    if (turn === 'Turn back') text = t.back(targetName)
  }

  if (kind === 'floor-change') {
    text = t[connection](t[direction], t.floor(targetFloor))
  }

  return {
    ...step,
    text,
    sub: `${step.distance} m · ${targetName} · ${t.floor(targetFloor)}`,
    kind,
    direction,
    turn,
  }
}

export function routeUpdatedText(language = 'en') {
  return (copy[language] ?? copy.en).rerouted
}

export function arrivalText(name, language = 'en') {
  return (copy[language] ?? copy.en).arrived(name)
}

export function voiceTagFor(language = 'en') {
  return (
    navigationLanguages.find((item) => item.code === language)?.voiceTag ??
    'en-ZA'
  )
}
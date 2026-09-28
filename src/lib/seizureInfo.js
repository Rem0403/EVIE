// Plain-language seizure guide, adapted from Wikipedia's "Epilepsy" article.
// `short` must fit under the name on a choice button; `full` is shown in the ⓘ guide.
export const SOURCE_URL = 'https://en.wikipedia.org/wiki/Epilepsy';

export const SEIZURE_INFO = {
  'tonic-clonic': {
    short: 'Stiffens, then rhythmic jerking. Not aware.',
    full: [
      'Affects the whole body. They lose consciousness, the body stiffens (the tonic phase), then the arms and legs jerk rhythmically (the clonic phase).',
      'This type carries the highest risk of injury.',
      'A focal seizure can spread to both sides of the brain and become tonic-clonic (called focal to bilateral). If it started in one part of the body, say so in Notes.',
    ],
  },
  focal: {
    short: 'Starts in one area. May stay aware, or stare and fumble.',
    full: [
      'Starts in one area of the brain. It may stay there or spread.',
      'They may stay aware (focal aware), or their awareness may be affected (focal impaired awareness).',
      'There can be repeated movements they aren’t aware of, like lip smacking or picking at things.',
      'It is often preceded by an aura: an unusual smell, sound, sight or feeling.',
    ],
  },
  absence: {
    short: 'Brief blank stare, maybe blinking. Back quickly.',
    full: [
      'A brief lapse in awareness, sometimes with small movements like blinking or a slight head turn.',
      'They come back straight away, without confusion. Absences are easy to miss, so it helps to log each one you notice.',
    ],
  },
  atonic: {
    short: 'Suddenly goes limp. Often falls.',
    full: [
      'A sudden loss of muscle tone. The head may drop, or they may fall.',
      'Falls can cause injuries. Note any in Notes.',
    ],
  },
  unknown: {
    short: 'Not sure what type. That’s OK.',
    full: [
      'Choose this if you aren’t sure. A video clip and a description of what you saw help the doctor work it out.',
    ],
  },
};

export const AFTER_SEIZURE =
  'Afterwards there is usually a recovery period (the postictal state): confusion, headache, tiredness, or trouble speaking or moving. It can last from minutes to days.';

export const EMERGENCY =
  'Call emergency services if a seizure lasts longer than 5 minutes, or if seizures keep coming without full recovery in between.';

export const FIRST_AID = [
  'Stay calm and move anything they could hit.',
  'If they are standing, gently guide them to the ground.',
  'Roll them onto their side (the recovery position) to keep the airway clear.',
  'Don’t hold them down, and don’t put anything in their mouth.',
  'Time the seizure. A video helps the doctor.',
];

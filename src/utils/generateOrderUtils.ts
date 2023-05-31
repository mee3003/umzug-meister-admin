import { Address, Category, Customer, Furniture, JFAnswer, Order, OrderService } from 'um-types';

const SCHRAENKE = 'Schränke aufhängen / Stk.';
const LAMPEN = 'Lampe & Lüster, De/Montage / Stk.';
const KUECHE = 'Küchenabbau / Lfm.';
const KLAVIER = 'Klavier';

interface SperrigSchwer {
  Bezeichnung: string;
  Breite: string;
  Höhe: string;
  Tiefe: string;
  Gewicht: string;
}

interface Weitere extends SperrigSchwer {
  Anzahl: string;
}

interface ConvertedJFEntry {
  name: string;
  id: string;
  email: string;
  orderId: string;
  createdAt: string;
  answers: JFAnswer[];
}

interface DateAnswer {
  day: string;
  year: string;
  month: string;
}

export function convertData(data: any[]): ConvertedJFEntry[] {
  return data.map((d) => {
    const answers = generateAnswersArray(d.answers);
    const name = findAnswer('name', answers);

    let newEntry: ConvertedJFEntry = {
      id: String(d.id),
      answers,
      createdAt: d.created_at,
      email: findAnswer('email7', answers),
      orderId: findAnswer('typeA', answers),
      name: `${name?.prefix} ${name?.first} ${name?.last}`,
    } as ConvertedJFEntry;

    return newEntry;
  });
}

export const generateOrder = (
  param: JFAnswer[],
  allServices: OrderService[],
  allItems: Furniture[],
  cats: Category[],
): Order => {
  const moebelStart = Number(param.find((p) => p.name === 'moebelblock')?.order)!;

  const moebelEnd = Number(param.find((p) => p.name === 'moebelblockEnde')?.order)!;

  let moebelCluster = [...param].filter((a) => Number(a.order) > moebelStart && Number(a.order) < moebelEnd);

  let answers = [...param].filter((a) => Number(a.order) < moebelStart || Number(a.order) > moebelEnd);

  function find(name: string) {
    return findAnswer(name, answers, true);
  }

  const _name = find('name');

  const getCat = (moebel: JFAnswer): string => {
    const slug = moebel.name.replace('-', '_').split('_')[0].toUpperCase();

    if (slug) {
      return slug;
    }
    return 'Allgemein';
  };

  const items = moebelCluster.map((moebel) => {
    let item = {
      name: moebel.text,
      selectedCategory: getCat(moebel),
      colli: moebel.answer,
    } as Furniture;
    return item;
  });

  let services = new Array<OrderService>();
  try {
    const verpackung = find('verpackung');
    let allVerpackung: any[] = [];
    Object.getOwnPropertyNames(verpackung).forEach((prop) => {
      allVerpackung.push(JSON.parse(verpackung[prop]));
    });
    const selected: Array<{ name: string; quantity: number }> = allVerpackung.filter((elem) => elem.quantity > 0);

    selected.forEach((item) => {
      const serv = allServices.find((s) => s.name === item.name);
      if (serv) {
        services.push({ ...serv, colli: String(item.quantity) });
      }
    });
  } catch (e) {
    console.log(e);
  }

  const customer = {
    emailCopy: find('email7'),
    telNumber: find('typeA255'),
    firstName: _name?.first || '',
    lastName: _name?.last || '',
    salutation: _name?.prefix,
  } as Customer;

  const address = (s: string, plz: string, ort: string) => {
    return (find(s) || '')
      .concat(', ')
      .concat(find(plz) || '')
      .concat(' ')
      .concat(find(ort) || '');
  };

  const from_a = address('strasseNr', 'plz', 'typeA263');

  const to_a = address('strasseNr218', 'plz221', 'typeA265');
  const demontage = find('mobelabbau') === 'Ja';
  const montage = find('mobelaufbau') === 'Ja';

  const from = {
    address: from_a,
    floor: find('stockwerk'),
    liftType: find('fahrstuhlgroe'),
    area: find('wohnflache')?.concat(' m²'),
    hasLoft: find('dachboden') === 'Ja',
    roomsNumber: find('anzahlDer267'),
    runningDistance: find('entfernungZwischen15')?.concat(' m.'),
    movementObject: find('wohnungstyp'),
    parkingSlot: find('parkUnd28') === 'vom Spediteur zu organisieren',
    packservice: find('umzugsgutIn') === 'Ja',
    isAltbau: find('altbauAuszug') === 'Ja',
    demontage,
    stockwerke: find('name339'),
  } as Address;

  const to = {
    address: to_a,
    floor: find('stockwerk283'),
    liftType: find('fahrstuhlgroe246'),
    movementObject: find('wohnungstyp248'),
    runningDistance: find('entfernungVom')?.concat(' m.'),
    hasLoft: find('dachboden236'),
    parkingSlot: find('parkUnd37') === 'vom Spediteur zu organisieren',
    packservice: find('umzugsgutAuspacken') === 'Ja',
    isAltbau: find('altbauEinzug') === 'Ja',
    stockwerke: find('name340'),
    montage,
  } as Address;

  const volume = (find('umzugsvolumen') || '').replace(',', '.');
  const images = find('bilderHochladen');

  const order: Order = {
    date: dateAnswerToString(find('auszugsdatumFix')),
    date_from: dateAnswerToString(find('von')),
    date_to: dateAnswerToString(find('bis')),
    images,
    customer,
    from,
    to,
    items,
    rid: find('typeA'),
    boxNumber: find('umzugskartons276'),
    volume,
    services,
    text: find('anmerkung') || '',
    expensive: find('antikeOder323') === 'Ja',
    expensiveText: find('antikeUnd'),
    src: 'individuelle',
    time: '07:00',
  } as Order;

  const formText = () => {
    [
      ['garage24', 'Garage umziehen!'],
      ['keller', 'Keller umziehen!'],
      ['kostenubernahmeVom', 'Kostenübernahme von Arbeitsamt'],
      ['kucheaufbau', 'Küchen-Aufbau'],
    ].forEach((v) => {
      if (find(v[0]) === 'Ja') {
        order.text = order.text.concat(`\n${v[1]}`);
        if (v.length === 3) {
          const laenge = find(v[2]);
          order.text = order.text.concat(`\n${laenge} Meter`);
        }
      }
    });
  };

  formText();

  const addVolume = (v: number) => {
    const oldV = Number(order.volume);

    const newV = oldV + v;

    order.volume = newV.toFixed(2);
  };

  const hasSperrig = find('sperrigeNicht41') === 'Ja';
  if (hasSperrig) {
    try {
      const sperrige = JSON.parse(find('sperrigeGegenstande')) as SperrigSchwer[];

      sperrige.forEach((s) => {
        const _item = itemFromSperrigScwer(s, true, false);
        addVolume(_item.volume || 0);
        order.items.push(_item);
      });
    } catch (e) {
      console.log(e);
    }
  }

  const hasSchwere = find('besondersSchwere') === 'Ja';

  if (hasSchwere) {
    try {
      const schwere = JSON.parse(find('auflistungDer')) as SperrigSchwer[];
      console.log(schwere);

      schwere.forEach((elem) => {
        const _item = itemFromSperrigScwer(elem, false, true);
        addVolume(_item.volume || 0);
        order.items.push(_item);
      });
    } catch (e) {
      console.log(e);
    }
  }
  const weitere = find('weitereMobel');

  if (weitere) {
    try {
      const _weitere = JSON.parse(weitere) as Weitere[];

      _weitere.forEach((element) => {
        order.items.push(itemFromWeitere(element));
      });
    } catch (e) {
      console.log(e);
    }
  }

  const kleiderboxen = find('kleiderbox60');
  if (kleiderboxen && kleiderboxen !== '0') {
    order.items.push({
      selectedCategory: 'WEITERE',
      colli: kleiderboxen,
      name: 'Kleiderbox',
    } as Furniture);
  }

  const lampenAnzahl = find('anzahlDer242');
  if (lampenAnzahl && lampenAnzahl !== 0) {
    const lampenService = allServices.find((s) => s.name === LAMPEN);

    if (lampenService) {
      order.services.push({ ...lampenService, colli: lampenAnzahl });
    } else {
      alert('Lampen service id muss aktualisiert werden');
    }
  }

  const schraenkeAnzahl = find('anzahlDer244');
  if (schraenkeAnzahl && schraenkeAnzahl !== 0) {
    const schraenkeService = allServices.find((s) => s.name === SCHRAENKE);

    if (schraenkeService) {
      order.services.push({ ...schraenkeService, colli: schraenkeAnzahl });
    } else {
      alert('Schränke service id muss aktualisiert werden');
    }
  }

  const kuecheDemontage = find('kucheabbau') === 'Ja';
  if (kuecheDemontage) {
    const kuechenLange = find('bitteKuchenlange');

    const kuehenServ = allServices.find((s) => s.name === KUECHE);

    if (kuehenServ) {
      order.services.push({ ...kuehenServ, colli: kuechenLange || '0' });
    } else {
      alert('Kuechenservice muss aktualisiert werden');
    }
  }

  const hasKlavier = find('schwertransportklavier') === 'Ja';

  if (hasKlavier) {
    const klavierItem = allItems.find((i) => i.name === KLAVIER);
    if (klavierItem) {
      order.items.push({
        ...klavierItem,
        colli: '1',
        selectedCategory: 'Sperrige/Schwere',
      });
    } else {
      alert('Klavier gegenstand muss aktualisiert werden');
    }
  }

  // remove garbage
  ['mochtenSie', 'typeA253', 'bohrarbeiten', 'lampenAnbringen', 'schrankeAufhangen'].forEach(find);

  if (answers.length) {
    console.log(answers);
  }
  return order;
};

function generateAnswersArray(answers: JFAnswer[]) {
  return Object.values(answers)
    .filter((a) => a.answer)
    .sort((a1: JFAnswer, a2: JFAnswer) => a1.order - a2.order);
}

function dateAnswerToString(da?: DateAnswer): string | undefined {
  if (da) {
    return `${da.day}.${da.month}.${da.year}`;
  } else {
    return undefined;
  }
}

function findAnswer(name: string, answers: JFAnswer[], remove = false) {
  let value: any = undefined;
  const index = answers.findIndex((a) => a.name === name);
  if (index !== -1) {
    value = answers[index].answer;
    remove && answers.splice(index, 1);
  }
  return value;
}

function calculateVolume(entry: SperrigSchwer | Weitere): number {
  const volume = (Number(entry.Breite) * Number(entry.Höhe) * Number(entry.Tiefe)) / 10e5;
  return volume;
}

function itemFromWeitere(w: Weitere): Furniture {
  return {
    selectedCategory: 'WEITERE',
    colli: w.Anzahl,
    volume: calculateVolume(w),
    name: w.Bezeichnung.replaceAll('&', 'und'),
  } as Furniture;
}

function itemFromSperrigScwer(s: SperrigSchwer, bulky: boolean, m100: boolean): Furniture {
  return {
    selectedCategory: 'Sperrige/Schwere',
    colli: '1',
    bulky,
    m100,
    volume: 0,
    name: `${s.Bezeichnung.replaceAll('&', 'und')} (${s.Breite}  x ${s.Tiefe} x ${s.Höhe} cm)`,
    weight: s.Gewicht || '',
  } as Furniture;
}
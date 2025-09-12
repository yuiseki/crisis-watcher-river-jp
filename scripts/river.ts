import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import prefList from '../data/k.river.go.jp/pref.json';
import cityList from '../data/k.river.go.jp/twn.json';

const crawl = async () => {
  const allLevels: any[] = [];
  for (const pref of prefList.prefs) {
    // eslint-disable-next-line no-console
    console.log(pref.name + ': ' + pref.code);
    if (!pref.code) continue;

    const url =
      'https://k.river.go.jp/swin/files/area_info/current/' +
      pref.code +
      '.json';
    const json = await fetchJsonWithRetry(url, 2, 500);
    if (!json) {
      // eslint-disable-next-line no-console
      console.warn(`skip ${pref.code} due to fetch errors`);
      continue;
    }
    const riverLevels = await convertJson(json);
    allLevels.push(...riverLevels);
  }

  const { dir, hourPath, generatedAt } = buildHourlyDirPathJST();
  await fs.mkdir(dir, { recursive: true });
  const floodCount = allLevels.filter((x) => x.isFlood).length;
  const warningCount = allLevels.filter((x) => x.isWarning).length;
  const output = {
    generatedAt,
    timeZone: 'Asia/Tokyo',
    hourPath,
    source:
      'https://k.river.go.jp/swin/files/area_info/current/{prefCode}.json',
    totalItems: allLevels.length,
    floodCount,
    warningCount,
    items: allLevels,
  };
  const filepath = path.join(dir, 'index.json');
  await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`wrote: ${filepath} (${floodCount} flood items)`);

  // Also update latest.json with the same content
  const latestPath = path.join(process.cwd(), 'public', 'data', 'latest.json');
  await fs.mkdir(path.dirname(latestPath), { recursive: true });
  await fs.writeFile(latestPath, JSON.stringify(output, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`updated latest: ${latestPath}`);
};

const convertJson = async (json: any) => {
  const riverLevels = [];
  for (const riverLevel of json.obss) {
    riverLevel.observedAt = new Date(Date.parse(riverLevel.obsTime));
    riverLevel.placeCountry = '日本';
    riverLevel.placeRiver = riverLevel.name;
    for (const pref of prefList.prefs) {
      if (riverLevel.prefCode === pref.code) {
        riverLevel.placePref = pref.name;
      }
    }
    for (const city of cityList.towns) {
      const tCode = riverLevel.twnCode ?? riverLevel.townCode;
      if (tCode === city.code) {
        riverLevel.placeCity = city.name;
      }
    }
    const toNum = (v: unknown): number =>
      typeof v === 'number' ? v : v == null ? NaN : Number(v);
    const lvl = toNum(riverLevel.level);
    const warn = toNum(riverLevel.warnLevel);
    const flad = toNum(riverLevel.fladLevel);
    riverLevel.isWarning = !Number.isNaN(lvl) && !Number.isNaN(warn) && lvl >= warn;
    riverLevel.isFlood = !Number.isNaN(lvl) && !Number.isNaN(flad) && lvl >= flad;
    riverLevel.latitude = riverLevel.lat;
    delete riverLevel.lat;
    riverLevel.longitude = riverLevel.lon;
    delete riverLevel.lon;
    riverLevels.push(riverLevel);
  }
  return riverLevels;
};

const buildHourlyDirPathJST = () => {
  const nowUtc = new Date();
  // JST is UTC+9 (no DST)
  const jst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = String(jst.getUTCFullYear());
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const hourPath = `${yyyy}/${mm}/${dd}/${hh}`;
  const dir = path.join(process.cwd(), 'public', 'data', yyyy, mm, dd, hh);
  return { dir, hourPath, generatedAt: nowUtc.toISOString() };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchJsonWithRetry = async (
  url: string,
  retries = 2,
  backoffMs = 500
) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) {
        // eslint-disable-next-line no-console
        console.warn(`fetch error (${url}):`, (e as Error).message);
        return null;
      }
      await sleep(backoffMs * Math.pow(2, i));
    }
  }
  return null;
};

(async () => {
  await crawl();
})();

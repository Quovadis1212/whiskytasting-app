// src/routes/tastings.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Tasting from '../models/Tasting.js';
import { generateJoinCode } from '../utils/joinCode.js';


const router = Router();
const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
const verify = (token) => jwt.verify(token, process.env.JWT_SECRET);

// --- Helpers ---------------------------------------------------------------

// Normalisiert Mongoose-Map / native Map zu Plain Object
function mapToObj(m) {
  if (!m) return {};
  if (typeof m?.entries === 'function' || m instanceof Map) {
    return Object.fromEntries(m);
  }
  return m; // bereits Plain Object
}

// Middleware: optional Orga-Auth (setzt req.isOrga)
function orgaAuthOptional(req, _res, next) {
  req.isOrga = false;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.substring(7);
    try {
      const data = verify(token);
      if (data?.role === 'orga' && data?.tid) {
        // Wenn die Route eine :id hat, prüfen wir, ob Token zur gleichen Tasting-ID gehört
        req.isOrga = (!req.params?.id || data.tid === req.params.id);
      }
    } catch { /* ignore */ }
  }
  next();
}

// Middleware: Orga required (Token muss zu :id passen)
function orgaRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'auth required' });
  try {
    const data = verify(auth.substring(7));
    if (data?.role === 'orga' && data?.tid === req.params.id) return next();
  } catch {}
  return res.status(401).json({ error: 'invalid token' });
}

// --- Routes ----------------------------------------------------------------

// Create tasting
router.post('/', async (req, res) => {
  try {
    const { title, host, organizerPin, drams } = req.body;
    if (!organizerPin) return res.status(400).json({ error: 'organizerPin required' });

    const organizerPinHash = await bcrypt.hash(String(organizerPin), 10);

    // sichere Generierung eines einzigartigen Codes
    let joinCode;
    do {
      joinCode = generateJoinCode();
    } while (await Tasting.exists({ joinCode }));

    const t = await Tasting.create({
      title: title || 'Blind Tasting',
      host: host || '',
      organizerPinHash,
      drams: (drams || []).map(d => ({
        order: Number(d.order),
        name: String(d.name ?? ''),
        broughtBy: String(d.broughtBy ?? '')
      })),
      joinCode
    });

    const token = sign({ role: 'orga', tid: String(t._id) });
    res.status(201).json({ id: String(t._id), joinCode, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Orga-Login (PIN -> Token)
router.post('/:id/login', async (req, res) => {
  try {
    const t = await Tasting.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'not found' });
    const ok = await bcrypt.compare(String(req.body.organizerPin || ''), t.organizerPinHash);
    if (!ok) return res.status(401).json({ error: 'invalid pin' });
    const token = sign({ role: 'orga', tid: String(t._id) });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get tasting (Blindmodus beachtet)
// Get tasting (Blindmodus beachtet) — mit joinCode-Backfill
router.get('/:id', orgaAuthOptional, async (req, res) => {
  try {
    let t = await Tasting.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'not found' });

    // joinCode sicherstellen (Backfill für alte Tastings)
    if (!t.joinCode) {
        let code;
        do { code = generateJoinCode(); } while (await Tasting.exists({ joinCode: code }));
        t.joinCode = code;
        await t.save();
        t = await Tasting.findById(req.params.id).lean();
    } else {
        t = t.toObject();
    }

    const isOrgaForThis = req.isOrga;
    res.json({
      id: String(t._id),
      joinCode: t.joinCode || "",
      title: t.title,
      host: t.host,
      released: t.released,
      drams: (t.drams || []).map(d => {
        if (!t.released && !isOrgaForThis) return { order: d.order, name: '', broughtBy: '' };
        return { order: d.order, name: d.name || '', broughtBy: d.broughtBy || '' };
      })
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Submit/update rating (participant -> per-dram rating map)
router.post('/:id/ratings', async (req, res) => {
  try {
    const { participant, ratings } = req.body; // ratings: { [order]: {points, notes, aromas} }
    if (!participant || typeof ratings !== 'object' || ratings === null) {
      return res.status(400).json({ error: 'bad payload' });
    }

    const t = await Tasting.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'not found' });

    const current = t.ratings.get(participant) || new Map();
    // merge
    Object.entries(ratings).forEach(([order, r]) => {
      current.set(String(order), {
        points: Math.max(0, Math.min(100, Number(r?.points ?? 50))),
        notes: String(r?.notes ?? ''),
        aromas: Array.isArray(r?.aromas) ? r.aromas.map(String) : []
      });
    });
    t.ratings.set(participant, current);
    await t.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tastings/code/:code
router.get('/code/:code', orgaAuthOptional, async (req, res) => {
  try {
    const t = await Tasting.findOne({ joinCode: req.params.code }).lean();
    if (!t) return res.status(404).json({ error: 'not found' });

    const showResolution = t.released || req.isOrga;
    res.json({
      id: String(t._id),
      joinCode: t.joinCode,
      title: t.title,
      host: t.host,
      released: t.released,
      drams: (t.drams || []).map(d => ({
        order: d.order,
        name: showResolution ? d.name : '',
        broughtBy: showResolution ? d.broughtBy : ''
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Leaderboard: Ø-Rang, Namen nur falls freigegeben/Orga
router.get('/:id/leaderboard', orgaAuthOptional, async (req, res) => {
  try {
    const t = await Tasting.findById(req.params.id).lean();
    if (!t) return res.status(404).json({ error: 'not found' });

    // ratings robust zu Plain Objects normalisieren
    const ratingsRoot = mapToObj(t.ratings);

    // Aggregate Ø-Rang
    const agg = {}; // order -> {sum, count}
    for (const per of Object.values(ratingsRoot)) {
      const perObj = mapToObj(per);

      const entries = Object.entries(perObj)
        .filter(([, r]) => r && Number.isFinite(Number(r.points)))
        .map(([order, r]) => ({ order: Number(order), points: Number(r.points) }))
        .sort((a, b) => b.points - a.points);

      // Average rank bei ties
      let i = 0;
      const ranks = {};
      while (i < entries.length) {
        const start = i;
        const p = entries[i].points;
        while (i < entries.length && entries[i].points === p) i++;
        const end = i - 1;
        const avgRank = (start + 1 + (end + 1)) / 2;
        for (let k = start; k <= end; k++) {
          ranks[entries[k].order] = avgRank;
        }
      }

      for (const [orderStr, rank] of Object.entries(ranks)) {
        const o = Number(orderStr);
        (agg[o] ||= { sum: 0, count: 0 });
        agg[o].sum += rank;
        agg[o].count += 1;
      }
    }

    const showResolution = t.released || req.isOrga;

    const rows = (t.drams || []).map(d => {
      const a = agg[d.order] || { sum: 0, count: 0 };
      const avgRank = a.count ? a.sum / a.count : null;
      return {
        order: d.order,
        name: showResolution ? (d.name || '') : '',
        broughtBy: showResolution ? (d.broughtBy || '') : '',
        avgRank,
        count: a.count
      };
    }).sort((x, y) => {
      if (x.avgRank === null && y.avgRank === null) return x.order - y.order;
      if (x.avgRank === null) return 1;
      if (y.avgRank === null) return -1;
      if (x.avgRank !== y.avgRank) return x.avgRank - y.avgRank; // kleiner = besser
      if (y.count !== x.count) return y.count - x.count;
      return x.order - y.order;
    });

    res.json({ released: t.released, rows });
  } catch (e) {
    console.error('leaderboard error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Orga: toggle released
router.post('/:id/released', orgaRequired, async (req, res) => {
  try {
    const t = await Tasting.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'not found' });
    t.released = Boolean(req.body.released);
    await t.save();
    res.json({ released: t.released });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Orga: update setup (title/host/drams, pin)
router.put('/:id', orgaRequired, async (req, res) => {
  try {
    const t = await Tasting.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'not found' });

    const { title, host, drams, organizerPin } = req.body;
    if (title !== undefined) t.title = String(title);
    if (host !== undefined) t.host = String(host);
    if (Array.isArray(drams)) {
      t.drams = drams.map(d => ({
        order: Number(d.order),
        name: String(d.name ?? ''),
        broughtBy: String(d.broughtBy ?? '')
      })).sort((a,b)=>a.order-b.order);
    }
    if (organizerPin) t.organizerPinHash = await bcrypt.hash(String(organizerPin), 10);

    await t.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

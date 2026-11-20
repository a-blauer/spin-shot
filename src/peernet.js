// Account-free multiplayer transport for the standalone (GitHub Pages) build: WebRTC data channels through PeerJS,
// using its free public broker only to introduce players. It presents the same small interface as the Claude
// artifact `room` capability (join / emit / on / presence / peers / onPeers / leave) so net.js does not care which
// one it is talking to. Star topology: the host's peer id is derived from the lobby code and it relays for everyone.
import { Peer } from 'peerjs';

const PREFIX = 'polyshot-v1-';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

function makeRoom(name, asHost) {
  const Ctor = window.__PeerCtor || Peer;
  return new Promise((resolve, reject) => {
    const hostId = PREFIX + name, peer = asHost ? new Ctor(hostId, { config: ICE }) : new Ctor({ config: ICE });
    const handlers = {}, peerFns = [], others = new Map(), conns = new Map();   // others: id -> presence; conns (host): id -> connection
    let me = '', pres = {}, hostConn = null, settled = false, closed = false;
    const fire = () => { for (const f of peerFns) try { f({ peers: room.peers() }); } catch (e) { /* listener */ } };
    const deliver = (topic, data, from) => { for (const f of handlers[topic] || []) try { f({ topic, data, peer: from, isMe: false, sameTab: false, kind: 'viewer', guest: false, by: null }); } catch (e) { /* handler */ } };
    const sendTo = (c, m) => { try { if (c && c.open) c.send(m); } catch (e) { /* dropped */ } };
    const broadcast = (m, except) => { for (const [id, c] of conns) if (id !== except) sendTo(c, m); };
    const fail = (err) => { if (!settled) { settled = true; try { peer.destroy(); } catch (e) { /* gone */ } reject(err); } };
    const room = {
      name, get me() { return me; },
      emit: async (topic, data) => { const m = { t: 'ev', topic, data, peer: me }; if (asHost) broadcast(m); else sendTo(hostConn, m); },
      on: (topic, f) => { (handlers[topic] = handlers[topic] || []).push(f); return () => { handlers[topic] = (handlers[topic] || []).filter((x) => x !== f); }; },
      presence: async (patch) => { pres = Object.assign({}, pres); for (const k in patch) { if (patch[k] === null) delete pres[k]; else pres[k] = patch[k]; } const m = { t: 'pres', peer: me, p: pres }; if (asHost) broadcast(m); else sendTo(hostConn, m); },
      peers: () => [{ peer: me, isMe: true, sameTab: true, presence: pres }, ...[...others].map(([id, p]) => ({ peer: id, isMe: false, sameTab: false, presence: p }))],
      onPeers: (f) => { peerFns.push(f); setTimeout(fire, 0); return () => { const i = peerFns.indexOf(f); if (i >= 0) peerFns.splice(i, 1); }; },
      connected: () => !closed,
      leave: async () => { closed = true; try { peer.destroy(); } catch (e) { /* gone */ } },
    };
    const drop = (id) => { if (others.delete(id)) fire(); conns.delete(id); if (asHost) broadcast({ t: 'bye', peer: id }); };
    const onData = (from, m) => {
      if (!m || typeof m !== 'object') return;
      if (asHost) {   // never trust the sender's own idea of who it is
        if (m.t === 'ev' && typeof m.topic === 'string') { deliver(m.topic, m.data, from); broadcast({ t: 'ev', topic: m.topic, data: m.data, peer: from }, from); }
        else if (m.t === 'pres' && m.p && typeof m.p === 'object') { others.set(from, m.p); fire(); broadcast({ t: 'pres', peer: from, p: m.p }, from); }
      } else if (typeof m.peer === 'string' && m.peer !== me) {
        if (m.t === 'ev' && typeof m.topic === 'string') deliver(m.topic, m.data, m.peer);
        else if (m.t === 'pres' && m.p && typeof m.p === 'object') { others.set(m.peer, m.p); fire(); }
        else if (m.t === 'bye') { if (others.delete(m.peer)) fire(); }
      }
    };
    peer.on('open', (id) => {
      me = id;
      if (asHost) { settled = true; resolve(room); return; }
      hostConn = peer.connect(hostId, { reliable: true, serialization: 'json' });
      hostConn.on('open', () => { settled = true; resolve(room); });
      hostConn.on('data', (m) => onData(hostId, m));
      hostConn.on('close', () => { others.clear(); fire(); });
      hostConn.on('error', () => fail(new Error('nogame')));
      setTimeout(() => fail(new Error('nogame')), 12000);
    });
    if (asHost) peer.on('connection', (c) => {
      if (conns.size >= 7) { c.on('open', () => c.close()); return; }   // eight players at most
      c.on('open', () => { conns.set(c.peer, c); sendTo(c, { t: 'pres', peer: me, p: pres }); for (const [id, p] of others) sendTo(c, { t: 'pres', peer: id, p }); });
      c.on('data', (m) => onData(c.peer, m));
      c.on('close', () => drop(c.peer)); c.on('error', () => drop(c.peer));
    });
    peer.on('error', (e) => { const t = e && e.type; if (!settled) fail(new Error(t === 'unavailable-id' ? 'taken' : 'nogame')); });
    peer.on('disconnected', () => { if (!closed) try { peer.reconnect(); } catch (e) { /* broker gone; existing links keep working */ } });
  });
}

// lobby-shaped object: join(name, asHost)
export const PeerLobby = { peer: true, join: (name, asHost) => makeRoom(name, !!asHost), peers: () => [], onPeers: () => () => {}, presence: async () => {} };

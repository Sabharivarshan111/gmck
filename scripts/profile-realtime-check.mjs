import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({ entryPoints: ['src/lib/profile-realtime.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { createProfileSubscriptionHub } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
// Model the SDK's shared-name lookup and prohibition on bindings after subscribe.
// Removal deliberately stays pending, as it can during React StrictMode remounts.
const channels = new Map();
const removals = [];
const client = {
  channel(name) {
    if (channels.has(name)) return channels.get(name);
    const channel = {
      name, subscribed: false, callbacks: [],
      on(type, filter, callback) {
        assert.equal(this.subscribed, false, 'Cannot add bindings after subscribe');
        assert.equal(type, 'postgres_changes');
        this.filter = filter; this.callbacks.push(callback); return this;
      },
      subscribe() { assert.equal(this.subscribed, false); this.subscribed = true; return this; },
      emit(row) { for (const callback of this.callbacks) callback({ new: row }); },
    };
    channels.set(name, channel); return channel;
  },
  removeChannel(channel) {
    return new Promise(resolve => removals.push(() => { channels.delete(channel.name); resolve('ok'); }));
  },
};
const subscribe = createProfileSubscriptionHub(client);
const a = [], b = [], other = [];
const offA = subscribe('alice', row => a.push(row));
const offB = subscribe('alice', row => b.push(row));
assert.equal(channels.size, 1, 'Concurrent consumers share the same subscription');
const initial = [...channels.values()][0];
assert.deepEqual(initial.filter, { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.alice' });
initial.emit({ id: 'alice', year: 'final' });
assert.equal(a.length, 1); assert.equal(b.length, 1);
offA(); offA();
assert.equal(removals.length, 0, 'One unmount must not tear down remaining consumers');
initial.emit({ id: 'alice', year: 'third' });
assert.equal(a.length, 1); assert.equal(b.length, 2);
const offOther = subscribe('bob', row => other.push(row));
const bob = [...channels.values()].find(c => c.filter.filter === 'id=eq.bob');
bob.emit({ id: 'bob' });
assert.equal(other.length, 1); assert.equal(b.length, 2);
offB();
assert.equal(removals.length, 1);
const again = [];
const offAgain = subscribe('alice', row => again.push(row));
const replacement = [...channels.values()].find(c => c !== initial && c.filter.filter === 'id=eq.alice');
assert.ok(replacement, 'A remount while removal is pending gets a fresh channel');
initial.emit({ id: 'alice', year: 'stale' });
assert.equal(again.length, 0);
removals.shift()();
replacement.emit({ id: 'alice', year: 'final' });
assert.equal(again.length, 1);
offAgain(); offOther();
for (const finish of removals.splice(0)) finish();
assert.equal(channels.size, 0, 'Last listeners remove their channels');
console.log('Profile realtime: concurrent consumers, fan-out, partial unmount, account isolation, pending cleanup/remount and final cleanup PASS');

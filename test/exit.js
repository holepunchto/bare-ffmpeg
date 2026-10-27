const test = require('brittle')

// brittle only prints its plan on beforeExit, which a GUI runtime never emits.
test('exit', (t) => t.pass()).then(() => Bare.emit('beforeExit'))

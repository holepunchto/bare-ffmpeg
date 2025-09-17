const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a FilterInOut class', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()
  t.ok(filterInOut)
})

test('it should expose a destroy method', (t) => {
  const filterInOut = new ffmpeg.FilterInOut()

  t.execution(() => {
    filterInOut.destroy()
  })
})

test('it should expose a name getter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(filterInOut.name, undefined)
})

test('it should expose a name setter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  filterInOut.name = 'in'
  t.is(filterInOut.name, 'in')

  filterInOut.name = 'out'
  t.is(filterInOut.name, 'out')
})

test('it should expose a padIdx getter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(typeof filterInOut.padIdx, 'number')
})

test('it should expose a padIdx setter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  filterInOut.padIdx = 1
  t.is(filterInOut.padIdx, 1)
})

test('it should expose a filterContext getter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(filterInOut.filterContext, null)
})

test('it should expose a filterContext setter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()
  const filterContext = new ffmpeg.FilterContext()

  filterInOut.filterContext = filterContext

  t.alike(filterInOut.filterContext, filterContext)
})

test('it should expose a next getter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(filterInOut.next, null)
})

test('it should expose a next setter', (t) => {
  const filterInOut = new ffmpeg.FilterInOut()
  const next = new ffmpeg.FilterInOut()
  next.name = 'in'

  filterInOut.next = next

  t.alike(filterInOut.next, next)
  t.is(filterInOut.next.name, 'in')

  t.teardown(() => {
    // Next is it cleaned via filterInOut as member of the
    // linked list.
    filterInOut.destroy()
  })
})

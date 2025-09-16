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

test('it should expose a name accessor', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(filterInOut.name, undefined)

  filterInOut.name = 'input'
  t.is(filterInOut.name, 'input')

  filterInOut.name = 'output'
  t.is(filterInOut.name, 'output')
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

// Note: should be un-skipped after after exposing avfilter_graph_create_filter API
// Before that FilterContext reamains empty
test.skip('it should expose a filterContext setter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()
  const filterContext = new ffmpeg.FilterContext()

  filterInOut.filterContext = filterContext

  t.ok(filterInOut.filterContext instanceof ffmpeg.FilterContext)
})

test('it should expose a next getter', (t) => {
  using filterInOut = new ffmpeg.FilterInOut()

  t.is(filterInOut.next, null)
})

test('it should expose a next setter', (t) => {
  const filterInOut = new ffmpeg.FilterInOut()
  const next = new ffmpeg.FilterInOut()

  filterInOut.next = next

  t.ok(filterInOut.next instanceof ffmpeg.FilterInOut)
})

var sort = require('../../lib/sort.js')

describe('sort', function () {
  it('should sort stuff by name (letters)', function () {
    var arr = [{name: 'b'}, {name: 'a'}, {name: 'z'}, {name: '0'}]
    var fn = sort.name({order: 'desc'})

    expect(arr.sort(fn)).to.deep.equal([{name: '0'}, {name: 'a'}, {name: 'b'}, {name: 'z'}])
  })

  it('should sort stuff by name (bug #46)', function () {
    var arr = [{name: '02-z'}, {name: '01-a'}, {name: '01-b'}, {name: '03-a'}]
    var fn = sort.name({order: 'desc'})

    expect(arr.sort(fn)).to.deep.equal([{name: '01-a'}, {name: '01-b'}, {name: '02-z'}, {name: '03-a'}])
  })
})

module.exports = {
  username: {
    type: 'string',
    update: false,
    position: 0
  },
  password: {
    type: 'string', 
    update: true,
    position: 1
  },
  home: {
    type: 'string',
    update: true,
    position: 2
  },
  key: {
    type: 'string',
    default: '1',
    update: false,
    position: 3
  },
  admin: {
    type: 'boolean',
    default: '0',
    update: true,
    position: 4
  },
  readonly: {
    type: 'boolean',
    default: '0',
    update: true,
    position: 5
  },
  ignore: {
    type: 'buffer',
    default: '',
    update: true,
    position: 6
  },
  trash: {
    type: 'string',
    default: '',
    update: true,
    position: 7
  },
  archive: {
    type: 'string',
    default: '',
    update: true,
    position: 8
  }
}

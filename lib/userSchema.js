module.exports = {
  username: {
    type: 'string',
    update: false,
    position: 0
  },
  password: {
    type: 'string', 
    position: 1
  },
  home: {
    type: 'string',
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
    default: 0,
    position: 4
  },
  readonly: {
    type: 'boolean',
    default: 0,
    position: 5
  },
  ignore: {
    type: 'buffer',
    default: '',
    position: 6
  },
  trash: {
    type: 'string',
    default: '',
    directory: true,
    position: 7
  },
  archive: {
    type: 'string',
    default: '',
    directory: true,
    position: 8
  },
  upload: {
    type: 'string',
    default: '',
    directory: true,
    position: 9
  }
}

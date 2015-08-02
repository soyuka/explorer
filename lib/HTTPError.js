import ExtendableError from 'es6-error'

class HTTPError extends ExtendableError {

  constructor(message = '', code = 500, redirect = 'back') {

    super(message) 

    this.code = code
    this.redirect = redirect
  }
}

export default HTTPError

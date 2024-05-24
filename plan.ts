const myroute = defineRoute('POST', '/test', {
  middlewares: [
    auth('')
  ]
})
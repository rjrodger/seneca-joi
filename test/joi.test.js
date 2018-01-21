/* Copyright (c) 2016-2017 Richard Rodger and other contributors, MIT License */
'use strict'

var Assert = require('assert')
var Lab = require('lab')
var Seneca = require('seneca')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it

var Joi = require('joi')
var JoiPlugin = require('..')

describe('joi', function() {
  it('happy', function(fin) {
    Seneca({ log: 'silent', legacy: { error_codes: false, validate: false } })
      .use('../joi')
      .add({ a: 1, b: Joi.required() }, function(msg, done) {
        done(null, { c: 3 })
      })
      .act('a:1,b:2', function(err, out) {
        if (err) return fin(err)

        Assert.equal(3, out.c)

        this.act('a:1', function(err) {
          Assert.equal('act_invalid_msg', err.code)
          fin()
        })
      })
  })

  it('custom', function(fin) {
    Seneca({ log: 'silent', legacy: { error_codes: false, validate: false } })
      .use('../joi')
      .add(
        {
          a: 1,
          joi$: function(schema) {
            return schema.keys({ b: Joi.required() })
          }
        },
        function(msg, done) {
          done(null, { c: 3 })
        }
      )
      .act('a:1,b:2', function(err, out) {
        if (err) return fin(err)

        Assert.equal(3, out.c)

        this.act('a:1', function(err) {
          Assert.equal('act_invalid_msg', err.code)
          fin()
        })
      })
  })

  it('edge', function(fin) {
    Seneca({ log: 'silent', legacy: { error_codes: false, validate: false } })
      .use('../joi')
      .add(
        {
          a: 1,
          joi$: 1
        },
        function(msg, done) {
          done(null, { c: 3 })
        }
      )
      .act('a:1,b:2', function(err, out) {
        if (err) return fin(err)

        Assert.equal(3, out.c)
        fin()
      })
  })

  it('defensives', function(fin) {
    var pmeta = JoiPlugin.preload({})
    var actmod = pmeta.extend.action_modifier
    var actmeta = {}
    actmod(actmeta)
    Assert.equal(void 0, actmeta.validate)
    fin()
  })

  it('parambulator-legacy', function(fin) {
    Seneca({ log: 'silent', legacy: { error_codes: false, validate: false } })
      .use('../joi', { legacy: true })
      .add(
        {
          a: 0
        },
        function(msg, done) {
          done(null, { c: 0 })
        }
      )
      .add(
        {
          a: 1,
          b: { required$: true }
        },
        function(msg, done) {
          done(null, { c: 1 })
        }
      )
      .add(
        {
          a: 2,
          b: { d: { string$: true } }
        },
        function(msg, done) {
          done(null, { c: 2 })
        }
      )
      .add(
        {
          a: 3,
          b: { e: 'required$' }
        },
        function(msg, done) {
          done(null, { c: 3 })
        }
      )
      .act('a:0', function(err, out) {
        if (err) return fin(err)
        Assert.equal(0, out.c)

        this.act('a:1,x:1', function(err, out) {
          if (err) return fin(err)
          Assert.equal(1, out.c)

          this.act('a:2,b:1', function(err, out) {
            if (err) return fin(err)
            Assert.equal(2, out.c)

            this.act('a:3,b:1', function(err, out) {
              if (err) return fin(err)
              Assert.equal(3, out.c)

              legacy_false()
            })
          })
        })
      })

    function legacy_false() {
      Seneca({ log: 'silent', legacy: { error_codes: false, validate: false } })
        .use('../joi', { legacy: false })
        .add(
          {
            a: 0
          },
          function(msg, done) {
            done(null, { c: 0 })
          }
        )
        .add(
          {
            a: 1,
            b: { c: 2 }
          },
          function(msg, done) {
            done(null, { c: 1 })
          }
        )
        .act('a:0,b:1', function(err, out) {
          if (err) return fin(err)
          Assert.equal(0, out.c)

          this.act('a:1,b:{c:2}', function(err, out) {
            if (err) return fin(err)
            Assert.equal(1, out.c)

            this.act('a:1,b:2', function(err) {
              Assert.equal('act_invalid_msg', err.code)
              fin()
            })
          })
        })
    }
  })

  it('is_parambulator', function(fin) {
    Assert.ok(
      JoiPlugin._test$.is_parambulator({
        empty: null,
        use: {},
        config: { object$: true },
        plugin: { string$: true }
      })
    )

    Assert.ok(
      !JoiPlugin._test$.is_parambulator({
        a: {
          b: {
            c: { d: { e: { f: { g: { h: { i: { j: { k: { l: 1 } } } } } } } } }
          }
        }
      })
    )

    fin()
  })

  it('parambulator-legacy test default value seneca > 3.x', function(fin) {
    var si = Seneca({
      log: 'silent',
      legacy: { error_codes: false, validate: false }
    })
    if (si.version < '3.0.0') {
      return fin()
    }

    si.use('../joi')
    si.ready(function() {
      si.add(
        {
          a: 2,
          b: { d: { string$: true } }
        },
        function(msg, done) {
          done(null, { c: 2 })
        }
      )

      si.act('a:2,b:1', function(err) {
        Assert.equal('act_invalid_msg', err.code)

        fin()
      })
    })
  })
})

"use strict"

var _ = require( 'lodash' )
var uuid = require('node-uuid')
var async = require('async')


module.exports = function ( options ) {
  var seneca = this;

  var entities = seneca.export( 'constants/entities' )
  var mite_status = seneca.export( 'constants/mite_status' )

  function get_status( args, done ) {
    var mite = args.mite
    var communication_context = args.communication_context

    done( null, {
      authorization: {
        token: communication_context.auth_token
      },
      command:       {
        type: 'getStatus'
      },
      payload:       {
      }
    } )
  }


  function response_get_status( args, done ) {
    var response = args.response
    var mite = args.mite

    if ( response.err ) {
      return done( null, { response: response, mite: mite } )
    }
    if (response.execution.err){
      return done(null, { err: true, code:response.execution.code, message: response.execution.msg})
    }

    if ( response.payload ) {
      mite.last_connect_time = new Date()
      mite.process_status = mite.process_status || {}
      if (response.payload.os && response.payload.os.length > 0){
        mite.process_status.os = response.payload.os[response.payload.os.length - 1]
      }

      mite.process_status.seneca_stats = response.payload.seneca_stats
      mite.process_status.web_stats = merge_http_api( mite.process_status.web_stats, process_web_stats( response.payload.web_stats ) )

      async.eachLimit(response.payload.os, 10, saveOSStatus, function(){})
    }

    done( null, { response: response, mite: mite } )
  }

  function saveOSStatus(status, done){
    entities.getEntity('os_status', seneca, status ).save$(done)
  }


  function merge_http_api( actual_config, remote_config ) {
    actual_config = actual_config || []
    remote_config = remote_config || []
    actual_config = _.union(actual_config, remote_config)
    actual_config = _.uniq(actual_config, function (n){
      return n.method + '-' + n.url
    })
    return actual_config
  }


  function process_web_stats( web_stats ) {
    var stats = []

    for ( var key in web_stats ) {
      var data = key.split( ';' )
      var obj = {
        method: data[1],
        url:    data[2],
        id:     uuid()
      }
      obj = _.extend( obj, web_stats[key] )
      stats.push( obj )
    }
    return stats
  }


  seneca
    .add( {role: 'protocol_v1', generate: 'get_status'}, get_status )
    .add( {role: 'protocol_v1', process_response: 'get_status'}, response_get_status )
}
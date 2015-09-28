"use strict"

module.exports = function( options ) {
  var seneca = this;
  var name = 'MiteCtrl'

  var entities = seneca.export( 'constants/entities' )


  function createMite( msg, response ) {
    entities.getEntity( 'mite', seneca, msg ).save$( function( err, mite ) {
      if( err ) {
        return response( null, {err: true, msg: err} )
      }

      response( null, {err: false, data: mite.data$( false )} )
    } )
  }


  function list( msg, response ) {
    entities.getEntity( 'mite', seneca ).list$( function( err, mites ) {
      if( err ) {
        return response( null, {err: true, msg: err} )
      }

      if( !mites ) {
        mites = []
      }

      for( var i in mites ) {
        mites[i] = mites[i].data$( false )
      }

      response( null, {err: false, data: mites, count: mites.length} )
    } )
  }


  function load( msg, response ) {
    var mite_id = msg.mite_id
    entities.getEntity( 'mite', seneca ).load$( {id: mite_id}, function( err, mite ) {
      if( err ) {
        return response( null, {err: true, msg: err} )
      }

      mite = mite.data$( false )

      response( null, {err: false, data: mite} )
    } )
  }


  function forceConnect( msg, response ) {
    var mite_id = msg.mite_id

    seneca.act( "role:'mite',cmd:'connect'", {id: mite_id}, function( err ) {
      if( err ) {
        return response( null, {err: true, msg: 'Connect error'} )
      }

      response( null, {err: false} )
    } )
  }


  function startMonitoring( msg, response ) {
    var mite_id = msg.mite_id

    seneca.act( "role:'monitoring',cmd:'start'", {id: mite_id}, function( err, mite ) {
      if( err ) {
        return response( null, {err: true, msg: err} )
      }

      response( null, {err: false, data: mite} )
    } )
  }


  function stopMonitoring( msg, response ) {
    var mite_id = msg.mite_id

    seneca.act( "role:'monitoring',cmd:'stop'", {id: mite_id}, function( err, mite ) {
      if( err ) {
        return response( null, {err: true, msg: err} )
      }

      response( null, {err: false, data: mite} )
    } )
  }


  seneca
    .add( {role: name, cmd: 'createMite'}, createMite )
    .add( {role: name, cmd: 'updateMite'}, createMite )
    .add( {role: name, cmd: 'forceConnect'}, forceConnect )
    .add( {role: name, cmd: 'startMonitoring'}, startMonitoring )
    .add( {role: name, cmd: 'stopMonitoring'}, stopMonitoring )
    .add( {role: name, cmd: 'list'}, list )
    .add( {role: name, cmd: 'load'}, load )


  seneca.act( {role: 'web', use: {
    name: name,
    prefix: '/api/',
    pin: {role: name, cmd: '*'},
    map: {
      createMite:       { POST: true, alias: 'mite'},
      updateMite:       { PUT : true, alias: 'mite'},
      forceConnect:     { POST: true, alias: 'mite/:mite_id/forceConnect'},
      startMonitoring:  { POST: true, alias: 'mite/:mite_id/monitor/start'},
      stopMonitoring:   { POST: true, alias: 'mite/:mite_id/monitor/stop'},
      list:             { GET : true, alias: 'mite'},
      load:             { GET : true, alias: 'mite/:mite_id'}
    }
  }} )
}
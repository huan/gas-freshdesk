if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText())
} // Class GasLog is ready for use now!

var log = new GasLog()

function testFreshdeskAssignTicket() {  


  var MyFreshdesk = new Freshdesk('https://mikebo.freshdesk.com', 'Jrg0FQNzX3tzuHbiFjYQ')
  

  oldTicket = new MyFreshdesk.Ticket(1)
  
  oldTicket.addNote({
    
    helpdesk_note: {
      body: 'Hi tom, Still Angry'
      , private: true
      , attachments: [ 
        {resource: Utilities.newBlob('TEST DATA').setName('test-data.dat')}
        , {resource: Utilities.newBlob('TEST DATA2').setName('test-data2.dat')}
      ]
      
    }
  })
  
  Logger.log(oldTicket.getId())
  
  
  return
  
  // Update  
  oldTicket.setPriority(1)
  oldTicket.setStatus(2)
  oldTicket.setCustomField({'x': 'y'})
  oldTicket.setTag(['tag1', 'tag2'])
  
  
  // Delete
  oldTicket.del()
  oldTicket.restore()
  
  
  oldTicket.addNote({
    body: "Hi tom, Still Angry"
    , private: false
    , attachments: [ [resource] ]
  })
  
  var user = new MyFreshdesk.Contact({
    id: 333
  })
  
  user.setName('xxx')
  user.setTitle('xxx')
  
  
}



var Freshdesk = (function () {
  
  /******************************************
  *
  * Class Freshdesk
  *
  */
  var Freshdesk = function (url, key) {
        
    if (!key || !url) throw Error('options error: key or url not exist!')
    
    var http = new Http(url, key)
    
    
    /**
    * validateAuth: try to listTickets
    * if url & key is not right
    * exception will be throw
    */
    freshdeskListTickets()
    
    
    this.http = http
    
    this.Ticket = freshdeskTicket
    this.Contact = freshdeskContact
    
    this.listTickets = freshdeskListTickets
    
    
    return this
    
    
    /**********************************************************************
    *
    * Freshdesk Instance Methods Implementation
    *
    */
    
    
    /**
    *
    * Method Search Ticket
    *
    * now only return the first one
    *
    * TODO: implement search functions
    *
    */
    function freshdeskListTickets(options) {
      var data = http.get('/helpdesk/tickets/filter/all_tickets?format=json')
      
      return data
    }
    
    
    /**
    *
    * Class Ticket
    *
    */
    function freshdeskTicket (options) {
      
      if ((typeof this) === 'undefined') return new freshdeskTicket(options)
      
      var ticketObj = {}
      
      if ((typeof options) === 'number') { 
        
        /**
        * 1. existing ticket, retried it by ID
        */
        
        id = options
        
        // load #id to ticketObj
        reloadTicket(id)
//        Logger.log('outside reloadTicket')
//        Logger.log(ticketObj)

      } else if ((typeof options) === 'object') { // { x: y } options
        
        /**
        * 2. new ticket. create it.
        */
        
        ticketObj = http.post('/helpdesk/tickets.json', options)
        
      } else {
        // 3. error.
        throw Error('options must be integer or object')        
      } 
      
      this.getId = getTicketId
      this.getResponderId = getResponderId
      this.assign = assignTicket
      this.del = deleteTicket
      this.addNote = addTicketNote
      
      this.getPriority = getTicketPriority
      this.setPriority = setTicketPriority
      
      this.getStatus = getTicketStatus
      this.setStatus = setTicketStatus
      
      this.getRawObj = function () { return ticketObj }
      
      // Update
      //      this.setPriority = setTicketPriority
      //      this.setStatus = setTicketStatus
      //      this.setCustomField = setTicketCustomField
      //      this.setTag = setTicketTag
      
      
      // Delete
      //      this.restore = restoreTicket
      //
      

      return this

      
      function getTicketId() {
        if (ticketObj && ticketObj.helpdesk_ticket && ticketObj.helpdesk_ticket.display_id) {
          return Math.floor(ticketObj.helpdesk_ticket.display_id)
        }
        
        return null
      }
      
      function getResponderId() {
//        Logger.log(ticketObj.helpdesk_ticket.responder_id)

        if (ticketObj && ticketObj.helpdesk_ticket && ticketObj.helpdesk_ticket.responder_id) {
          return String(ticketObj.helpdesk_ticket.responder_id)
        }
        
        return null
      }
      
      function assignTicket(responderId) {
        
        http.put('/helpdesk/tickets/' 
                 + getTicketId()
        + '/assign.json?responder_id=' 
        + responderId
        )
        
        reloadTicket(getTicketId()) // refresh

        return this
      }
      
      function deleteTicket() {
        if ('deleted'==http.del('/helpdesk/tickets/' + getTicketId() + '.json')) {
          reloadTicket(getTicketId()) // refresh
          return true
        }
        return false
      }

      
      /**
      *
      * Reload Ticket Object Raw Data
      *
      */
      function reloadTicket(id) {
        
        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer.')
        
        ticketObj = http.get('/helpdesk/tickets/' + id + '.json')
        
        return this
      }
    
      /**
      *
      * Note a Ticket
      *
      * @tested
      */
      function addTicketNote(data) {
        var retVal = http.post('/helpdesk/tickets/' + getTicketId() + '/conversations/note.json', data)
        if (retVal) {
          reloadTicket(getTicketId())
          return true
        }
        
        return false
      }

      
      function getTicketPriority() { return ticketObj.helpdesk_ticket.priority }
      function setTicketPriority(priority) {
        var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
          helpdesk_ticket: {
            priority: priority
          }
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set priority fail')  
      }

      function getTicketStatus() { return ticketObj.helpdesk_ticket.status }      
      function setTicketStatus(status) {
        var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
          helpdesk_ticket: {
            status: status
          }
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set status fail')  
      }
      
      function setTicketCustomField(customFields) {
        var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
          helpdesk_ticket: {
            custom_field: customFields
          }
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set status fail')          
      }
      
      function setTicketTag(tags) {
        
        throw Error('not implenment yet')
        
        var ticketTags = ticketObj.helpdesk_ticket.tags
        
//          "tags":[
//         {"name": "tag1"},
//         {"name": "tag2"}
//    ]
          
        var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
          helpdesk: {
            tags: ticketTags
          }
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set tags fail')          
      }

      ////////////////////////////////
    }// Seprator of Ticket Instance
    ////////////////////////////////
    
    function freshdeskContact() {
      
    }
  }
  
  
  // export for testing only
  Freshdesk.Http = Http
  
  
  return Freshdesk
  
  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Class Static Methods Implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////
  
  
  /***********************************************************************
  *
  * Http Backend Class for Freshdesk Rest API
  * 
  *
  * options.key
  * options.type
  *
  */
  function Http(url, key) {
    
    if (!url || !key) throw Error('url & key must set!')
    
    var URL = url
    var KEY = key
    var AUTH_HEADER = {
      'Authorization': 'Basic ' + Utilities.base64Encode(KEY + ':X')
    }
    
    return {
      get: get
      , put: put
      , post: post
      , del: del
      
      , httpBackend: httpBackend
      
      , makeMultipartArray: makeMultipartArray
      , makeMultipartBody: makeMultipartBody
      
      , hasAttachment: hasAttachment
      
    }
    
    function get(path) {
      return httpBackend('get', path)
    }
    
    function put(path, data) {
      return httpBackend('put', path, data)
    }
    
    function post(path, data) {
      return httpBackend('post', path, data)
    }
    
    function del(path) {
      return httpBackend('delete', path)
    }
    
    /**
    *
    * HTTP Backend Engine
    *
    */
    function httpBackend(method, path, data) {
      
      var contentType, payload
      
      if (method=='post' && hasAttachment(data)) {
        
        var BOUNDARY = '-----CUTHEREelH7faHNSXWNi72OTh08zH29D28Zhr3Rif3oupOaDrj'
        var multipartArray = makeMultipartArray(data)
        
        contentType = 'multipart/form-data; boundary=' + BOUNDARY
        payload = makeMultipartBody(multipartArray, BOUNDARY)
        
      } else if (data instanceof Object) {
        
        /**
        *
        * When we pass a object as payload to UrlFetchApp.fetch, it will treat object as a key=value form-urlencoded type.
        *
        * If we want to post JSON object via fetch, we must:
        *  1. specify contentType to 'application/json'
        *  2. payload should already be JSON.stringify(ed)
        *
        */
        contentType = 'application/json'
        payload = JSON.stringify(data) 
        
      } else {
        
        contentType = 'application/x-www-form-urlencoded'
        payload = data
        
      }
      
      var options = {
        muteHttpExceptions: true
        , headers: AUTH_HEADER
        , method: method
      }

      switch (method.toLowerCase()) {
        case 'post':
        case 'put':
          options.contentType = contentType
          options.payload = payload
          break
          
        default:
        case 'get':
        case 'delete':
          break
          
      }
        

      if (/^http/.test(path)) {
        var endpoint = path
        } else {
          endpoint = URL + path
        }
      
//      log(log.DEBUG, endpoint)
//      log(log.DEBUG, JSON.stringify(options))
      
      /**
      *
      * UrlFetch fetch API EndPoint
      *
      */
      var response = UrlFetchApp.fetch(endpoint, options)
      
      if (response.getResponseCode() != 200 ) {
        log(log.ERR, response.getContentText().substring(0,1000))
        throw Error('http call failed with code:' + response.getResponseCode())
      }
      
      var ret = response.getContentText()
      
      /**
      * Object in object out
      * String in string out
      */
      switch (true) {
        case /x-www-form-urlencoded/.test(contentType):
          try {
            ret = JSON.parse(ret)
          } catch (e) {
            // it's ok here, just let ret be string.
          }
          
          break;
          
        default:
        case /multipart/.test(contentType):
        case /json/.test(contentType):
          try {
            ret = JSON.parse(ret)
          } catch (e) {
            /**
            * something went wrong here! 
            * because we need: Object in object out
            */
            ret = {
              error: e.message
              , string: ret
            }
          }
          break
      }
      
      if (ret && ret.require_login) throw Error('auth failed to url ' + URL + ' with key ' + KEY)
      
      return ret
      
    }  
    
    /**
    *
    * @param object data
    * @return string a multipart body
    *
    * concat attachments for array helpdesk_ticket[attachments][][resource]
    *
    * @tested
    */
    function makeMultipartBody(multipartArray, boundary) {
      
      var body = Utilities.newBlob('').getBytes()
      
      for (var i in multipartArray) {
        var [k, v] = multipartArray[i]
        
        if (v.toString() == 'Blob'
            || v.toString() == 'GmailAttachment' 
        ) {
          
          // attachment
          body = body.concat(
            Utilities.newBlob(
              '--' + boundary + '\r\n'
              + 'Content-Disposition: form-data; name="' + k + '"; filename="' + v.getName() + '"\r\n'
            + 'Content-Type: ' + v.getContentType() + '\r\n\r\n'
          ).getBytes())
          
          body = body
          .concat(v.getBytes())
          .concat(Utilities.newBlob('\r\n').getBytes())
          
        } else {
          
          // string
          body = body.concat(
            Utilities.newBlob(
              '--'+boundary+'\r\n'
              + 'Content-Disposition: form-data; name="' + k + '"\r\n\r\n'
              + v + '\r\n'
            ).getBytes()
          )
          
        }
        
      }
      
      body = body.concat(Utilities.newBlob('--' + boundary + "--\r\n").getBytes())
      
      return body
      
    }
    
    /**
    *
    * @param object obj 
    *
    * @return Array [ [k,v], ... ]
    * @tested
    */
    function makeMultipartArray(obj) {
      
      var multipartArray = new Array()
      
      for (var k in obj) {
        recursion(k, obj[k])
      }
      
      return multipartArray
      
      
      function recursion(key, value) {
        if ((typeof value)=='object' && !isAttachment(value)) {
          for (var k in value) {
            if (value instanceof Array) {
              
              // recursion for Array
              recursion(key + '[]', value[k])
              
            } else {
              
              // recursion for Object
              recursion(key + '[' + k + ']', value[k])
              
            }
          }
        } else {
          
          // Push result to Array
          multipartArray.push([key, value])
          
        }
      }
      
    }
    
    /**
    *
    * Walk through a object, return true if there has any key named "attachments"
    * @tested
    */
    function hasAttachment(obj) {
     
      if ((typeof obj) != 'object') return false
            
      var hasAtt = false
      
      var keys = Object.keys(obj)

      for (var i=0; i<keys.length; i++) {
        var key = keys[i]
        if (key == 'attachments' || hasAttachment(obj[key])) {
          hasAtt = true
          break
        }
      }
      
      return hasAtt
    }
    
    function isAttachment(v) {
      if (v.toString() == 'Blob' || v.toString() == 'GmailAttachment') {
        return true 
      }
      
      return false
    }
    
  }
  
}())
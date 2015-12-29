var Freshdesk = (function () {
  'use strict'
  /**
  *
  * GasFreshdesk - Freshdesk API Class for Google Apps Script
  *
  * GasFreshdesk is a easy to use Freshdesk API Class for GAS(Google Apps Script)
  * It provides a OO(Object-Oriented) way to use Freshdesk Ticket / Contacts, etc.
  *
  * Github - https://github.com/zixia/gas-freshdesk
  *
  * Example:
  ```javascript
  var MyFreshdesk = new Freshdesk('https://mikebo.freshdesk.com', 'Jrg0FQNzX3tzuHbiFjYQ')
  
  var ticket = new MyFreshdesk.Ticket({
    helpdesk_ticket: {
      description:'A description'
      , subject: 'A subject'
      , email: 'you@example.com'
    }
  })
  
  ticket.assign(9000658396)
  ticket.addNote({
    body: 'Hi tom, Still Angry'
    , private: true
  })
  ticket.setPriority(2)
  ticket.setStatus(2)
  
  ticket.del()
  ticket.restore()
  ```
  */

  /**
  * PolyFill a dummy log function
  * in case of forget get rid of log in library(as developing/debuging)
  */
  if ((typeof log)==='undefined') {
//    Logger.log('log evaled in gas-freshdesk-lib')
    eval('var log = function () {}')
  }
  
  var Freshdesk = function (url, key) {
        
    if (!key || !url) throw Error('options error: key or url not exist!')
    
    var http = new Http(url, key)
    
    
    /**
    * validateAuth: try to listTickets
    * if url & key is not right
    * exception will be thrown
    */
    freshdeskListTickets()
    
    
    this.http = http
    
    this.Ticket = freshdeskTicket
    this.Contact = freshdeskContact
    this.Agent = freshdeskAgent
    
    this.listTickets = freshdeskListTickets
    this.listContacts = freshdeskListContacts
    this.listAgents = freshdeskListAgents
    
    return this
    
    
    /**********************************************************************
    *
    * Freshdesk Instance Methods Implementation
    *
    */
    
    
    /**
    *
    * 1. Method Search Ticket
    *
    * @return array of Tickets of search. null for not found
    * 
    * @param array options
    *   email: email address of requester
    *
    * @document https://freshdesk.com/api#view_all_ticket
    *
    */
    function freshdeskListTickets(options) {
      
      var data
      
      if (options && options.email) { // Requester email
        var email = validateEmail(options.email)
        data = http.get('/helpdesk/tickets.json?email=' + email + '&filter_name=all_tickets')
        
      } else { // Uses the new_and_my_open filter.
        data = http.get('/helpdesk/tickets/filter/all_tickets?format=json')
        
      }
      
      if (!data || !data.length) return null
      
      var tickets = data.map(function (d) { return d.display_id })
      .map(function (i) { return new freshdeskTicket(i) })
      
      return tickets
    }
    
    
    /**
    *
    * 2. Method Search Contact
    *
    * now only return the first one
    * TODO: implement search fun7ctions
    */
    function freshdeskListContacts(options) {
      
      var email = options.email
      
      var data = http.get('/contacts.json?state=all&query=email%20is%20' + email)
      
      if (data && data[0] && data[0].user && data[0].user.id) {
        var id = data[0].user.id
        return new freshdeskContact(id)
      }
      
      return null
    }
    
    /**
    *
    * 3. Method Search Agent
    *
    * now only return the first one
    * TODO: implement search functions
    */
    function freshdeskListAgents(options) {
      
      var email = options.email
      
      var data = http.get('/agents.json?state=all&query=email%20is%20' + email)
//      log(JSON.stringify(data))
      if (data && data[0] && data[0].agent && data[0].agent.id) {
        var id = data[0].agent.id
        return new freshdeskAgent(id)
      }
      
      if (data.access_denied) throw Error('acess denied')
      
      return null
    }

    /******************************************************************
    *
    * Class Ticket
    * ------------
    */
    function freshdeskTicket (options) {
      
      if ((typeof this) === 'undefined') return new freshdeskTicket(options)
      
      var ticketObj = {}
      
      if ((typeof options) === 'number') { 
        
        /**
        * 1. existing ticket, retried it by ID
        */
        
        id = options
        
        reloadTicket(id)

      } else if ((typeof options) === 'object') { // { x: y } options
        
        /**
        * 2. new ticket. create it.
        */
        
        validateHelpdeskObject(options)
        ticketObj = http.post('/helpdesk/tickets.json', options)
        
      } else {
        // 3. error.
        throw Error('options must be integer or object')        
      } 
      
      this.getId = getTicketId
      this.getResponderId = getResponderId
      this.getRequesterId = getRequesterId
      this.assign = assignTicket
      this.note = noteTicket

      this.del = deleteTicket
      this.restore = restoreTicket
      
      this.getPriority = getTicketPriority
      this.setPriority = setTicketPriority
      
      this.getStatus = getTicketStatus
      this.setStatus = setTicketStatus
      
      this.resolv = function () { return setTicketStatus(4) }
      this.close = function () { return setTicketStatus(5) }
      
      this.lowPriority = function () { return setTicketPriority(1) }
      this.mediumPriority = function () { return setTicketPriority(2) }
      this.highPriority = function () { return setTicketPriority(3) }

      this.getRawObj = function () { return ticketObj }
      
      //      this.setCustomField = setTicketCustomField
      //      this.setTag = setTicketTag
      
      
      return this

      ///////////////////////////////////////////////////////////
      
      function getTicketId() {
        if (ticketObj && ticketObj.helpdesk_ticket && ticketObj.helpdesk_ticket.display_id) {
          return ticketObj.helpdesk_ticket.display_id
        }
        
        return null
      }
      
      function getResponderId() {

        if (ticketObj && ticketObj.helpdesk_ticket && ticketObj.helpdesk_ticket.responder_id) {
          return ticketObj.helpdesk_ticket.responder_id
        }
        
        return null
      }

      function getRequesterId() {

        if (ticketObj && ticketObj.helpdesk_ticket && ticketObj.helpdesk_ticket.requester_id) {
          return ticketObj.helpdesk_ticket.requester_id
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
      * @tested
      */
      function restoreTicket(id) {
        
        if (!id) id = getTicketId()
        
        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer')
        
        var ret = http.put('/helpdesk/tickets/' + id + '/restore.json')
        if (ret[0].ticket.deleted === false) {
          reloadTicket(getTicketId()) // refresh
          return this
        }
        
        throw Error('restore fail')       
      }
      
      /**
      *
      * Reload Ticket Object Raw Data
      *
      */
      function reloadTicket(id) {
        
        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer.')
//      log(log.DEBUG, 'loading id:%s', id)
        ticketObj = http.get('/helpdesk/tickets/' + id + '.json')
        
        return this
      }
    
      /**
      *
      * Note a Ticket
      *
      * @tested
      */
      function noteTicket(data) {
        
        validateHelpdeskObject(data)
        
        var retVal = http.post('/helpdesk/tickets/' + getTicketId() + '/conversations/note.json', data)
        if (retVal) {
          reloadTicket(getTicketId())
          return true
        }
        
        return false
      }

      
      /**
      *
      *
      * @tested
      */
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

      /**
      *
      *
      * @tested
      */
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
    
    /***************************************************************************
    *
    * Class Contact
    * -------------
    */
    function freshdeskContact(options) {
      
      if ((typeof this) === 'undefined') return new freshdeskContact(options)
      
      var contactObj = {}
      
      if ((typeof options) === 'number') { 
        
        /**
        * 1. existing contact, get it by ID
        */
        
        id = options
        
        reloadContact(id)

      } else if ((typeof options) === 'object') { // { x: y } options
        
        /**
        * 2. new contact. create it.
        */
        
        contactObj = http.post('/contacts.json', options)
        
      } else {
        // 3. error.
        throw Error('options must be integer or options')        
      } 
      
      this.getId = getContactId

      this.del = deleteContact
            
      this.getName = getContactName
      this.setName = setContactName
      
      this.getEmail = getContactEmail
      
      this.getTitle = getContactTitle
      this.setTitle = setContactTitle
      
      this.getRawObj = function () { return contactObj }

      
      return this

      ////////////////////////////////////////////////////////
      
      function getContactId() {
        if (contactObj && contactObj.user && contactObj.user.id) {
          return contactObj.user.id
        }
        
        return null
      }
      
      function deleteContact() {
        if ('deleted'==http.del('/contacts/' + getContactId() + '.json')) {
          reloadContact(getContactId()) // refresh
          return true
        }
        return false
      }
      
      /**
      *
      * Reload Contact Object Raw Data
      *
      */
      function reloadContact(id) {
        
        if ((typeof id)=='undefined') id = getContactId()
        
        if (id%1 !== 0) throw Error('contact id(' + id + ') must be integer.')
        
        contactObj = http.get('/contacts/' + id + '.json')

        return this
      }
          
      /**
      *
      *
      * @testing
      */
      function getContactName() { 
        return contactObj.user.name 
      }
      function setContactName(name) {
        var retVal = http.put('/contacts/' + getContactId() + '.json', {
          user: {
            name: name
          }
        })
        
        if (retVal) {
          reloadContact()
          return this
        }
        
        throw Error('set name fail')  
      }

      function getContactEmail() {
        return contactObj.user.email
      }
      
      /**
      *
      *
      * @testing
      */
      function getContactTitle() { return contactObj.user.job_title }      
      function setContactTitle(title) {
        var retVal = http.put('/contacts/' + getTicketId() + '.json', {
          user: {
            job_title: title
          }
        })
        
        if (retVal) {
          reloadContact()
          return this
        }
        
        throw Error('set status fail')  
      }
      
      
      ////////////////////////////////
    }// Seprator of Contact Instance
    ////////////////////////////////

    
    /***************************************************************************
    *
    * Class Agent
    * -----------
    */
    function freshdeskAgent(id) {
      
      if ((typeof this) === 'undefined') return new freshdeskAgent(options)
      
      var agentObj = {}
      
      if ((typeof id) === 'number') { 
        
        /**
        * 1. existing agent, get it by ID
        */
               
        // load #id to agentObj
        reloadAgent(id)

      } else {
        // 2. error.
        throw Error('id must be integer')        
      } 
      
      this.getId = getAgentId
      this.getName = getAgentName
      
      this.getRawObj = function () { return agentObj }

      
      return this

      ///////////////////////////////////////////////
      
      function getAgentId() {
        if (agentObj && agentObj.agent && agentObj.agent.id) {
          return agentObj.agent.id
        }
        
        return null
      }

      function getAgentName() { 
        return agentObj.agent.user.name 
      }
      
      /**
      *
      * Reload Agent Object Raw Data
      *
      */
      function reloadAgent(id) {
        
        if ((typeof id)=='undefined') id = getAgentId()
        
        if (id%1 !== 0) throw Error('agent id(' + id + ') must be integer.')
        
        agentObj = http.get('/agents/' + id + '.json')

        return this
      }
      
      ////////////////////////////////
    }// Seprator of Agent Instance
    ////////////////////////////////

  }
  
  
  // export for testing only
  Freshdesk.Http = Http
  Freshdesk.validateHelpdeskObject = validateHelpdeskObject
  Freshdesk.validEmail = validateEmail
  
  return Freshdesk
  
  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Class Static Methods Implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////
  
  
  /***********************************************************************
  *
  * Class Http 
  * ----------
  * Backend Class for Freshdesk Rest API
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
        
//        log(JSON.stringify(multipartArray))
            
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
      
      /**
      *
      * UrlFetch fetch API EndPoint
      *
      */
      
      var TTL = 3
      var response = undefined
      var retCode = undefined

      while (!retCode && TTL--) {
        try {
          response = UrlFetchApp.fetch(endpoint, options)
          retCode = response.getResponseCode()
        } catch (e) {
          log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
//          Logger.log('UrlFetchApp.fetch exception: ' + e.toString())
        }
//        Logger.log('ttl:' + TTL + ', retCode:' + retCode)
      }
      
      if (retCode != 200 ) {
        log('endpoint: ' + endpoint)
        log('options: ' + JSON.stringify(options))
        log(response.getContentText().substring(0,1000))
        throw Error('http call failed with code:' + response.getResponseCode())
      }
      
      var retContent = response.getContentText()
      
      /**
      * Object in object out
      * String in string out
      */
      var retObj
      
      switch (true) {
        case /x-www-form-urlencoded/.test(contentType):
          try {
            retObj = JSON.parse(retContent)
          } catch (e) {
            // it's ok here, just let ret be string.
            retObj = retContent
          }
          
          break;
          
        default:
        case /multipart/.test(contentType):
        case /json/.test(contentType):
          try {
            retObj = JSON.parse(retContent)
          } catch (e) {
            /**
            * something went wrong here! 
            * because we need: Object in object out
            */
            retObj = {
              error: e.message
              , string: retContent
            }
          }
          break
      }
      
      // Freshdesk API will set `require_login` if login failed
      if (retObj && retObj.require_login) throw Error('auth failed to url ' + URL + ' with key ' + KEY)
      
      return retObj
      
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
        
//        log('multipartArray[' + k + ']')
        
        if (v.toString() == 'Blob'
            || v.toString() == 'GmailAttachment' 
        ) {
          
//          log(v.toString())
//          log(v)
//          log(typeof v)
          
//          Object.keys(v).forEach(function (k) {
//            log('v[' + k + ']')
//          })
                                 
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
  
  /**
  *
  * return email if valid
  * throw exception if NOT valid
  *
  */
  function validateEmail(email) {
    var RE=/^[a-z0-9\-_.]+@[a-z0-9\-_.]+$/i
    
    if (RE.test(email)) return email
    
    throw Error('invalid email: [' + email + ']')
  }
  
  function validateHelpdeskObject(obj) {
    if (!obj || (typeof obj!=='object')) throw Error('invalid helpdesk object: it is not object.')
    
    var hasApi = false
    var attachments

    Object.keys(obj).forEach(function (api) {
//      log('api: ' + api)
      switch (api) {
          
        case 'helpdesk_ticket':
          
          var to = obj.helpdesk_ticket.to
          if (to) validateEmail(to)
          
          if (obj.helpdesk_ticket.attachments) attachments = obj.helpdesk_ticket.attachments
          
          hasApi = true
          break;
          
        case 'helpdesk_note':
          
          if (!obj.helpdesk_note.body) throw Error('invalid helpdesk note: no body found!')
          
          if (obj.helpdesk_note.attachments) attachments = obj.helpdesk_note.attachments
          
          hasApi = true
          break;
          
        default:
          break;
      }
    })
    
    if (attachments) {
      if (!(attachments instanceof Array) || !attachments.length || !(attachments[0].resource)) {
        throw Error('invalid help desk object: attachment format error! attachments: ' + attachments)
      }
    }
    
    if (!hasApi) throw Error('invalid help desk object: no valid api params found!')
    
    // unknown treat as ok
    return true
  }
  
}())
var GasFreshdesk = (function () {
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
  var MyFreshdesk = new GasFreshdesk('https://mikebo.freshdesk.com', 'Jrg0FQNzX3tzuHbiFjYQ')
  
  var ticket = new MyFreshdesk.Ticket({
    description:'A description'
    , subject: 'A subject'
    , email: 'you@example.com'
    , attachments: [ Utilities.newBlob('TEST DATA').setName('test-data.dat') ]
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
  *
  * Polyfill a dummy log function
  * in case of forget get rid of log in library(as developing/debuging)\
  *
  */
  try {
    'use strict'
    var throwExceptionIfRightVariableNotExist = log;
  } catch (e) { // not exist
//    Logger.log('Polyfill log: evaled in gas-freshdesk-lib')
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
    validateAuth()
    
    
    this.http = http
    
    this.Ticket = freshdeskTicket
    this.Contact = freshdeskContact
    this.Agent = freshdeskAgent
    
    this.listTickets = freshdeskListTickets
    this.Ticket.list = freshdeskListTickets
    
    this.listContacts = freshdeskListContacts
    this.Contact.list = freshdeskListContacts
    
    this.listAgents = freshdeskListAgents
    this.Agent.list = freshdeskListAgents
    
    return this
    
    
    /**********************************************************************
    *
    * Freshdesk Instance Methods Implementation
    *
    */
    
    
    /**
    *
    * make a http call to api, in order to confirm the auth token is right.
    * @tested
    */
    function validateAuth() {
      // v1: return http.get('/helpdesk/tickets/filter/all_tickets?format=json')
      return http.get('/api/v2/tickets?per_page=1')
    }
    
    /**
    *
    * 1. Method Search Ticket
    *
    * @return {Array} Tickets of search. null for not found
    * 
    * @param {Object} options
    *   email: email address of requester
    *
    * @document https://development.freshdesk.com/api#view_all_ticket
    *
    */
    function freshdeskListTickets(options) {
      
      var data
      
      if (options && options.email) { // Requester email
        var email = validateEmail(options.email)
        data = http.get('/api/v2/tickets?order_by=created_at&order_type=asc&email=' + encodeURIComponent(email))
      } else if (options && options.requester_id) {
        var requesterId = validateInteger(options.requester_id)
        data = http.get('/api/v2/tickets?order_by=created_at&order_type=asc&requester_id=' + requesterId)
      }else { // Uses the new_and_my_open filter.
        data = http.get('/api/v2/tickets')
        
      }
      
      if (!data || !data.length) return []
      
      var tickets = data.map(function (d) { 
        return new freshdeskTicket(d.id)
      })
      
      return tickets
    }
    
    
    /**
    *
    * 2. Method Search Contact
    *
    */
    function freshdeskListContacts(options) {
      
      var email = options.email
      
      var data = http.get('/api/v2/contacts?email=' + encodeURIComponent(email))
      
      if (!data || !data.length) return []

      var contacts = data.map(function (d) { 
        return new freshdeskContact(d.id)
      })
      
      return contacts
    }
    
    /**
    *
    * 3. Method Search Agent
    *
    * @param
    * options.email <String> email of agent
    * 
    * @return
    * <Array> of <Agent>, or null for not found.
    *
    */
    function freshdeskListAgents(options) {
      
      var email = options.email
      
      var data = http.get('/api/v2/agents?email=' + encodeURIComponent(email))

      if (!data || !data.length) return []

      var agents = data.map(function (d) { 
        return new freshdeskAgent(d.id)
      })
      
      return agents
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
    
        if (!options.status) options.status = 2 // Status.Open
        if (!options.priority) options.priority = 1 // Priority.Low
        
        validateHelpdeskObject(options)
        // v1 ticketObj = http.post('/helpdesk/tickets.json', options)
        ticketObj = http.post('/api/v2/tickets', options)
        
      } else {
        // 3. error.
        throw Error('options must be integer or object')        
      } 
      
      this.getId = getTicketId
      this.getResponderId = getResponderId
      this.getRequesterId = getRequesterId
      this.assign = assignTicket
      this.note = noteTicket
      this.reply = replyTicket

      this.del = deleteTicket
      this.restore = restoreTicket
      
      this.getPriority = getTicketPriority
      this.setPriority = setTicketPriority
      
      this.getStatus = getTicketStatus
      this.setStatus = setTicketStatus
      
      this.getGroup = getTicketGroup
      this.setGroup = setTicketGroup
      
      this.open = function () { return setTicketStatus(2) }
      this.pend = function () { return setTicketStatus(3) }
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
//        Logger.log(JSON.stringify(ticketObj))
        if (ticketObj && ticketObj.id) {
          return ticketObj.id
        }
        
        return null
      }
      
      function getResponderId() {

        if (ticketObj && ticketObj.responder_id) {
          return ticketObj.responder_id
        }
        
        return null
      }

      function getRequesterId() {

        if (ticketObj && ticketObj.requester_id) {
          return ticketObj.requester_id
        }
        
        return null
      }
            
      function assignTicket(responderId) {

//        v1:
//        http.put('/helpdesk/tickets/' 
//                 + getTicketId()
//        + '/assign.json?responder_id=' 
//        + responderId
//        )
       
        http.put('/api/v2/tickets/' + getTicketId(), {
          responder_id: responderId
        })

        reloadTicket(getTicketId()) // refresh

        return this
      }
      
      function deleteTicket() {
        // v1: if ('deleted'==http.del('/helpdesk/tickets/' + getTicketId() + '.json')) {
        http.del('/api/v2/tickets/' + getTicketId())
        reloadTicket(getTicketId()) // refresh
        return true
      }

      /**
      *
      * @tested
      */
      function restoreTicket(id) {
        
        if (!id) id = getTicketId()
        
        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer')
        
        // v1: var ret = http.put('/helpdesk/tickets/' + id + '/restore.json')
        var ret = http.put('/api/v2/tickets/' + id + '/restore')
        
        reloadTicket(getTicketId()) // refresh
        return this
      }
      
      /**
      *
      * Reload Ticket Object Raw Data
      *
      */
      function reloadTicket(id) {
        
        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer.')
//     Logger.log('loading id:' + id)
        // v1: ticketObj = http.get('/helpdesk/tickets/' + id + '.json')
//        ticketObj = http.get('/api/v2/tickets/' + id + '?include=notes')
        ticketObj = http.get('/api/v2/tickets/' + id + '?include=conversations')
//        Logger.log(JSON.stringify(ticketObj))
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
        
        // v1: var retVal = http.post('/helpdesk/tickets/' + getTicketId() + '/conversations/note.json', data)
        var retVal = http.post('/api/v2/tickets/' + getTicketId() + '/notes', data)
        
        if (retVal) {
          reloadTicket(getTicketId())
          return true
        }
        
        return false
      }

      /**
      *
      * Reply a Ticket
      *
      * @testing
      */
      function replyTicket(data) {
        
        validateHelpdeskObject(data)
        
        var retVal = http.post('/api/v2/tickets/' + getTicketId() + '/reply', data)
        
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
      function getTicketPriority() { return ticketObj.priority }
      function setTicketPriority(priority) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          priority: priority
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
      function getTicketStatus() { return ticketObj.status }      
      function setTicketStatus(status) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          status: status
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set status fail')  
      }
      
      function getTicketGroup() { return ticketObj.group_id }
      function setTicketGroup(groupId) {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          group_id: groupId
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set group fail')  
      }
      
      function setTicketCustomField(customFields) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          custom_field: customFields
        })
        
        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }
        
        throw Error('set status fail')          
      }
      
      function setTicketTag(tags) {
        
        throw Error('not implenment yet')
        
        var ticketTags = ticketObj.tags
        
//          "tags":[
//         {"name": "tag1"},
//         {"name": "tag2"}
//    ]
          
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
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
        
        // v1: contactObj = http.post('/contacts.json', options)
        contactObj = http.post('/api/v2/contacts', options)
        
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
        if (contactObj && contactObj.id) {
          return contactObj.id
        }
        
        return null
      }
      
      function deleteContact() {
        // v1: if ('deleted'==http.del('/contacts/' + getContactId() + '.json')) {
        if ('deleted'==http.del('/api/v2/contacts/' + getContactId())) {
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
        
        // v1: contactObj = http.get('/contacts/' + id + '.json')
        contactObj = http.get('/api/v2/contacts/' + id)

        return this
      }
          
      /**
      *
      *
      * @testing
      */
      function getContactName() { 
        return contactObj.name 
      }
      function setContactName(name) {
        // v1: var retVal = http.put('/contacts/' + getContactId() + '.json', {
        var retVal = http.put('/api/v2/contacts/' + getContactId(), {
          name: name
        })
        
        if (retVal) {
          reloadContact()
          return this
        }
        
        throw Error('set name fail')  
      }

      function getContactEmail() {
        return contactObj.email
      }
      
      /**
      *
      *
      * @testing
      */
      function getContactTitle() { return contactObj.job_title }      
      function setContactTitle(title) {
        // v1: var retVal = http.put('/contacts/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/contacts/' + getTicketId(), {
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
        if (agentObj && agentObj.id) {
          return agentObj.id
        }
        
        return null
      }

      function getAgentName() { 
        return agentObj.contact.name 
      }
      
      /**
      *
      * Reload Agent Object Raw Data
      *
      */
      function reloadAgent(id) {
        
        if ((typeof id)=='undefined') id = getAgentId()
        
        if (id%1 !== 0) throw Error('agent id(' + id + ') must be integer.')
        
        // v1: agentObj = http.get('/agents/' + id + '.json')
        agentObj = http.get('/api/v2/agents/' + id)

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
  Freshdesk.validateInteger = validateInteger
  
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
        
      } else if (!data || data instanceof Object) {
        
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
          log(log.DEBUG, 'UrlFetchApp.fetch exception(ttl:%s): %s, %s', TTL, e.name, e.message)
          Utilities.sleep(50) // sleep 50 ms
        }
//        Logger.log('ttl:' + TTL + ', retCode:' + retCode)
      }
      
      switch (true) {
        case /^2/.test(retCode):
          // It's ok with 2XX
          break;
          
        case /^3/.test(retCode):
          // TBD: OK? NOT OK???
          break;
          
        case /^4/.test(retCode):
        case /^5/.test(retCode):
          /**
          *
          * Get Detail Error Response from Freshdesk API v2
          * http://developer.freshdesk.com/api/#error
          *
          */
          var apiErrorMsg
          
          try {
            var respObj = JSON.parse(response.getContentText());
            
            var description = respObj.description
            var errors = respObj.errors
            
            var errorMsg
            
            if (errors && errors instanceof Array) {
              errorMsg = errors.map(function (e) { 
                return Utilities.formatString('code[%s], field[%s], message[%s]'
                                              , e.code || ''
                                              , e.field || ''
                                              , e.message || ''
                                             )
              }).reduce(function (v1, v2) {
                return v1 + '; ' + v2
              });
              
            } else if (respObj.code) {
              errorMsg = Utilities.formatString('code[%s], field[%s], message[%s]'
                                                , respObj.code || ''
                                                , respObj.field || ''
                                                , respObj.message || ''
                                               )
            }

            // clean options
            if (options.payload) {
              options.payload = options.payload ? JSON.parse(options.payload) : {}
              
              if (options.payload.body) options.payload.body = '...STRIPED...'
              if (options.payload.description) options.payload.description = '...STRIPED...'
            }
            options = JSON.stringify(options)
            
            apiErrorMsg = Utilities
            .formatString('Freshdesk API v2 failed when calling endpoint[%s], options[%s], description[%s] with error: (%s)'
                          , endpoint
                          , options
                          , description || ''
                          , errorMsg || ''
                         )            
          } catch (e) {
            Logger.log(e.name + ',' + e.message + ',' + e.stack)
          }

          if (apiErrorMsg)
            throw Error(apiErrorMsg);
          
          throw Error('http call failed with http code:' + response.getResponseCode());
            
          break;
          
        default:
          var errMsg = [
            'endpoint: ' + endpoint
            , 'options: ' + JSON.stringify(options)
            , (response ? response.getContentText().substring(0,1000) : '(undefined)')
            , 'api call failed with http code:' + (response ? response.getResponseCode() : '(undefined)')
          ].join(', ')
          
          throw Error(errMsg)
          break
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
    * concat attachments for array [attachments][]
    *
    * @testing
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
      // 20160115 a array which include 1 Blob, toString() will also return a 'Blob'
      if (v instanceof Array) return false

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
    var RE=/<?[a-z0-9\-_.]+@[a-z0-9\-_]+\.[a-z0-9\-_.]+>?$/i
    
    if (RE.test(email)) return email
    
    throw Error('invalid email: [' + email + ']')
  }
  
  function validateInteger(num) {
    if (num%1===0) return num
    else throw Error('invalid integer: [' + num + ']')
  }
  
  /**
  * freshdesk api v2 has better error checking for us.
  */
  function validateHelpdeskObject(obj) {
    
    if (!obj || (typeof obj!=='object')) throw Error('invalid helpdesk object: it is not object.')
    
    if (obj.email) validateEmail(obj.email)
    
    // unknown treat as ok
    return true
  }
  
}())

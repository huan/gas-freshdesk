//  if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
//    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText())
//  } // Class GasLog is ready for use now!
//  var log = new GasLog()
  
function freshdeskTestRunner() {
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
  })
  
  ticket.assign(9000658396)
  ticket.note({
    body: 'Hi tom, Still Angry'
    , private: true
  })
  ticket.setPriority(2)
  ticket.setStatus(2)
  
  ticket.del()
  ticket.restore()
  ```
  */  
  
  if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText())
  } // Class GasLog is ready for use now!
  var log = new GasLog()
    
  if ((typeof GasTap)==='undefined') { // GasT Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js').getContentText())
  } // Class GasTap is ready for use now!
  var test = new GasTap()
  
  // This is my test account, don't worry, thanks. ;]
  var FRESHDESK_URL = 'https://mikebo.freshdesk.com' 
  
  // Sorry for this maybe make some people(hope not include you) who hate show plain text secret(key/password) in code.
  // This is the key for agent 'zixia@zixia.net' at 'https://mikebo.freshdesk.com', just for easy testing...
  var FRESHDESK_KEY = 'Jrg0FQNzX3tzuHbiFjYQ'         

  /******************************************************************
  */
  
//  return development()
//  return (testSearch() + test.finish())
//  return (testFreshdeskTicket() + test.finish())

  /*
  *******************************************************************/

  
  /******************************************************************
  *
  * Test cases
  *
  */

  testHttpBackend()
  testUtils()

  testValidators()
  
  testFreshdeskAuth()

  testFreshdeskTicket()
  testFreshdeskContact()
  testFreshdeskAgent()

  testSearch()
  
  test.finish()
  
  ////////////////////////////////////////////////////////////////////////  
  
  function development() {
    test('Ticket', function (t) {
      var TICKET_ID = 1
      //      ??? var EXPECTED_ID = 9000658396 // Agent ID of Mike@zixia.net
      
      var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      var oldTicket = new MyFreshdesk.Ticket(TICKET_ID)
      })

  }
  

  function testSearch() {
    var MyFreshdesk =  new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
    
    test('listTickets', function (t) {
      var EMAIL = 'you@example.com'
            
      tickets = MyFreshdesk.listTickets({ email: EMAIL })
    
      t.ok(tickets.length, 'get listTickets result')
      t.ok(tickets[0].getId(), 'ticket id valid')
      
      var contactId = tickets[0].getRequesterId()
      var contact = new MyFreshdesk.Contact(contactId)
      
      t.equal(contact.getEmail(), EMAIL, 'contact email match')
      
      var ticketId = tickets[0].getId()
      tickets = MyFreshdesk.listTickets({ requester_id: contactId })
      t.ok(tickets.length, 'listTickets by requester_id')
      t.equal(tickets[0].getId(), ticketId, 'search by requester_id')
      
      // XXX
//      var EMAIL_NEED_ENCODE = 'you+owner@example.com'
//      t.notThrow(function () { 
//        MyFreshdesk.listTickets({ email: EMAIL_NEED_ENCODE }) 
//      }, 'search email include "+"')
    })
    
    test('listContacts', function (t) {
      var EMAIL = 'you@example.com'
      contacts = MyFreshdesk.listContacts({ email: EMAIL })
    
      t.ok(contacts.length, 'get listContacts result')
      t.ok(contacts[0].getId(), 'contact id valid')      
    })
  }
  
  function testFreshdeskAgent() {
    
    test ('Agent', function (t) {
      var EMAIL = 'zixia@zixia.net'
      
      var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      
      var agents = MyFreshdesk.listAgents({ email: EMAIL })
      
      t.ok(agents.length, 'lsitAgents')
      
      var agent = agents[0]
      
      t.ok(agent.getName(), 'agent has name')
      t.ok(agent.getId(), 'agent has id')
    })
  }
  
  function testFreshdeskContact() {
    
    test ('Contact', function (t) {
      var EMAIL = 'you@example.com'
      var EXPECTED_NAME = 'expected name'
      
      var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      
      var contacts = MyFreshdesk.listContacts({ email: EMAIL })
      t.ok(contacts, 'contact list')

      var contact = contacts[0]
      t.ok(contact.getName(), 'contact has name')
      contact.setName(EXPECTED_NAME)
      t.equal(contact.getName(), EXPECTED_NAME, 'contact name as expected')
      
      contact.setName('You You')
      
      t.ok(contact.getId(), 'contact has id')
    })
    
  }
  
  function testValidators() {
    
    test ('Validate Ticket Object', function (t) {
      
      var OK_TICKET_OBJ = {
        email: 'email@email.com'
      }
           
      var OK_TICKET_WITH_ATT_OBJ = {
        email: 'email@email.com'
        , attachments: [
          'blob'
        ]
      }

     var OK_TICKET_EMAIL_OBJ = {
       email: 'test_.-email@email_em-ail.co.jp'
      }

     var NOT_OK_TICKET_EMAIL_OBJ = {
       email: 'n@t a valid address'
     }

     t.notThrow(function () { GasFreshdesk.validateHelpdeskObject(OK_TICKET_OBJ) }, 'ticket obj with right key')
          
     t.notThrow(function () { GasFreshdesk.validateHelpdeskObject(OK_TICKET_EMAIL_OBJ) }, 'ticket obj with valid email address')
     t.throws(function () { GasFreshdesk.validateHelpdeskObject(NOT_OK_TICKET_EMAIL_OBJ) }, 'ticket obj with invalid email address')
     
     t.throws(function () { GasFreshdesk.validateInteger('a') }, 'validateInteger a string')
     t.notThrow(function () { GasFreshdesk.validateInteger(1) }, 'validateInteger a integer')     
    })
  }
  
  function testUtils() {
    
    test ('Attachment Helper', function (t) {
      var HAS_ATTACHMENT = {
        a: {
          b: {
            attachments: [1,2]
          }
        }
      }
      
      var NO_ATTACHMENT = {
        a: {
          b: {
            haha: [1,2]
          }
        }
      }
      
      var http = GasFreshdesk.Http('a','b')
      
      var hasAtt = http.hasAttachment(HAS_ATTACHMENT)
      t.ok(hasAtt, 'HAS_ATTACHMENT has attachment')
      
      var noAtt = http.hasAttachment(NO_ATTACHMENT)
      t.ok(!noAtt, 'NO_ATTACHMENT has NO attachment')
    })
  }
  
  function testFreshdeskTicket() {
    
    test('Ticket', function (t) {
      var TICKET_ID = 1
//      ??? var EXPECTED_ID = 9000658396 // Agent ID of Mike@zixia.net

      var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      var oldTicket = new MyFreshdesk.Ticket(TICKET_ID)
      
      
      t.ok(oldTicket, 'loaded')  
//      Logger.log(JSON.stringify(oldTicket.getRawObj()))
      t.equal(oldTicket.getRawObj().id, TICKET_ID, 'match ticket id')
      
      var EXAMPLE_TICKET = {
        'description':'A totally rad description of a what the problem is'
        , 'subject':'Something like "Cannot log in"'
        , 'email': 'you@example.com'
      }
      var newTicket = new MyFreshdesk.Ticket(EXAMPLE_TICKET)
      t.ok(newTicket, 'newTicket created')
      t.ok(newTicket.getId(), 'newTicket id exist')
      
      newTicket.close()
//      Logger.log(JSON.stringify((newTicket.getRawObj())))
      newTicket.open()
      
      var ZIXIA_RESPONDER_ID = 9005923152 // zixia@zixia.net
      var MIKE_RESPONDER_ID = 9005923143 // mike@zixia.net
      
      t.equal(newTicket.getResponderId(), null, 'new ticket default no responder')
      newTicket.assign(MIKE_RESPONDER_ID)
      t.equal(newTicket.getResponderId(), MIKE_RESPONDER_ID, 'assigned to mike')

      
//      var numNotes = newTicket.getRawObj().notes ? newTicket.getRawObj().notes.length : 0
      var numNotes = newTicket.getRawObj().conversations ? newTicket.getRawObj().conversations.length : 0

      newTicket.note({
        body: 'Hi tom, Still Angry'
        , private: true
        , attachments: [ 
          Utilities.newBlob('TEST DATA').setName('test-data.dat')
          , Utilities.newBlob('TEST DATA2').setName('test-data2.dat')
        ]
      })
      
      newTicket.note({
        body: 'Hi tom, Still Angry'
        , private: true
      })

      // reply also in notes[]
      newTicket.reply({ 
        body: 'Replied: Hi tom, Still Angry'
//        , user_id:　MIKE_RESPONDER_ID
//        , cc_emails: 
      })
      
//      Logger.log(JSON.stringify(newTicket.getRawObj()))
      
//      var newNumNotes = newTicket.getRawObj().notes ? newTicket.getRawObj().notes.length : 0
      var newNumNotes = newTicket.getRawObj().conversations ? newTicket.getRawObj().conversations.length : 0
      
      t.equal(newNumNotes, numNotes+3, 'new note(2) and reply(1) created')
     

      
      
      var priority = newTicket.getPriority()
      newTicket.setPriority(priority+1)
      t.equal(newTicket.getPriority(), priority+1, 'inc priority by 1')
      
      var status = newTicket.getStatus()
      newTicket.setStatus(status+1)
      t.equal(newTicket.getStatus(), status+1, 'inc status by 1')
      
      t.ok(newTicket.del(), 'delete newTicket')
      
      t.ok(newTicket.restore(), 'restore newTicket')
      
      t.ok(newTicket.del(), 'delete newTicket again')
      
      var EXAMPLE_TICKET_WITH_ATTACHMENTS = {
          'description':'A totally rad description of a what the problem is'
          , 'subject':'Something like "Cannot log in"'
          , 'email': 'you@example.com'
          , attachments: [ Utilities.newBlob('TEST DATA').setName('test-data.dat')
                          , Utilities.newBlob('TEST DATA2').setName('test-data2.dat')
                         ]
      }
      var newTicketWithAttachment = new MyFreshdesk.Ticket(EXAMPLE_TICKET_WITH_ATTACHMENTS)
      t.ok(newTicketWithAttachment, 'newTicketWithAttachment created')
      t.ok(newTicketWithAttachment.getId(), 'newTicketWithAttachment id exist')
      t.ok(newTicketWithAttachment.del(), 'delete newTicketWithAttachment')

    })
   
  }
  
  function testFreshdeskAuth() {
    test('Auth Fail', function (t) {
      var ERR_URL = 'https://zixia.freshdesk.com'
      t.throws(function () {
        new GasFreshdesk(ERR_URL, FRESHDESK_KEY)
      }, 'Auth with ERR_URL')
      
      t.throws(function () {
        new GasFreshdesk(FRESHDESK_URL, 'error_key')
      }, 'Auth with error_key')
      
      t.throws(function () {
        new GasFreshdesk('not_exist_url', FRESHDESK_KEY)
      }, 'Auth with not_exist_url')

      t.notThrow(function () {
        new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      }, 'Auth with right setting')
    })
  }
  
  function testHttpBackend() {
    test('Multipart body process', function (t) {
      
      var http = new GasFreshdesk.Http(FRESHDESK_URL, FRESHDESK_KEY)
      
      var BLOB1 = Utilities.newBlob('XXX').setName('xxx')
      var BLOB2 = Utilities.newBlob('TODO').setName('todo')
      var OBJ = {
        attachments: [
          BLOB1
          , BLOB2
        ]
        , email: 'example@example.com'
        , subject: 'Ticket Title'
        , description: 'this is a sample ticket'
      }
      
      var EXPECTED_MULTIPART_ARRAY = [
        ['attachments[]', BLOB1]
        , ['attachments[]', BLOB2]
        , ['email', 'example@example.com']
        , ['subject', 'Ticket Title']
        , ['description', 'this is a sample ticket']
      ]
      
      /**
      * makeMultipartArray
      */
      var multipartArray = http.makeMultipartArray(OBJ)
      t.deepEqual(multipartArray, EXPECTED_MULTIPART_ARRAY, 'makeMultipartArray')
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      var EXPECTED_MULTIPART_BODY = 
          '----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="attachments[]"; filename="xxx"\r\n' 
      + 'Content-Type: text/plain\r\n\r\nXXX\r\n'
      + '----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="attachments[]"; filename="todo"\r\n'
      + 'Content-Type: text/plain\r\n\r\nTODO\r\n'
      + '----boundary-seprator\r\nContent-Disposition: form-data; name="email"\r\n\r\n'
      + 'example@example.com\r\n----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="subject"\r\n\r\n'
      + 'Ticket Title\r\n----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="description"\r\n\r\n'
      + 'this is a sample ticket\r\n----boundary-seprator--\r\n'
      
      EXPECTED_MULTIPART_BODY = Utilities.newBlob(EXPECTED_MULTIPART_BODY).getBytes()
      /**
      * makeMultipartBody
      */
      var multipartBody = http.makeMultipartBody(multipartArray, '--boundary-seprator')
      t.deepEqual(multipartBody, EXPECTED_MULTIPART_BODY, 'makeMultipartBody')
    })

    test('Http Methods', function (t) {
      var http = new GasFreshdesk.Http(FRESHDESK_URL, FRESHDESK_KEY)

      var data = http.get('http://httpbin.org/get?test=ok')
      t.equal(typeof data, 'object', 'json')
      if (data && data.args) var tmp = data.args.test || ''
      t.equal(tmp, 'ok', 'http.get')
      
      data = http.put('http://httpbin.org/put', 'test=ok')
      t.equal(typeof data, 'object', 'x-www-form-urlencoded')
      if (data && data.form) var tmp = data.form.test || ''
      t.equal(tmp, 'ok', 'http.put')
      
      data = http.del('http://httpbin.org/delete')
      t.equal(data.url, 'http://httpbin.org/delete', 'http.del')
      
      data = http.post('http://httpbin.org/post', 'test=ok')
      t.equal(typeof data, 'object', 'x-www-form-urlencoded')
      if (data && data.form) var tmp = data.form.test || ''
      t.equal(tmp, 'ok', 'http.post')
    })
  }  

}
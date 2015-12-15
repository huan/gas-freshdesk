
function freshdeskTestRunner() {
  'use strict'
  
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
  
  // key for agent 'zixia@zixia.net' at 'https://mikebo.freshdesk.com'
  var FRESHDESK_KEY = 'Jrg0FQNzX3tzuHbiFjYQ'         

  
//  return development()
  
  
  /******************************************************************
  *
  * Test cases
  *
  */

  testHttpBackend()
  testUtils()
  
  testFreshdeskAuth()

  testFreshdeskTicket()
  testFreshdeskContact()
  testFreshdeskAgent()

  test.finish()
  
  ////////////////////////////////////////////////////////////////////////  
  
  function development() {
  }
  
  function testFreshdeskAgent() {
    
    test ('Agent', function (t) {
      var EMAIL = 'zixia@zixia.net'
      
      var MyFreshdesk = new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      
      var agent = MyFreshdesk.listAgents({ email: EMAIL })
      
      t.ok(agent.getName(), 'agent has name')
      t.ok(agent.getId(), 'agent has id')
    })
  }
  
  function testFreshdeskContact() {
    
    test ('Contact', function (t) {
      var EMAIL = 'you@example.com'
      var EXPECTED_NAME = 'expected name'
      
      var MyFreshdesk = new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      
      var contact = MyFreshdesk.listContacts({ email: EMAIL })
      
      t.ok(contact.getName(), 'contact has name')
      
      contact.setName(EXPECTED_NAME)
      t.equal(contact.getName(), EXPECTED_NAME, 'contact name as expected')
      
      contact.setName('You You')
      
      t.ok(contact.getId(), 'contact has id')
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
      
      var http = Freshdesk.Http('a','b')
      
      var hasAtt = http.hasAttachment(HAS_ATTACHMENT)
      t.ok(hasAtt, 'HAS_ATTACHMENT has attachment')
      
      var noAtt = http.hasAttachment(NO_ATTACHMENT)
      t.ok(!noAtt, 'NO_ATTACHMENT has NO attachment')
    })
  }
  
  function testFreshdeskTicket() {
    
    test('Ticket', function (t) {
      var TICKET_ID = 1
      var EXPECTED_ID = 9000658396 // Agent ID of Mike@zixia.net

      var MyFreshdesk = new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      var oldTicket = new MyFreshdesk.Ticket(TICKET_ID)
      
      
      t.ok(oldTicket, 'loaded')  
      t.equal(oldTicket.getRawObj().helpdesk_ticket.id, EXPECTED_ID, '9000658396 match id')
      
      var EXAMPLE_TICKET = {
        'helpdesk_ticket': {
          'description':'A totally rad description of a what the problem is'
          , 'subject':'Something like "Cannot log in"'
          , 'email': 'you@example.com'
        }
      }
      var newTicket = new MyFreshdesk.Ticket(EXAMPLE_TICKET)
      t.ok(newTicket, 'newTicket created')
      t.ok(newTicket.getId(), 'newTicket id exist')
      
      var ZIXIA_RESPONDER_ID = 9005923152 // zixia@zixia.net
      var MIKE_RESPONDER_ID = 9005923143 // mike@zixia.net
      
      t.equal(newTicket.getResponderId(), null, 'new ticket default no responder')
      newTicket.assign(MIKE_RESPONDER_ID)
      t.equal(newTicket.getResponderId(), MIKE_RESPONDER_ID, 'assigned to mike')

      
      var numNotes = newTicket.getRawObj().helpdesk_ticket.notes.length

      newTicket.addNote({
        helpdesk_note: {
          body: 'Hi tom, Still Angry'
          , private: true
          , attachments: [ 
            {resource: Utilities.newBlob('TEST DATA').setName('test-data.dat')}
            , {resource: Utilities.newBlob('TEST DATA2').setName('test-data2.dat')}
          ]
        }
      })
      
      t.equal(newTicket.getRawObj().helpdesk_ticket.notes.length, numNotes+1, 'new note created')
      
      
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
        'helpdesk_ticket': {
          'description':'A totally rad description of a what the problem is'
          , 'subject':'Something like "Cannot log in"'
          , 'email': 'you@example.com'
          , attachments: [ {resource: Utilities.newBlob('TEST DATA').setName('test-data.dat')}
                          , {resource: Utilities.newBlob('TEST DATA2').setName('test-data2.dat')}
                         ]
        }
      }
      var newTicketWithAttachment = new MyFreshdesk.Ticket(EXAMPLE_TICKET_WITH_ATTACHMENTS)
      t.ok(newTicketWithAttachment, 'newTicketWithAttachment created')
      t.ok(newTicketWithAttachment.getId(), 'newTicketWithAttachment id exist')
      t.ok(newTicketWithAttachment.del(), 'delete newTicketWithAttachment')

    })
  }
  
  function testFreshdeskAuth() {
    test('Auth Fail', function (t) {
      var ERR_URL = 'http://zixia.freshdesk.com'
      t.throws(function () {
        new Freshdesk(ERR_URL, FRESHDESK_KEY)
      }, 'Auth should throw with ERR_URL')
      
      t.throws(function () {
        new Freshdesk(FRESHDESK_URL, 'error_key')
      }, 'Auth should throw with error_key')
      
      t.throws(function () {
        new Freshdesk('not_exist_url', FRESHDESK_KEY)
      }, 'Auth should throw with not_exist_url')

      t.notThrow(function () {
        new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)
      }, 'Auth should not throw with right setting')
    })
  }
  
  function testHttpBackend() {
    test('Multipart body process', function (t) {
      
      var http = new Freshdesk.Http(FRESHDESK_URL, FRESHDESK_KEY)
      
      var BLOB1 = Utilities.newBlob('XXX').setName('xxx')
      var BLOB2 = Utilities.newBlob('TODO').setName('todo')
      var OBJ = {
        helpdesk_ticket: {
          attachments: [
            { resource: BLOB1 }
            , { resource: BLOB2 }
          ]
          , email: 'example@example.com'
          , subject: 'Ticket Title'
          , description: 'this is a sample ticket'
        }
      }
      
      var EXPECTED_MULTIPART_ARRAY = [
        ['helpdesk_ticket[attachments][][resource]', BLOB1]
        , ['helpdesk_ticket[attachments][][resource]', BLOB2]
        , ['helpdesk_ticket[email]', 'example@example.com']
        , ['helpdesk_ticket[subject]', 'Ticket Title']
        , ['helpdesk_ticket[description]', 'this is a sample ticket']
      ]
      
      /**
      * makeMultipartArray
      */
      var multipartArray = http.makeMultipartArray(OBJ)
      t.deepEqual(multipartArray, EXPECTED_MULTIPART_ARRAY, 'makeMultipartArray')
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      var EXPECTED_MULTIPART_BODY = 
          '----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="helpdesk_ticket[attachments][][resource]"; filename="xxx"\r\n' 
      + 'Content-Type: text/plain\r\n\r\nXXX\r\n'
      + '----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="helpdesk_ticket[attachments][][resource]"; filename="todo"\r\n'
      + 'Content-Type: text/plain\r\n\r\nTODO\r\n'
      + '----boundary-seprator\r\nContent-Disposition: form-data; name="helpdesk_ticket[email]"\r\n\r\n'
      + 'example@example.com\r\n----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="helpdesk_ticket[subject]"\r\n\r\n'
      + 'Ticket Title\r\n----boundary-seprator\r\n'
      + 'Content-Disposition: form-data; name="helpdesk_ticket[description]"\r\n\r\n'
      + 'this is a sample ticket\r\n----boundary-seprator--\r\n'
      
      EXPECTED_MULTIPART_BODY = Utilities.newBlob(EXPECTED_MULTIPART_BODY).getBytes()
      /**
      * makeMultipartBody
      */
      var multipartBody = http.makeMultipartBody(multipartArray, '--boundary-seprator')
      t.deepEqual(multipartBody, EXPECTED_MULTIPART_BODY, 'makeMultipartBody')
    })

    test('Http Methods', function (t) {
      var http = new Freshdesk.Http(FRESHDESK_URL, FRESHDESK_KEY)

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

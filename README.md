# GasFreshdesk - OO Class for Freshdesk API(v2)
GasFreshdesk is a simple Freshdesk API Class for GAS(Google Apps Script)

Github: https://github.com/zixia/gas-freshdesk

## Why GasFreshdesk?

I made a number of freshdesk API calls in GAS in order to convert emails from my Gmail account to tickets in my daily life. Most of the emails are business plans with attachments.

I found Freshdesk API very hard to use and debug in GAS, especialy with attachments. Writing more code became more complicated. So I decided to modulize it to GasFreshdesk module.

### What does GasFreshdesk look like?

GasFreshdesk is very clean and easy to use.

```javascript
var MyFreshdesk = new Freshdesk('https://mikebo.freshdesk.com', 'Jrg0FQNzX3tzuHbiFjYQ')

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
ticket.reply({
  body: 'Hi tom, Still Angry'
  , cc_emails: 'you@example.com' 
})
ticket.setPriority(2)
ticket.setStatus(2)

ticket.del()
ticket.restore()

Logger.log('ticket #' + ticket.getId() + ' was set!')
```

It's very clean and easy to use, huh ;-)

### How to enable GasFreshdesk library in GAS?

To use GasFreshdesk in your GAS script editor, just add the follow lines, then you are set.

```javascript
if ((typeof Freshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText())
} // Class Freshdesk is ready for use now!

```

## API

Gas Freshdesk Library use [API v2](http://developer.freshdesk.com/api/) to communicate with freshdesk.

The old version use Freshdesk API v1 is [Gas Freshdesk Library v0.2.0](#v0.2.0).

### 1. Class `Freshdesk`


#### 1.1 `Freshdesk(url, key)`: Class constructor for Freshdesk

Return MyFreshdesk for you.

```javascript
var MyFreshdesk = new Freshdesk(
  'YOUR_FRESHDESK_URL_HERE' // i.e. https://mikebo.freshdesk.com
  , 'YOUR_API_KEY_HERE'
)
```

#### 1.2 `MyFreshdesk.listTickets(options)`

List or search for tickets. Return a array of Tickets instance.

* `options.email`: email address of requester

if `options` is not provided, then listTickets will uses the new_and_my_open filter.

### 2. Class `Ticket`

#### 2.1 `MyFreshdesk.Ticket({...})`: Class constructor for Ticket

Create a new ticket for you.

```javascript
var ticket = new MyFreshdesk.Ticket({
  description:'A totally rad description of a what the problem is'
  , subject:'Something like "Cannot log in"'
  , email: 'you@example.com'
  , attachments: [ 
    Utilities.newBlob('TEST DATA').setName('test-data.dat')
    , Utilities.newBlob('TEST2 DATA').setName('test-data2.dat')
  ]
})
```

#### 2.2 `MyFreshdesk.Ticket(id)`: Class constructor for Ticket

Load a existing ticket for you.

```javascript
var ticket = new MyFreshdesk.Ticket(1)
```

#### 2.3 `Ticket.del()`: Delete ticket

```javascript
ticket.del()
```

#### 2.4 `Ticket.list()`: List tickets

#### 2.5 `Ticket.setStatus()`

Set ticket to status with parameter.

Has the following shortcut methods:

1. `open()`
1. `pend()`
1. `resolv()`
1. `close()`

#### 2.6 `Ticket.note()`

Note a ticket.

```javascript
ticket.note({
  body: 'Hi tom, Still Angry'
  , private: true
})
```

#### 2.7 `Ticket.reply()`

Reply a ticket.

```javascript
ticket.reply({
  body: 'Hi tom, Still Angry'
  , cc_emails: 'you@example.com' 
})
```
### 3. Class `Contact`

```javascript
var requesterId = Ticket.getRequesterId()
var contact = new MyFreshdesk.Contact(requesterId)

Logger.log(contact.getEmail())
```

#### 3.1 `Contact.list()`: List contacts

Search contacts by email.

```javascript
var contacts = Contact.list({ email: 'you@example.com' })
Logger.log(contacts[0].getName())
```

### 4. Class `Agent`

TBW

#### 4.1 `Agent.list()`: List agents

## Test Suites

There is a test suite that comes with GasFreshdesk, which uses [GasTap](https://github.com/zixia/gast), a tap testing-framework for GAS.

More sample code could be found in the test files if you like to look into it. 

GasFreshdesk test suite: https://github.com/zixia/gas-freshdesk/blob/master/src/gas-freshdesk-tests.js

### How to run tests?

You must run tests inside google apps script editor. Open google script editor, copy/paste gas-freshdesk-tests.js into it, then click Run.

There's also an easier way to do it, you could go to my develop environment(read only) to run and clone. Follow this link: https://script.google.com/a/zixia.net/macros/d/Mta4oea1VMIugfSGRo4QrAnKRT9d30hqB/edit?uiv=2&mid=ACjPJvGt4gnXjJwXnToB0jIMEbSvqKUF6vH-uq-m59SqnjXqTQ03NDn_khlNE6ha_mPnrOAYEnyFk80nHYmt_hppO3AgDkO_vVLrYJXzcPPagwRromd0znfLreNFAu4p0rYTC-Jlo-sAKOM, then click `gas-freshdesk-test.gs` in file browser on the left.

## Support

The GasFreshdesk source code repository is hosted on GitHub. There you can file bugs on the issue tracker or submit tested pull requests for review. ( https://github.com/zixia/gas-freshdesk/issues )

For real-world examples from open-source projects using GasL, see Projects Using TasL on the wiki. ( https://github.com/zixia/gas-freshdesk/wiki )

## Version history

### v0.3.0(January 12, 2016)
* Switch to [Freshdesk API v2](http://developer.freshdesk.com/api/)
* new method added: Ticket.reply() 

### v0.2.0(January 11, 2016): [Freshdesk API v1](https://freshdesk.com/api)<a name="v0.2.0"></a>
* Add new methods
* Last version with Freshdesk API v1

To use the v0.2.0 gas-freshdesk library with freshdesk api v1, put the following snip in your gas code.
```javascript
if ((typeof Freshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/v0.2.0/src/gas-freshdesk-lib.js').getContentText())
} // Class Freshdesk is ready for use now!
```

### v0.1.0(December 16, 2015)
* Initial public release.

-------------------------------------------
© 2015 Zhuohuan LI. GasFreshdesk is released under an MIT-style license; see LICENSE for details.

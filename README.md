# GasFreshdesk - OO Class for Freshdesk API
GasFreshdesk is a easy to use Freshdesk API Class for GAS(Google Apps Script)

Github: https://github.com/zixia/gas-freshdesk

## Why GasFreshdesk?

I made lots of freshdesk api calls in gas in order to transfer emails in my gmail to tickets in my daily life. Most of them is bizplan with attachments.

I found Freshdesk API is very hard to use and debug in gas, especialy with attachments. Wrote more code is like a total mess. So I decided to modulize it to GasFreshdesk module.

### What is GasFreshdesk looks like?

GasFreshdesk is very clean and easy to use.

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

Logger.log('ticket #' + ticket.getId() + ' was set!')
```

It's so clean and easy to use, ah? :]

### How to enable GasFreshdesk library in GAS?

To use GasFreshdesk in your GAS script editor, just add the follow lines, then you are set.

```javascript
if ((typeof Freshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText())
} // Class Freshdesk is ready for use now!

```

## API

### 1. Class `Freshdesk`


#### 1.1 `Freshdesk(url, key)`: Class constructor for Freshdesk

Return MyFreshdesk for you.

```javascript
var MyFreshdesk = new Freshdesk(
  'YOUR_FRESHDESK_URL_HERE' // i.e. https://mikebo.freshdesk.com
  , 'YOUR_API_KEY_HERE'
)
```

### 2. Class `Ticket`

#### 2.1 `MyFreshdesk.Ticket({...})`: Class constructor for Ticket

Create a new ticket for you.

```javascript
var ticket = new MyFreshdesk.Ticket({
  helpdesk_ticket: {
    description:'A totally rad description of a what the problem is'
    , subject:'Something like "Cannot log in"'
    , email: 'you@example.com'
    , attachments: [ 
      {resource: Utilities.newBlob('TEST DATA').setName('test-data.dat')} 
      , {resource: Utilities.newBlob('TEST2 DATA').setName('test-data2.dat')} 
    ]
  }
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

### 3. Class `Contact`

TBW

#### 3.1 TBW

### 4. Class `Agent`

TBW

#### 4.1 TBW

## Test Suites

There's a test suite comes with GasFreshdesk, which use [GasTap](https://github.com/zixia/gast), a tap testing-framework for gas.

More sample code could be found in the tests if you like to look into it. 

GasFreshdesk test suite: https://github.com/zixia/gas-freshdesk/blob/master/src/gas-freshdesk-tests.js

### How to run tests?

You must run inside google apps script editor. Open google script editor, copy/paste the gas-freshdesk-tests.js into it, then click Run.

There's also a easier way to do it, you could goto my develop environment(readonly) to run and clone. Follow this link: https://script.google.com/a/zixia.net/macros/d/Mta4oea1VMIugfSGRo4QrAnKRT9d30hqB/edit?uiv=2&mid=ACjPJvGt4gnXjJwXnToB0jIMEbSvqKUF6vH-uq-m59SqnjXqTQ03NDn_khlNE6ha_mPnrOAYEnyFk80nHYmt_hppO3AgDkO_vVLrYJXzcPPagwRromd0znfLreNFAu4p0rYTC-Jlo-sAKOM , then click the `gas-freshdesk-test.gs` in the left file browser.

## Support

The GasFreshdesk source code repository is hosted on GitHub. There you can file bugs on the issue tracker or submit tested pull requests for review. ( https://github.com/zixia/gas-freshdesk/issues )

For real-world examples from open-source projects using GasL, see Projects Using TasL on the wiki. ( https://github.com/zixia/gas-freshdesk/wiki )

## Version history

### v0.1.0 (December 16, 2015)
* Initial public release.

-------------------------------------------
© 2015 Zhuohuan LI. GasFreshdesk is released under an MIT-style license; see LICENSE for details.

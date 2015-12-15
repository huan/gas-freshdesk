# gas-freshdesk
Freshdesk API Class for Google Apps Script


## API

### `Freshdesk`: Constructor



1. `Freshdesk(url, key)`: Initialize Freshdesk: return MyFreshdesk

```javascript
var MyFreshdesk = new Freshdesk(
  'YOUR_FRESHDESK_URL_HERE' // i.e. https://zixia.freshdesk.com
  , 'YOUR_API_KEY_HERE'
)
```

2. `MyFreshdesk.Ticket(ticket)`: Create New Ticket

```javascript
// Create a new ticket
var example_ticket = {
  'helpdesk_ticket': {
    'description':'A totally rad description of a what the problem is'
    , 'subject':'Something like "Cannot log in"'
    , 'email': 'you@example.com'
    , attachments: [ 
      {resource: Utilities.newBlob('TEST DATA').setName('test-data.dat')} 
      , {resource: Utilities.newBlob('TEST2 DATA').setName('test-data2.dat')} 
    ]
  }
}
  
var newTicket = new MyFreshdesk.Ticket(example_ticket)
```

3. `MyFreshdesk.Ticket(id)`: Load Old Ticket

```javascript
var oldTicket = new MyFreshdesk.Ticket(1)
```

4. `ticket.del()`: Delete Ticket

```javascript
ticket.del()
```

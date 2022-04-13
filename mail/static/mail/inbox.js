document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
  
      // Loop over and create a div for each email
      emails.forEach(email => {
        let div = document.createElement('div');
        if (email['read']) {
          div.className = 'emails-read';
        } else{
          div.className = 'emails-unread';
        }

        div.innerHTML = `
            <span class="sender"> ${email['sender']} </span>
            <span class="subject"> <b>${email['subject']}</b> </span>
            <span class="timestamp"> ${email['timestamp']} </span>
        `;

        div.addEventListener('click', () => view_email(email['id']));
        document.querySelector('#emails-view').appendChild(div);
      });
  });
}

function view_email(id) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {
      // Show email contents
      const view = document.querySelector('#email-view');
      view.innerHTML = `
        <div class="card" style="width: 100%;">
          <div class="card-body">
            <h5 class="card-title">${email['subject']}</h5>
            <h6 class="card-subtitle mb-2 text-muted">From: ${email['sender']}</h6>
            <h6 class="card-subtitle mb-2 text-muted">To: ${email['recipients']}</h6>
            <p class="card-text">${email['body']}</p>
          </div>
          <div class="card-footer text-muted">${email['timestamp']}</div>
        </div>
        `;

      // Mark email as read
      if (!email['read']) {
        fetch('/emails/' + id, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // Adding archive/unarchive buttons
      const archive = document.createElement('button');
      archive.className = "btn btn-secondary btn-sm";
      archive.innerHTML = email['archived'] ? 'Unarchive' : 'Archive';
      archive.addEventListener('click', function() {
        fetch('/emails/' + id, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email['archived']
          })
        })
        .then(response => load_mailbox('inbox'))
      });
      
      // Add reply button and populate the fields
      const reply = document.createElement('button');
      reply.className = "btn btn-primary btn-sm";
      reply.innerHTML = 'Reply';
      reply.addEventListener('click', function() {
        compose_email();
        document.querySelector('#compose-recipients').value = email['sender'];
        
        // subject checked to add Re:
        let subject = email['subject'];
        if (subject.slice(0, 3) != 'Re:') {
          subject = 'Re: ' + subject;
        }
        document.querySelector('#compose-subject').value = subject;

        document.querySelector('#compose-body').value = 
          `On ${email['timestamp']} ${email['sender']} wrote: ${email['body']}`;
      });
      view.appendChild(reply);

      // No archive button on sent emails
      if (email['sender'] != user) {
        view.appendChild(archive);
      };

  });

}

function send(event) {

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => load_mailbox('sent'));

  event.preventDefault()
}
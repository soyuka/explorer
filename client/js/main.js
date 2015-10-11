(function() {
  //delete button confirm box
  var confirmDeletion = function(e) {
    return confirm('Are you sure?')
  }
  
  //checkbox to check every checkbox
  var checkAll = function(event) {
    var checkboxes = document.getElementById('tree').querySelectorAll('input[type="checkbox"]')
    for(var i in checkboxes) {
      checkboxes[i].checked = event.currentTarget.checked 
    }
  }

  var client = new Faye.Client(window.location.origin + '/socket', {timeout: 120})
  var notificationsContainer = document.getElementById('notifications')
  client.addExtension({
    outgoing: function(message, callback) {
      message.ext = message.ext || {}
      message.ext.key = user.key
      return callback(message)
    } 
  })

  function updateNumber(n) {
    var num = document.getElementById('num-notifications')
    if(n != parseInt(num.innerText)) {
      num.innerText = n 
    }
  }

  var num = 0

  client.subscribe('/notify/'+user.username, function(data) {
    var c = 'info'
    if(data.error) { c = 'alert' }

    var notification = '<div class="alert-box '+c+' radius notification">';

    if(data.path) {
      notification += '<a href="'
      if(data.search) {
        notification += 'search?search='+data.search+'&'
      } else {
        notification += '?'
      }

      notification += 'path='+data.path+'">'
    }

    notification += data.message

    if(data.path) {
      notification += '</a>' 
    }

    notification += '</div>'

    var d = document.createElement('li')
    d.innerHTML = notification

    updateNumber(data.num)

    num++
    notificationsContainer.appendChild(d)

    setTimeout(function() {
      notificationsContainer.removeChild(d) 
      num--
    }, 2000 + (1000 * num))
  })
})()

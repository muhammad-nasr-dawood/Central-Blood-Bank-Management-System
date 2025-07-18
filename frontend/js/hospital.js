$(function() {
  $('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const data = {
      email: this.email.value,
      password: this.password.value
    };
    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(res) {
        localStorage.setItem('token', res.token);
        $('#loginMsg').html('<div class="alert alert-success">Login successful! Redirecting...</div>');
        let redirectUrl = 'hospital-request.html';
        if (res.role === 'donor') redirectUrl = 'donor-donate.html';
        else if (res.role === 'admin') redirectUrl = 'admin-add-hospital.html';
        setTimeout(function() { window.location.href = redirectUrl; }, 1000);
      },
      error: function(xhr) {
        $('#loginMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Login failed') + '</div>');
      }
    });
  });

  $('#requestForm').on('submit', function(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'hospital-login.html';
      return;
    }
    const data = {
      bloodType: this.bloodType.value,
      quantity: this.quantity.value,
      patientStatus: this.patientStatus.value,
      city: '' // backend will use hospital's city
    };
    $.ajax({
      url: '/api/hospital-request/request',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      data: JSON.stringify(data),
      success: function(res) {
        $('#requestMsg').html('<div class="alert alert-success">Request submitted! ' + (res.message || '') + '</div>');
      },
      error: function(xhr) {
        $('#requestMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Request failed') + '</div>');
      }
    });
  });

  if (window.location.pathname.endsWith('hospital-my-requests.html')) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'hospital-login.html';
    } else {
      $.ajax({
        url: '/api/hospital-request/my',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(res) {
          if (res.requests && res.requests.length > 0) {
            res.requests.forEach(function(r) {
              $('#requestsTable tbody').append(
                `<tr>
                  <td>${r.bloodType}</td>
                  <td>${r.quantity}</td>
                  <td>${r.patientStatus}</td>
                  <td>${r.city}</td>
                  <td>${r.fulfilled ? 'Yes' : 'No'}</td>
                </tr>`
              );
            });
          } else {
            $('#requestsMsg').html('<div class="alert alert-info">No requests found.</div>');
          }
        },
        error: function(xhr) {
          $('#requestsMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Failed to load requests') + '</div>');
        }
      });
    }
  }
}); 
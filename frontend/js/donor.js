$(function() {
  $('#registerForm').on('submit', function(e) {
    e.preventDefault();
    const data = {
      name: this.name.value,
      email: this.email.value,
      password: this.password.value,
      city: this.city.value,
      nationalId: this.nationalId.value,
      latitude: this.latitude.value,
      longitude: this.longitude.value
    };
    $.ajax({
      url: '/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(res) {
        $('#registerMsg').html('<div class="alert alert-success">Registration successful! Please check your email to verify your account.</div>');
      },
      error: function(xhr) {
        $('#registerMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Registration failed') + '</div>');
      }
    });
  });

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
        let redirectUrl = 'donor-donate.html';
        if (res.role === 'admin') redirectUrl = 'admin-add-hospital.html';
        else if (res.role === 'hospital') redirectUrl = 'hospital-request.html';
        setTimeout(function() { window.location.href = redirectUrl; }, 1000);
      },
      error: function(xhr) {
        console.error('Login error:', xhr);
        $('#loginMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Login failed') + '</div>');
      }
    });
  });

  $('#donateForm').on('submit', function(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'donor-login.html';
      return;
    }
    const data = {
      bloodType: this.bloodType.value,
      virusTestResult: this.virusTestResult.value,
      expirationDate: this.expirationDate.value,
      date: new Date().toISOString().split('T')[0], // today
      city: '' // backend will use donor's city
    };
    $.ajax({
      url: '/api/donation/donate',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      data: JSON.stringify(data),
      success: function(res) {
        $('#donateMsg').html('<div class="alert alert-success">Donation submitted! ' + (res.message || '') + '</div>');
      },
      error: function(xhr) {
        $('#donateMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Donation failed') + '</div>');
      }
    });
  });

  if (window.location.pathname.endsWith('donor-my-donations.html')) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'donor-login.html';
    } else {
      $.ajax({
        url: '/api/donation/my',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(res) {
          if (res.donations && res.donations.length > 0) {
            res.donations.forEach(function(d) {
              $('#donationsTable tbody').append(
                `<tr>
                  <td>${d.date ? d.date.split('T')[0] : ''}</td>
                  <td>${d.bloodType}</td>
                  <td>${d.virusTestResult}</td>
                  <td>${d.city}</td>
                  <td>${d.expirationDate ? d.expirationDate.split('T')[0] : ''}</td>
                </tr>`
              );
            });
          } else {
            $('#donationsMsg').html('<div class="alert alert-info">No donations found.</div>');
          }
        },
        error: function(xhr) {
          $('#donationsMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Failed to load donations') + '</div>');
        }
      });
    }
  }
}); 
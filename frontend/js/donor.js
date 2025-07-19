// Print role from token at page load
(function() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[donor.js] Role from token:', payload.role);
    } catch (e) {
      console.log('[donor.js] Could not parse token');
    }
  }
})();

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
        console.log('[donor.js] Role from login response:', res.role);
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
    if (!checkAuthStatus()) return;
    if (!checkRole('donor')) return;
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
}); 
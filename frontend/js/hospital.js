// Print role from token at page load
(function() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[hospital.js] Role from token:', payload.role);
    } catch (e) {
      console.log('[hospital.js] Could not parse token');
    }
  }
})();

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
        console.log('[hospital.js] Role from login response:', res.role);
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
    if (!checkAuthStatus()) return;
    if (!checkRole('hospital')) return;
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
        $('#requestMsg').html('<div class="alert alert-success">Request submitted! '  + '</div>');
      },
      error: function(xhr) {
        $('#requestMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Request failed') + '</div>');
      }
    });
  });
}); 
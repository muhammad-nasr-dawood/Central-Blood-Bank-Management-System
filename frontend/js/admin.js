// Print role from token at page load
(function() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[admin.js] Role from token:', payload.role);
    } catch (e) {
      console.log('[admin.js] Could not parse token');
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
        console.log('[admin.js] Role from login response:', res.role);
        $('#loginMsg').html('<div class="alert alert-success">Login successful! Redirecting...</div>');
        let redirectUrl = 'admin-add-hospital.html';
        if (res.role === 'donor') redirectUrl = 'donor-donate.html';
        else if (res.role === 'hospital') redirectUrl = 'hospital-request.html';
        setTimeout(function() { window.location.href = redirectUrl; }, 1000);
      },
      error: function(xhr) {
        $('#loginMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Login failed') + '</div>');
      }
    });
  });

  $('#addHospitalForm').on('submit', function(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!checkAuthStatus()) return;
    if (!checkRole('admin')) return;
    const data = {
      name: this.name.value,
      email: this.email.value,
      password: this.password.value,
      city: this.city.value,
      latitude: this.latitude.value,
      longitude: this.longitude.value
    };
    $.ajax({
      url: '/api/admin/add-hospital',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      data: JSON.stringify(data),
      success: function(res) {
        $('#addHospitalMsg').html('<div class="alert alert-success">Hospital added! ' + (res.message || '') + '</div>');
      },
      error: function(xhr) {
        $('#addHospitalMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Failed to add hospital') + '</div>');
      }
    });
  });

  $('#addDonationForm').on('submit', function(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!checkAuthStatus()) return;
    if (!checkRole('admin')) return;
    const data = {
      donorEmail: this.donorEmail.value,
      bloodType: this.bloodType.value,
      city: this.city.value,
      virusTestResult: this.virusTestResult.value,
      date: new Date().toISOString().split('T')[0] // today
    };
    $.ajax({
      url: '/api/admin/add-donation',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      data: JSON.stringify(data),
      success: function(res) {
        $('#addDonationMsg').html('<div class="alert alert-success">Donation added! ' + (res.message || '') + '</div>');
      },
      error: function(xhr) {
        $('#addDonationMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Failed to add donation') + '</div>');
      }
    });
  });
}); 